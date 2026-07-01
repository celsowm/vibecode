import { existsSync, readFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const cwd = process.cwd();
export const serverRoot =
  basename(cwd) === 'server' ? cwd : join(cwd, 'server');
export const prismaRoot = join(serverRoot, 'prisma');
export const testDatabaseUrl = 'file:./test.sqlite';

export const testIds = {
  users: {
    admin: 'test-user-admin',
    sindico: 'test-user-sindico',
    resident: 'test-user-resident',
    otherResident: 'test-user-other-resident',
    inactive: 'test-user-inactive',
  },
  units: {
    resident: 'test-unit-a101',
    otherResident: 'test-unit-b202',
  },
  fee: 'test-fee-july',
  overdueFee: 'test-fee-june',
  charges: {
    resident: 'test-charge-resident',
    otherResident: 'test-charge-other-resident',
    overdue: 'test-charge-overdue',
  },
  commonArea: 'test-common-area-party-room',
  bookings: {
    otherResident: 'test-booking-other-resident',
  },
  announcements: {
    pinned: 'test-announcement-pinned',
    regular: 'test-announcement-regular',
  },
  maintenance: {
    resident: 'test-maintenance-resident',
    otherResident: 'test-maintenance-other-resident',
  },
};

export const credentials = {
  admin: { email: 'admin@condominio.test', password: 'admin123' },
  sindico: { email: 'sindico@condominio.test', password: 'sindico123' },
  resident: { email: 'morador@condominio.test', password: 'morador123' },
  otherResident: {
    email: 'outro.morador@condominio.test',
    password: 'morador123',
  },
  inactive: { email: 'inativo@condominio.test', password: 'inativo123' },
};

export function configureTestEnvironment(databaseUrl = testDatabaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'test-jwt-secret';
}

export async function migrateTestDatabase(databaseUrl = testDatabaseUrl) {
  configureTestEnvironment(databaseUrl);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const migrationSql = readFileSync(
    join(prismaRoot, 'migrations', '20260701135036_init', 'migration.sql'),
    'utf8',
  );
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await prisma.$disconnect();
}

export async function seedTestDatabase(databaseUrl = testDatabaseUrl) {
  configureTestEnvironment(databaseUrl);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const passwordHashes = {
    admin: await bcrypt.hash(credentials.admin.password, 10),
    sindico: await bcrypt.hash(credentials.sindico.password, 10),
    resident: await bcrypt.hash(credentials.resident.password, 10),
    otherResident: await bcrypt.hash(credentials.otherResident.password, 10),
    inactive: await bcrypt.hash(credentials.inactive.password, 10),
  };

  await prisma.$transaction([
    prisma.maintenanceComment.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.commonArea.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.charge.deleteMany(),
    prisma.fee.deleteMany(),
    prisma.resident.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: [
      {
        id: testIds.users.admin,
        name: 'Admin Teste',
        email: credentials.admin.email,
        passwordHash: passwordHashes.admin,
        role: 'ADMIN',
      },
      {
        id: testIds.users.sindico,
        name: 'Sindico Teste',
        email: credentials.sindico.email,
        passwordHash: passwordHashes.sindico,
        role: 'SINDICO',
      },
      {
        id: testIds.users.resident,
        name: 'Morador Teste',
        email: credentials.resident.email,
        passwordHash: passwordHashes.resident,
        role: 'MORADOR',
      },
      {
        id: testIds.users.otherResident,
        name: 'Outro Morador',
        email: credentials.otherResident.email,
        passwordHash: passwordHashes.otherResident,
        role: 'MORADOR',
      },
      {
        id: testIds.users.inactive,
        name: 'Usuario Inativo',
        email: credentials.inactive.email,
        passwordHash: passwordHashes.inactive,
        role: 'MORADOR',
        isActive: false,
      },
    ],
  });

  await prisma.unit.createMany({
    data: [
      {
        id: testIds.units.resident,
        identifier: 'Bloco A - Apto 101',
        block: 'A',
        number: '101',
      },
      {
        id: testIds.units.otherResident,
        identifier: 'Bloco B - Apto 202',
        block: 'B',
        number: '202',
      },
    ],
  });

  await prisma.resident.createMany({
    data: [
      {
        id: 'test-resident-link-main',
        userId: testIds.users.resident,
        unitId: testIds.units.resident,
        isOwner: true,
      },
      {
        id: 'test-resident-link-other',
        userId: testIds.users.otherResident,
        unitId: testIds.units.otherResident,
        isOwner: false,
      },
    ],
  });

  await prisma.fee.create({
    data: {
      id: testIds.fee,
      description: 'Condominio Julho',
      amount: 500,
      referenceMonth: 7,
      referenceYear: 2026,
      dueDay: 10,
    },
  });

  await prisma.fee.create({
    data: {
      id: testIds.overdueFee,
      description: 'Condominio Junho',
      amount: 250,
      referenceMonth: 6,
      referenceYear: 2026,
      dueDay: 10,
    },
  });

  await prisma.charge.createMany({
    data: [
      {
        id: testIds.charges.resident,
        feeId: testIds.fee,
        unitId: testIds.units.resident,
        amount: 500,
        dueDate: new Date('2026-07-10T12:00:00.000Z'),
        status: 'PENDING',
      },
      {
        id: testIds.charges.otherResident,
        feeId: testIds.fee,
        unitId: testIds.units.otherResident,
        amount: 500,
        dueDate: new Date('2026-07-10T12:00:00.000Z'),
        status: 'PENDING',
      },
      {
        id: testIds.charges.overdue,
        feeId: testIds.overdueFee,
        unitId: testIds.units.otherResident,
        amount: 250,
        dueDate: new Date('2026-06-10T12:00:00.000Z'),
        status: 'OVERDUE',
      },
    ],
  });

  await prisma.commonArea.create({
    data: {
      id: testIds.commonArea,
      name: 'Salao de Festas',
      description: 'Espaco para eventos',
      capacity: 40,
      openTime: '08:00',
      closeTime: '22:00',
    },
  });

  await prisma.booking.create({
    data: {
      id: testIds.bookings.otherResident,
      commonAreaId: testIds.commonArea,
      createdById: testIds.users.otherResident,
      startsAt: new Date('2026-07-20T18:00:00.000Z'),
      endsAt: new Date('2026-07-20T20:00:00.000Z'),
      notes: 'Reserva existente',
    },
  });

  await prisma.announcement.createMany({
    data: [
      {
        id: testIds.announcements.regular,
        title: 'Aviso comum',
        body: 'Conteudo do aviso comum',
        authorId: testIds.users.admin,
        pinned: false,
        createdAt: new Date('2026-07-01T10:00:00.000Z'),
      },
      {
        id: testIds.announcements.pinned,
        title: 'Aviso fixado',
        body: 'Conteudo do aviso fixado',
        authorId: testIds.users.sindico,
        pinned: true,
        createdAt: new Date('2026-06-30T10:00:00.000Z'),
      },
    ],
  });

  await prisma.maintenanceRequest.createMany({
    data: [
      {
        id: testIds.maintenance.resident,
        title: 'Luz da garagem',
        description: 'Lampada queimada na vaga',
        priority: 'HIGH',
        openedById: testIds.users.resident,
        unitId: testIds.units.resident,
      },
      {
        id: testIds.maintenance.otherResident,
        title: 'Vazamento externo',
        description: 'Vazamento perto do jardim',
        priority: 'MEDIUM',
        openedById: testIds.users.otherResident,
        unitId: testIds.units.otherResident,
      },
    ],
  });

  await prisma.maintenanceComment.create({
    data: {
      id: 'test-maintenance-comment-initial',
      requestId: testIds.maintenance.resident,
      authorId: testIds.users.admin,
      message: 'Equipe acionada',
      createdAt: new Date('2026-07-01T11:00:00.000Z'),
    },
  });

  await prisma.$disconnect();
}

export async function prepareTestDatabase(databaseUrl = testDatabaseUrl) {
  const sqlitePath = resolveSqlitePath(databaseUrl);
  if (existsSync(sqlitePath)) {
    rmSync(sqlitePath);
  }
  await migrateTestDatabase(databaseUrl);
  await seedTestDatabase(databaseUrl);
}

function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith('file:')) {
    return join(prismaRoot, 'test.sqlite');
  }

  const rawPath = databaseUrl.slice(5);
  if (/^[A-Za-z]:[\\/]/.test(rawPath)) {
    return rawPath;
  }

  return resolve(prismaRoot, rawPath);
}
