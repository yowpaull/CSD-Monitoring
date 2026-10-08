import { expect, test } from '@playwright/test';

import {
    BASE_URL,
    adminCreds,
    expectToast,
    login,
    requireAdmin,
    requireUser,
    userCreds,
} from './helpers';

test.describe('Login', () => {
    test('renders the form and toggles password visibility', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(
            page.getByRole('heading', { name: 'Welcome Back' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Login', exact: true })
        ).toBeVisible();

        const password = page.locator('#password');
        await password.fill('Secret123');
        await expect(password).toHaveAttribute('type', 'password');

        await page.getByRole('button', { name: 'Show password' }).click();
        await expect(password).toHaveAttribute('type', 'text');
        await expect(
            page.getByRole('button', { name: 'Hide password' })
        ).toHaveAttribute('aria-pressed', 'true');

        await page.getByRole('button', { name: 'Hide password' }).click();
        await expect(password).toHaveAttribute('type', 'password');
    });

    test('keeps an invalid email from submitting', async ({ page }) => {
        await page.goto('/');
        await page.locator('#email').fill('not-an-email');
        await page.locator('#password').fill('whatever123');
        await page
            .getByRole('button', { name: 'Login', exact: true })
            .click();
        await expect(page).toHaveURL(`${BASE_URL}/`);
        await expect(page.locator('.Toastify__toast')).toHaveCount(0);
    });

    test('shows an error for unknown credentials', async ({ page }) => {
        await page.goto('/');
        await page.locator('#email').fill('e2e-nobody@example.com');
        await page.locator('#password').fill('WrongPass123');
        await page
            .getByRole('button', { name: 'Login', exact: true })
            .click();

        await expect(page.locator('p.text-red-600')).toContainText(
            'Invalid Email or Password! Please try again.'
        );
        await expectToast(
            page,
            'Invalid Email or Password! Please try again.'
        );
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('rejects a wrong password for a real account', async ({ page }) => {
        test.skip(
            !adminCreds.email,
            'E2E_ADMIN_EMAIL is not set (see .env.e2e.example)'
        );
        await page.goto('/');
        await page.locator('#email').fill(adminCreds.email!);
        await page.locator('#password').fill('WrongPass123');
        await page
            .getByRole('button', { name: 'Login', exact: true })
            .click();

        await expect(page.locator('p.text-red-600')).toContainText(
            'Invalid Email or Password! Please try again.'
        );
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });
});

test.describe('Route protection', () => {
    test('redirects signed-out visitors to the login page', async ({
        page,
    }) => {
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(`${BASE_URL}/`);
        await expect(
            page.getByRole('heading', { name: 'Welcome Back' })
        ).toBeVisible();
    });

    test('sends an admin to the dashboard after login', async ({ page }) => {
        test.skip(
            !adminCreds.email || !adminCreds.password,
            'E2E_ADMIN_* credentials are not set'
        );
        await login(page, adminCreds, '/admin/dashboard');
        await expect(
            page.getByRole('heading', { name: 'Dashboard' })
        ).toBeVisible();
    });

    test('sends a regular member to their log page', async ({ page }) => {
        test.skip(
            !userCreds.email || !userCreds.password,
            'E2E_USER_* credentials are not set'
        );
        await login(page, userCreds, '/user/log');
        await expect(
            page.getByRole('heading', { name: 'Log Customer Inquiry' })
        ).toBeVisible();
    });

    test('bounces a signed-in member away from the admin area', async ({
        page,
    }) => {
        test.skip(
            !userCreds.email || !userCreds.password,
            'E2E_USER_* credentials are not set'
        );
        await login(page, userCreds, '/user/log');
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(`${BASE_URL}/user/log`);
    });

    test('bounces a signed-in user off the login page', async ({ page }) => {
        test.skip(
            !adminCreds.email || !adminCreds.password,
            'E2E_ADMIN_* credentials are not set'
        );
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/');
        await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });

    test('signs out back to the login page', async ({ page }) => {
        test.skip(
            !adminCreds.email || !adminCreds.password,
            'E2E_ADMIN_* credentials are not set'
        );
        await login(page, adminCreds, '/admin/dashboard');
        await page.getByRole('button', { name: 'Sign out' }).click();
        await expect(page).toHaveURL(`${BASE_URL}/`);
        await expect(
            page.getByRole('heading', { name: 'Welcome Back' })
        ).toBeVisible();
    });
});

test.describe('Admin sidebar navigation', () => {
    test.beforeEach(requireAdmin);

    test('reaches every admin section from the sidebar', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');

        const sections: Array<[string, string]> = [
            ['Dashboard', 'Dashboard'],
            ['Customer Inquiry Logs', 'Customer Inquiry Logs'],
            ['Brands', 'Brands'],
            ['Platforms', 'Platforms'],
            ['Inquiry Types', 'Inquiry Categories'],
            ['Team', 'My Team'],
            ['Profile', 'Your Profile'],
        ];

        for (const [linkName, heading] of sections) {
            await page
                .getByRole('link', { name: linkName, exact: true })
                .click();
            await expect(
                page.getByRole('heading', { name: heading, exact: true })
            ).toBeVisible();
        }
    });
});

test.describe('User sidebar navigation', () => {
    test.beforeEach(requireUser);

    test('reaches every member section from the sidebar', async ({ page }) => {
        await login(page, userCreds, '/user/log');

        await page.getByRole('link', { name: 'My Logs', exact: true }).click();
        await expect(page).toHaveURL(`${BASE_URL}/user/logs`);
        await expect(
            page.getByRole('heading', { name: 'My Inquiry Logs' })
        ).toBeVisible();

        await page.getByRole('link', { name: 'Profile', exact: true }).click();
        await expect(page).toHaveURL(`${BASE_URL}/user/profile`);
        await expect(
            page.getByRole('heading', { name: 'Your Profile' })
        ).toBeVisible();

        await page.getByRole('link', { name: 'Log', exact: true }).click();
        await expect(page).toHaveURL(`${BASE_URL}/user/log`);
        await expect(
            page.getByRole('heading', { name: 'Log Customer Inquiry' })
        ).toBeVisible();
    });
});
