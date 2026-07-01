import { expect, type Page } from '@playwright/test';
import { credentials, testIds } from '../../server/test/test-database';

export { credentials, testIds };

export async function loginAs(page: Page, role: keyof typeof credentials) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(credentials[role].email);
  await page.getByRole('textbox', { name: 'Senha' }).fill(credentials[role].password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(/Sistema de Condomínio/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
}
