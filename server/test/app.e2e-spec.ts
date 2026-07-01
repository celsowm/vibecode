import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { credentials, prepareTestDatabase, testIds } from './test-database';
import { createTestApp, login } from './test-app';

describe('Condominio API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let sindicoToken: string;
  let residentToken: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await prepareTestDatabase();
    app = await createTestApp();
    adminToken = await login(
      app,
      credentials.admin.email,
      credentials.admin.password,
    );
    sindicoToken = await login(
      app,
      credentials.sindico.email,
      credentials.sindico.password,
    );
    residentToken = await login(
      app,
      credentials.resident.email,
      credentials.resident.password,
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('auth and authorization', () => {
    it('logs in, rejects invalid credentials and rejects inactive users', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: credentials.admin.email,
          password: credentials.admin.password,
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toEqual(expect.any(String));
      expect(loginResponse.body.user).toMatchObject({
        id: testIds.users.admin,
        role: 'ADMIN',
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.admin.email, password: 'wrong' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: credentials.inactive.email,
          password: credentials.inactive.password,
        })
        .expect(401);
    });

    it('returns the current user and protects authenticated routes', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set(auth(adminToken))
        .expect(200);

      expect(response.body).toMatchObject({
        id: testIds.users.admin,
        email: credentials.admin.email,
        role: 'ADMIN',
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('enforces role permissions', async () => {
      await request(app.getHttpServer())
        .post('/units')
        .set(auth(sindicoToken))
        .send({ identifier: 'Bloco C - Apto 301', block: 'C', number: '301' })
        .expect(403);

      await request(app.getHttpServer())
        .get('/users')
        .set(auth(residentToken))
        .expect(403);
    });
  });

  describe('users, units and residents', () => {
    let createdUserId: string;
    let createdUnitId: string;
    let residentLinkId: string;

    it('creates, lists, updates and deactivates users', async () => {
      const created = await request(app.getHttpServer())
        .post('/auth/register')
        .set(auth(adminToken))
        .send({
          name: 'Novo Morador',
          email: 'novo.morador@condominio.test',
          password: 'novo123',
          role: 'MORADOR',
        })
        .expect(201);

      createdUserId = created.body.id;
      expect(created.body.passwordHash).toBeUndefined();

      const list = await request(app.getHttpServer())
        .get('/users')
        .set(auth(sindicoToken))
        .expect(200);
      expect(
        list.body.some((user: { id: string }) => user.id === createdUserId),
      ).toBe(true);

      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set(auth(adminToken))
        .send({ name: 'Novo Morador Editado' })
        .expect(200)
        .expect(({ body }) => expect(body.name).toBe('Novo Morador Editado'));

      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set(auth(adminToken))
        .expect(200)
        .expect(({ body }) => expect(body.isActive).toBe(false));
    });

    it('creates, lists, updates and deletes units', async () => {
      const created = await request(app.getHttpServer())
        .post('/units')
        .set(auth(adminToken))
        .send({ identifier: 'Bloco C - Apto 301', block: 'C', number: '301' })
        .expect(201);

      createdUnitId = created.body.id;

      await request(app.getHttpServer())
        .get('/units')
        .set(auth(sindicoToken))
        .expect(200)
        .expect(({ body }) =>
          expect(
            body.some((unit: { id: string }) => unit.id === createdUnitId),
          ).toBe(true),
        );

      await request(app.getHttpServer())
        .patch(`/units/${createdUnitId}`)
        .set(auth(adminToken))
        .send({ identifier: 'Bloco C - Apto 302', number: '302' })
        .expect(200)
        .expect(({ body }) => expect(body.number).toBe('302'));
    });

    it('links, updates, prevents duplicate links and removes resident links', async () => {
      const link = await request(app.getHttpServer())
        .post('/residents')
        .set(auth(adminToken))
        .send({
          userId: testIds.users.resident,
          unitId: createdUnitId,
          isOwner: false,
        })
        .expect(201);

      residentLinkId = link.body.id;

      await request(app.getHttpServer())
        .post('/residents')
        .set(auth(adminToken))
        .send({
          userId: testIds.users.resident,
          unitId: createdUnitId,
          isOwner: false,
        })
        .expect(409);

      await request(app.getHttpServer())
        .patch(`/residents/${residentLinkId}`)
        .set(auth(sindicoToken))
        .send({ isOwner: true })
        .expect(200)
        .expect(({ body }) => expect(body.isOwner).toBe(true));

      await request(app.getHttpServer())
        .delete(`/residents/${residentLinkId}`)
        .set(auth(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/units/${createdUnitId}`)
        .set(auth(adminToken))
        .expect(200);
    });
  });

  describe('finance', () => {
    let feeId: string;
    let generatedChargeId: string;

    it('creates fees and reports duplicate month/year through DB constraint behavior', async () => {
      const response = await request(app.getHttpServer())
        .post('/finance/fees')
        .set(auth(adminToken))
        .send({
          description: 'Condominio Agosto',
          amount: 600,
          referenceMonth: 8,
          referenceYear: 2026,
          dueDay: 10,
        })
        .expect(201);

      feeId = response.body.id;

      await request(app.getHttpServer())
        .post('/finance/fees')
        .set(auth(adminToken))
        .send({
          description: 'Condominio Agosto Duplicado',
          amount: 600,
          referenceMonth: 8,
          referenceYear: 2026,
          dueDay: 10,
        })
        .expect(500);
    });

    it('generates charges for all units without duplicates', async () => {
      const first = await request(app.getHttpServer())
        .post(`/finance/fees/${feeId}/generate-charges`)
        .set(auth(sindicoToken))
        .expect(201);

      expect(first.body).toMatchObject({ unitsCharged: 2, totalUnits: 2 });

      const second = await request(app.getHttpServer())
        .post(`/finance/fees/${feeId}/generate-charges`)
        .set(auth(sindicoToken))
        .expect(201);

      expect(second.body).toMatchObject({ unitsCharged: 0, totalUnits: 2 });

      const charges = await request(app.getHttpServer())
        .get('/finance/charges')
        .set(auth(adminToken))
        .expect(200);
      generatedChargeId = charges.body.find(
        (charge: { feeId: string }) => charge.feeId === feeId,
      ).id;
    });

    it('scopes charge access for residents', async () => {
      const residentCharges = await request(app.getHttpServer())
        .get('/finance/charges')
        .set(auth(residentToken))
        .expect(200);

      expect(residentCharges.body.length).toBeGreaterThan(0);
      expect(
        residentCharges.body.every(
          (charge: { unitId: string }) =>
            charge.unitId === testIds.units.resident,
        ),
      ).toBe(true);

      await request(app.getHttpServer())
        .get(`/finance/charges/${testIds.charges.otherResident}`)
        .set(auth(residentToken))
        .expect(404);
    });

    it('registers partial and full payments and marks charges as paid', async () => {
      await request(app.getHttpServer())
        .post('/finance/payments')
        .set(auth(adminToken))
        .send({ chargeId: generatedChargeId, amountPaid: 100, method: 'PIX' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/finance/charges/${generatedChargeId}`)
        .set(auth(adminToken))
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('PENDING'));

      await request(app.getHttpServer())
        .post('/finance/payments')
        .set(auth(adminToken))
        .send({ chargeId: generatedChargeId, amountPaid: 500, method: 'PIX' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/finance/charges/${generatedChargeId}`)
        .set(auth(adminToken))
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('PAID'));
    });

    it('cancels charges and returns delinquency report', async () => {
      await request(app.getHttpServer())
        .patch(`/finance/charges/${testIds.charges.resident}/cancel`)
        .set(auth(sindicoToken))
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('CANCELED'));

      await request(app.getHttpServer())
        .get('/finance/reports/delinquency')
        .set(auth(adminToken))
        .expect(200)
        .expect(({ body }) =>
          expect(
            body.some(
              (charge: { id: string }) => charge.id === testIds.charges.overdue,
            ),
          ).toBe(true),
        );
    });
  });

  describe('bookings', () => {
    let commonAreaId: string;
    let residentBookingId: string;

    it('creates common areas and bookings', async () => {
      const area = await request(app.getHttpServer())
        .post('/common-areas')
        .set(auth(adminToken))
        .send({ name: 'Churrasqueira', openTime: '09:00', closeTime: '21:00' })
        .expect(201);

      commonAreaId = area.body.id;

      const booking = await request(app.getHttpServer())
        .post('/bookings')
        .set(auth(residentToken))
        .send({
          commonAreaId,
          startsAt: '2026-07-21T18:00:00.000Z',
          endsAt: '2026-07-21T20:00:00.000Z',
          notes: 'Aniversario',
        })
        .expect(201);

      residentBookingId = booking.body.id;
      expect(booking.body.createdById).toBe(testIds.users.resident);
    });

    it('rejects invalid and overlapping booking windows', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .set(auth(residentToken))
        .send({
          commonAreaId,
          startsAt: '2026-07-22T20:00:00.000Z',
          endsAt: '2026-07-22T18:00:00.000Z',
        })
        .expect(409);

      await request(app.getHttpServer())
        .post('/bookings')
        .set(auth(residentToken))
        .send({
          commonAreaId,
          startsAt: '2026-07-21T19:00:00.000Z',
          endsAt: '2026-07-21T21:00:00.000Z',
        })
        .expect(409);
    });

    it('allows owner and staff cancellation while blocking other residents', async () => {
      await request(app.getHttpServer())
        .delete(`/${'bookings'}/${testIds.bookings.otherResident}`)
        .set(auth(residentToken))
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/bookings/${residentBookingId}`)
        .set(auth(residentToken))
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('CANCELED'));

      await request(app.getHttpServer())
        .delete(`/bookings/${testIds.bookings.otherResident}`)
        .set(auth(adminToken))
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe('CANCELED'));
    });
  });

  describe('announcements', () => {
    it('lists pinned announcements first and supports create, update and delete', async () => {
      const initial = await request(app.getHttpServer())
        .get('/announcements')
        .set(auth(residentToken))
        .expect(200);

      expect(initial.body[0]).toMatchObject({
        id: testIds.announcements.pinned,
        pinned: true,
      });

      const created = await request(app.getHttpServer())
        .post('/announcements')
        .set(auth(sindicoToken))
        .send({
          title: 'Manutencao elevador',
          body: 'Elevador parado amanha',
          pinned: false,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/announcements/${created.body.id}`)
        .set(auth(adminToken))
        .send({ pinned: true })
        .expect(200)
        .expect(({ body }) => expect(body.pinned).toBe(true));

      await request(app.getHttpServer())
        .delete(`/announcements/${created.body.id}`)
        .set(auth(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .post('/announcements')
        .set(auth(residentToken))
        .send({ title: 'Nao autorizado', body: 'Falha', pinned: false })
        .expect(403);
    });
  });

  describe('maintenance', () => {
    let createdRequestId: string;

    it('creates, lists and scopes requests by resident', async () => {
      const created = await request(app.getHttpServer())
        .post('/maintenance')
        .set(auth(residentToken))
        .send({
          title: 'Portao travando',
          description: 'Portao da garagem travando',
          priority: 'HIGH',
        })
        .expect(201);

      createdRequestId = created.body.id;

      const residentList = await request(app.getHttpServer())
        .get('/maintenance')
        .set(auth(residentToken))
        .expect(200);

      expect(
        residentList.body.every(
          (item: { openedById: string }) =>
            item.openedById === testIds.users.resident,
        ),
      ).toBe(true);

      await request(app.getHttpServer())
        .get(`/maintenance/${testIds.maintenance.otherResident}`)
        .set(auth(residentToken))
        .expect(403);

      await request(app.getHttpServer())
        .get(`/maintenance/${testIds.maintenance.otherResident}`)
        .set(auth(adminToken))
        .expect(200);
    });

    it('updates status resolvedAt and appends ordered comments', async () => {
      const resolved = await request(app.getHttpServer())
        .patch(`/maintenance/${createdRequestId}/status`)
        .set(auth(adminToken))
        .send({ status: 'RESOLVED' })
        .expect(200);

      expect(resolved.body.status).toBe('RESOLVED');
      expect(resolved.body.resolvedAt).toEqual(expect.any(String));

      const reopened = await request(app.getHttpServer())
        .patch(`/maintenance/${createdRequestId}/status`)
        .set(auth(sindicoToken))
        .send({ status: 'OPEN' })
        .expect(200);

      expect(reopened.body.resolvedAt).toBeNull();

      await request(app.getHttpServer())
        .post(`/maintenance/${createdRequestId}/comments`)
        .set(auth(residentToken))
        .send({ message: 'Ainda preciso de retorno' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/maintenance/${createdRequestId}/comments`)
        .set(auth(adminToken))
        .send({ message: 'Tecnico agendado' })
        .expect(201);

      const detail = await request(app.getHttpServer())
        .get(`/maintenance/${createdRequestId}`)
        .set(auth(residentToken))
        .expect(200);

      expect(
        detail.body.comments.map(
          (comment: { message: string }) => comment.message,
        ),
      ).toEqual(['Ainda preciso de retorno', 'Tecnico agendado']);
    });
  });
});
