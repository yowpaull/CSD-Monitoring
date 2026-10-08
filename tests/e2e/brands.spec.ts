import { expect, test } from '@playwright/test';

import {
    adminCreds,
    expectToast,
    login,
    modal,
    requireAdmin,
    uniqueId,
} from './helpers';

test.describe('Brand management', () => {
    test.beforeEach(requireAdmin);

    test('searches the brand list', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/brands');
        await expect(page.getByRole('heading', { name: 'Brands' })).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();

        if (await page.getByText('No brands found.').isVisible()) {
            test.skip(true, 'No brands are seeded');
        }

        const search = page.getByPlaceholder('Search brands...');
        await search.fill('zzz-no-such-brand-zzz');
        await expect(page.getByText('No brands found.')).toBeVisible();
        await search.fill('');
        await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('creates, duplicate-checks, toggles and deletes a brand', async ({
        page,
    }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/brands');
        await expect(page.getByRole('heading', { name: 'Brands' })).toBeVisible();

        const name = `E2E Brand ${uniqueId()}`;

        await page.getByRole('button', { name: 'Add Brand' }).click();
        let dialog = modal(page, 'Add Brand');
        await expect(dialog).toBeVisible();
        await dialog.locator('input[type="text"]').fill(name);
        await dialog.getByRole('button', { name: 'Add Brand' }).click();
        await expect(dialog).toBeHidden();

        const row = page.getByRole('row').filter({ hasText: name });
        await expect(row).toBeVisible();
        await expect(row.getByText('Active')).toBeVisible();

        await page.getByRole('button', { name: 'Add Brand' }).click();
        dialog = modal(page, 'Add Brand');
        await dialog.locator('input[type="text"]').fill(name);
        await dialog.getByRole('button', { name: 'Add Brand' }).click();
        await expectToast(page, /already exists/);
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(dialog).toBeHidden();

        await row.getByRole('button', { name: 'Edit' }).click();
        dialog = modal(page, 'Edit Brand');
        await expect(dialog).toBeVisible();
        await dialog.locator('select').selectOption({ label: 'Inactive' });
        await dialog.getByRole('button', { name: 'Save Changes' }).click();
        await expect(dialog).toBeHidden();
        await expect(row.getByText('Inactive')).toBeVisible();

        await row.getByRole('button', { name: 'Edit' }).click();
        dialog = modal(page, 'Edit Brand');
        await dialog.locator('select').selectOption({ label: 'Active' });
        await dialog.getByRole('button', { name: 'Save Changes' }).click();
        await expect(dialog).toBeHidden();
        await expect(row.getByText('Active')).toBeVisible();

        await row.getByRole('button', { name: 'Delete' }).click();
        dialog = modal(page, 'Delete Brand');
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(name);
        await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(row).toHaveCount(0);
    });
});
