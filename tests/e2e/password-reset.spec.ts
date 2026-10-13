import { expect, test, type Page } from '@playwright/test';

import {
    BASE_URL,
    expectToast,
    login,
    requireUser,
    uniqueId,
    userCreds,
} from './helpers';

async function submitResetRequest(page: Page, email: string) {
    await page.goto('/forgot-password');
    await page.locator('#email').fill(email);
    await page
        .getByRole('button', { name: 'Send reset link', exact: true })
        .click();
}

test.describe('Forgot password', () => {
    test('links from the login page', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Forgot password?' }).click();

        await expect(page).toHaveURL(`${BASE_URL}/forgot-password`);
        await expect(
            page.getByRole('heading', { name: 'Forgot Password' })
        ).toBeVisible();
    });

    test('keeps an invalid email from submitting', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.locator('#email').fill('not-an-email');
        await page
            .getByRole('button', { name: 'Send reset link', exact: true })
            .click();

        await expect(page).toHaveURL(`${BASE_URL}/forgot-password`);
        await expect(
            page.getByRole('heading', { name: 'Forgot Password' })
        ).toBeVisible();
        await expect(page.locator('.Toastify__toast')).toHaveCount(0);
    });

    test('always answers with a generic confirmation', async ({ page }) => {
        await submitResetRequest(page, `e2e-reset-${uniqueId()}@example.com`);

        await expect(
            page.getByRole('heading', { name: 'Check your email' })
        ).toBeVisible();
        await expect(
            page
                .getByRole('main')
                .getByText('If an account exists for that email')
        ).toBeVisible();
    });

    test('rate limits repeated requests for the same address', async ({
        page,
    }) => {
        const email = `e2e-reset-${uniqueId()}@example.com`;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            await submitResetRequest(page, email);
            await expect(
                page.getByRole('heading', { name: 'Check your email' })
            ).toBeVisible();
        }

        await submitResetRequest(page, email);

        await expect(page.locator('p.text-red-600')).toContainText(
            'Too many reset requests'
        );
        await expectToast(page, /Too many reset requests/);
    });

    test('refuses a reset from a session without a recovery link', async ({
        page,
    }) => {
        requireUser();

        await login(page, userCreds, '/user/log');
        await page.goto('/reset-password');

        await page.locator('#password').fill('NewSecret123');
        await page.locator('#confirm_password').fill('NewSecret123');
        await page
            .getByRole('button', { name: 'Update password', exact: true })
            .click();

        await expect(page.locator('p.text-red-600')).toContainText(
            'invalid or has expired'
        );
        await expect(
            page.getByRole('heading', { name: 'Set a new password' })
        ).toBeVisible();
    });
});
