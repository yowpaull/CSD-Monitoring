import { expect, test, type Locator, type Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:3210';

export type Creds = { email?: string; password?: string };

export const adminCreds: Creds = {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
};

export const userCreds: Creds = {
    email: process.env.E2E_USER_EMAIL,
    password: process.env.E2E_USER_PASSWORD,
};

export function requireAdmin() {
    test.skip(
        !adminCreds.email || !adminCreds.password,
        'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set (see .env.e2e.example)'
    );
}

export function requireUser() {
    test.skip(
        !userCreds.email || !userCreds.password,
        'E2E_USER_EMAIL and E2E_USER_PASSWORD are not set (see .env.e2e.example)'
    );
}

export async function login(page: Page, creds: Creds, homePath: string) {
    await page.goto('/');
    await page.locator('#email').fill(creds.email!);
    await page.locator('#password').fill(creds.password!);
    await Promise.all([
        page.waitForURL(`**${homePath}`),
        page.getByRole('button', { name: 'Login', exact: true }).click(),
    ]);
}

export function toasts(page: Page): Locator {
    return page.locator('.Toastify__toast');
}

export async function expectToast(page: Page, text: string | RegExp) {
    await expect(toasts(page).filter({ hasText: text })).toBeVisible();
}

export async function clearToast(page: Page, text: string | RegExp) {
    await expect(toasts(page).filter({ hasText: text })).toHaveCount(0);
}

export function modal(page: Page, heading: string): Locator {
    return page
        .getByRole('heading', { name: heading, exact: true })
        .locator(
            'xpath=ancestor::div[contains(@class,"fixed") or @role="dialog"][1]'
        );
}

export function uniqueId(): string {
    return `${Date.now().toString(36)}${Math.floor(Math.random() * 10_000)}`;
}

export function localDateTimeNow(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function requireSelectOptions(page: Page, name: string) {
    const select = page.locator(`[name=${name}]`);
    if ((await select.locator('option').count()) < 2) {
        test.skip(true, `No ${name} options are seeded in the database`);
    }
}
