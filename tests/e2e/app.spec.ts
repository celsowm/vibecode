import { expect, test } from '@playwright/test';
import { credentials, loginAs, testIds } from './helpers';

test.describe.configure({ mode: 'serial' });

test('auth, dashboard and role-aware navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Login').fill(credentials.admin.email);
  await page.getByRole('textbox', { name: 'Senha' }).fill('wrong');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Login ou senha inválidos')).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Login').fill(credentials.admin.email);
  await page.getByRole('textbox', { name: 'Senha' }).fill(credentials.admin.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Admin Teste' })).toBeVisible();
  await expect(page.getByText('Cobranças em atraso')).toBeVisible();
  await expect(page.getByText('Avisos publicados')).toBeVisible();
  await expect(page.getByText('Chamados abertos')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unidades' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cobranças' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).first().click();
  await page.goto('/login');
  await loginAs(page, 'resident');
  await expect(page.getByRole('button', { name: 'Minhas Cobranças' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unidades' })).toHaveCount(0);
  await page.goto('/units');
  await expect(page).toHaveURL(/\/$/);
});

test('admin manages units and residents', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Unidades' }).first().click();
  await expect(page.getByRole('heading', { name: 'Unidades e Moradores' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova Unidade' }).click();
  const unitDialog = page.getByRole('dialog', { name: 'Nova Unidade' });
  await unitDialog.getByLabel('Identificador').fill('Bloco D - Apto 401');
  await unitDialog.getByRole('textbox', { name: 'Bloco' }).fill('D');
  await unitDialog.getByRole('textbox', { name: 'Número' }).fill('401');
  await unitDialog.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Bloco D - Apto 401')).toBeVisible();

  await page.getByLabel('Vincular morador Bloco D - Apto 401').click();
  const residentDialog = page.getByRole('dialog', { name: 'Vincular Morador' });
  await residentDialog.getByLabel('Modo').click();
  await page.getByRole('option', { name: 'Criar novo usuário' }).click();
  await residentDialog.getByLabel('Nome').fill('Moradora Playwright');
  await residentDialog.getByLabel('E-mail').fill('moradora.playwright@condominio.test');
  await residentDialog.getByLabel('Senha').fill('playwright123');
  await residentDialog.getByLabel('Proprietário?').click();
  await page.getByRole('option', { name: 'Sim (proprietário)' }).click();
  await residentDialog.getByRole('button', { name: 'Vincular' }).click();
  await expect(page.getByText('Moradora Playwright (proprietário)')).toBeVisible();

  await page.getByLabel('Excluir unidade Bloco D - Apto 401').click();
  await expect(page.getByText('Bloco D - Apto 401')).toBeVisible();
});

test('finance workflows cover fee generation, filtering, payments and resident charge scope', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Cobranças' }).first().click();
  await expect(page.getByRole('heading', { name: 'Financeiro - Cobranças' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova Taxa Mensal' }).click();
  await page.getByLabel('Descrição').fill('Condominio Setembro');
  await page.getByLabel('Valor').fill('700');
  await page.getByLabel('Mês de referência').fill('9');
  await page.getByLabel('Ano de referência').fill('2026');
  await page.getByLabel('Dia de vencimento').fill('12');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Condominio Setembro')).toBeVisible();

  await page.getByRole('row', { name: /Condominio Setembro/ }).getByRole('button', { name: 'Gerar cobranças' }).click();
  await expect(page.getByText('Bloco A - Apto 101')).toBeVisible();

  await page.getByLabel(/Registrar pagamento Bloco A - Apto 101/).first().click();
  await page.getByLabel('Valor pago').fill('700');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await page.getByLabel('Filtrar status').click();
  await page.getByRole('option', { name: 'Pago' }).click();
  await expect(page.getByText('Condominio Setembro')).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).first().click();
  await page.goto('/login');
  await loginAs(page, 'resident');
  await page.getByRole('button', { name: 'Minhas Cobranças' }).first().click();
  await expect(page.getByRole('heading', { name: 'Minhas Cobranças' })).toBeVisible();
  await expect(page.getByText('Condominio Julho')).toBeVisible();
});

test('bookings create areas, reject conflicts and cancel reservations', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Reservas' }).first().click();

  await page.getByRole('button', { name: 'Nova Área Comum' }).click();
  await page.getByLabel('Nome').fill('Espaco Gourmet');
  await page.getByRole('button', { name: 'Salvar' }).click();

  await page.getByRole('button', { name: 'Nova Reserva' }).click();
  await page.getByLabel('Área comum').click();
  await page.getByRole('option', { name: 'Espaco Gourmet' }).click();
  await page.getByLabel('Início').fill('2026-07-25T18:00');
  await page.getByLabel('Fim').fill('2026-07-25T20:00');
  await page.getByLabel('Observações').fill('Reserva Playwright');
  await page.getByRole('button', { name: 'Reservar' }).click();
  await expect(page.getByText('Espaco Gourmet')).toBeVisible();

  await page.getByRole('button', { name: 'Nova Reserva' }).click();
  await page.getByLabel('Área comum').click();
  await page.getByRole('option', { name: 'Espaco Gourmet' }).click();
  await page.getByLabel('Início').fill('2026-07-25T19:00');
  await page.getByLabel('Fim').fill('2026-07-25T21:00');
  await page.getByRole('button', { name: 'Reservar' }).click();
  await expect(page.getByText(/Já existe uma reserva confirmada/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await page.getByLabel('Cancelar reserva Espaco Gourmet').first().click();
  await expect(page.getByText('Cancelado')).toBeVisible();
});

test('announcements honor staff-only actions and resident visibility', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Avisos' }).first().click();
  await page.getByRole('button', { name: 'Novo Aviso' }).click();
  await page.getByLabel('Título').fill('Aviso Playwright');
  await page.getByLabel('Conteúdo').fill('Conteudo criado pelo teste');
  await page.getByLabel('Fixar no topo').check();
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Aviso Playwright')).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).first().click();
  await page.goto('/login');
  await loginAs(page, 'resident');
  await page.getByRole('button', { name: 'Avisos' }).first().click();
  await expect(page.getByText('Aviso Playwright')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novo Aviso' })).toHaveCount(0);
});

test('maintenance request lifecycle and resident isolation', async ({ page, request }) => {
  await loginAs(page, 'resident');
  await page.getByRole('button', { name: 'Chamados' }).first().click();
  await page.getByRole('button', { name: 'Abrir Chamado' }).click();
  await page.getByLabel('Título').fill('Interfone com ruido');
  await page.getByLabel('Descrição').fill('Interfone da unidade com ruido constante');
  await page.getByLabel('Prioridade').click();
  await page.getByRole('option', { name: 'Alta' }).click();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Interfone com ruido')).toBeVisible();

  await page.getByText('Interfone com ruido').click();
  await page.getByPlaceholder('Adicionar comentário...').fill('Comentario do morador');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Comentario do morador')).toBeVisible();

  const loginResponse = await request.post('http://localhost:3100/auth/login', {
    data: { email: credentials.resident.email, password: credentials.resident.password },
  });
  const token = (await loginResponse.json()).accessToken as string;
  const forbidden = await request.get(
    `http://localhost:3100/maintenance/${testIds.maintenance.otherResident}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(forbidden.status()).toBe(403);

  await page.getByRole('button', { name: 'Sair' }).first().click();
  await page.goto('/login');
  await loginAs(page, 'admin');
  await page.getByRole('button', { name: 'Chamados' }).first().click();
  await page.getByText('Interfone com ruido').click();
  await page.getByLabel('Alterar status').click();
  await page.getByRole('option', { name: 'Resolvido' }).click();
  await expect(page.getByRole('combobox', { name: 'Alterar status' })).toHaveText('Resolvido');
});
