import { expect, test } from '@playwright/test';

import {
    adminCreds,
    expectToast,
    login,
    modal,
    requireAdmin,
    uniqueId,
} from './helpers';

test.describe('Platform management', () => {
    test.beforeEach(requireAdmin);

    test('searches the platform list', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/platforms');
        await expect(
            page.getByRole('heading', { name: 'Platforms' })
        ).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();

        if (await page.getByText('No platforms found.').isVisible()) {
            test.skip(true, 'No platforms are seeded');
        }

        const search = page.getByPlaceholder('Search platforms...');
        await search.fill('zzz-no-such-platform-zzz');
        await expect(page.getByText('No platforms found.')).toBeVisible();
        await search.fill('');
        await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('creates, duplicate-checks, toggles and deletes a platform', async ({
        page,
    }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/platforms');
        await expect(
            page.getByRole('heading', { name: 'Platforms' })
        ).toBeVisible();

        const name = `E2E Platform ${uniqueId()}`;

        await page.getByRole('button', { name: 'Add Platform' }).click();
        let dialog = modal(page, 'Add Platform');
        await expect(dialog).toBeVisible();
        await dialog.locator('input[type="text"]').fill(name);
        await dialog.getByRole('button', { name: 'Add Platform' }).click();
        await expect(dialog).toBeHidden();

        const row = page.getByRole('row').filter({ hasText: name });
        await expect(row).toBeVisible();
        await expect(row.getByText('Active')).toBeVisible();

        await page.getByRole('button', { name: 'Add Platform' }).click();
        dialog = modal(page, 'Add Platform');
        await dialog.locator('input[type="text"]').fill(name);
        await dialog.getByRole('button', { name: 'Add Platform' }).click();
        await expectToast(page, /already exists/);
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(dialog).toBeHidden();

        await row.getByRole('button', { name: 'Edit' }).click();
        dialog = modal(page, 'Edit Platform');
        await expect(dialog).toBeVisible();
        await dialog.locator('select').selectOption({ label: 'Inactive' });
        await dialog.getByRole('button', { name: 'Save Changes' }).click();
        await expect(dialog).toBeHidden();
        await expect(row.getByText('Inactive')).toBeVisible();

        await row.getByRole('button', { name: 'Edit' }).click();
        dialog = modal(page, 'Edit Platform');
        await dialog.locator('select').selectOption({ label: 'Active' });
        await dialog.getByRole('button', { name: 'Save Changes' }).click();
        await expect(dialog).toBeHidden();
        await expect(row.getByText('Active')).toBeVisible();

        await row.getByRole('button', { name: 'Delete' }).click();
        dialog = modal(page, 'Delete Platform');
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(name);
        await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(row).toHaveCount(0);
    });
});
