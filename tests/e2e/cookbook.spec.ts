import { test, expect } from '@playwright/test';
const demo = 'http://127.0.0.1:4173';
const auth = 'http://127.0.0.1:4175/tests/e2e/auth.html';
test.beforeEach(async ({ page }) => {
  // Fail any attempted external network use, including Firebase production.
  const external: string[] = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    external.push(url.origin); return route.abort();
  });
  (page as any).__external = external;
});
test.afterEach(async ({ page }) => { expect((page as any).__external).toEqual([]); });

test('demo edits are disposable; cancel discards changes and repeated submit saves once', async ({ page }) => {
  await page.goto(demo);
  await page.getByRole('button', { name: /Kremet sitronpasta/ }).first().click();
  await page.getByRole('button', { name: 'Lagre i kokeboken', exact: true }).click();
  await page.getByRole('button', { name: 'Lagre oppskrift', exact: true }).click();
  await page.getByRole('button', { name: /Kremet sitronpasta/ }).first().click();
  await page.getByRole('button', { name: 'Rediger', exact: true }).click();
  await page.getByLabel('Hva heter retten?').fill('Avbrutt endring');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Avbrutt endring' })).toHaveCount(0);
  await page.getByRole('button', { name: /Kremet sitronpasta/ }).first().click();
  await page.getByRole('button', { name: 'Rediger', exact: true }).click();
  await page.getByLabel('Hva heter retten?').fill('Bare denne økten');
  await page.getByRole('button', { name: 'Lagre oppskrift', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole('heading', { name: 'Bare denne økten', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.recipe-card h3').filter({ hasText: /^Bare denne økten$/ })).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Kremet sitronpasta', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bare denne økten' })).toHaveCount(0);
});

test('portions reach shopping list exactly once and reload clears it', async ({ page }) => {
  await page.goto(demo);
  await page.getByRole('button', { name: /Kremet sitronpasta/ }).first().click();
  await page.getByRole('button', { name: 'Én porsjon mer' }).click();
  await expect(page.locator('.portion-control')).toContainText('3 porsjoner');
  await page.getByRole('button', { name: 'Legg i handlelisten' }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  await expect(page.locator('.inline-status')).toContainText('3 porsjoner');
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: /Handleliste/ }).click();
  const pasta = page.locator('.shopping-items li').filter({ has: page.locator('b', { hasText: /^pasta$/ }) });
  await expect(pasta).toHaveCount(1);
  await expect(pasta).toContainText('300 g');
  await pasta.locator('label').click();
  await expect(pasta.getByRole('checkbox')).toBeChecked();
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: /Handleliste/ }).click();
  await expect(page.getByRole('heading', { name: 'Hva skal vi lage?' })).toBeVisible();
});

test('demo loading state and unsupported remote import error', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/demo-*.js', async route => { await gate; await route.continue(); });
  await page.goto(demo, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Åpner kokeboken …', { exact: true })).toBeVisible();
  release();
  await page.getByRole('button', { name: 'Importer oppskrift' }).click();
  await page.getByLabel('Lim inn oppskriftslenken').fill('https://www.matprat.no/oppskrifter/test');
  await page.getByRole('button', { name: 'Hent oppskrift', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('locked non-demo ignores preview query and never opens cookbook', async ({ page }) => {
  await page.goto('http://127.0.0.1:4174/?preview=1');
  await expect(page.getByText('Innloggingen åpner når kokeboken er klar.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fortsett' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ny oppskrift' })).toHaveCount(0);
});

test('real callable rejects stranger and unverified invited account stays outside cookbook', async ({ page, request }) => {
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9099');
  const reset = await request.delete('http://127.0.0.1:9099/emulator/v1/projects/demo-julies-kokebok/accounts');
  expect(reset.ok()).toBeTruthy();
  await page.goto(auth);
  await page.getByLabel('E-postadresse').fill('stranger@example.com');
  await page.getByRole('button', { name: 'Fortsett' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Julies kokebok/ })).toBeVisible();
  await page.getByLabel('E-postadresse').fill('julie@example.com');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/emailSignInOptions', async route => { calls++; await gate; await route.continue(); });
  await page.getByRole('button', { name: 'Fortsett' }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  await expect(page.getByRole('button', { name: 'Fortsett' })).toBeDisabled();
  release();
  await expect(page.getByRole('heading', { name: /Velg ditt første passord/ })).toBeVisible();
  expect(calls).toBe(1);
  await page.getByLabel('Nytt passord', { exact: true }).fill('Browser test passphrase');
  await page.getByLabel('Bekreft passord', { exact: true }).fill('Browser test passphrase');
  await page.getByRole('button', { name: 'Opprett passord', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Sjekk e-posten din/ })).toBeVisible();
  await page.getByRole('button', { name: 'Jeg har bekreftet e-posten' }).click();
  await expect(page.getByRole('heading', { name: /Sjekk e-posten din/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ny oppskrift' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Sjekk e-posten din/ })).toBeVisible();
});
