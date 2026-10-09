import { expect, test } from '@playwright/test';

import {
    adminCreds,
    expectToast,
    login,
    modal,
    requireAdmin,
    uniqueId,
} from './helpers';

test.describe('Inquiry categories', () => {
    test.beforeEach(requireAdmin);

    test('builds and tears down a category hierarchy', async ({ page }) => {
        test.slow();
        page.on('dialog', (dialog) => dialog.accept());

        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/inquiry-types');
        await expect(
            page.getByRole('heading', { name: 'Inquiry Categories' })
        ).toBeVisible();

        const stamp = uniqueId();
        const catName = `E2E Cat ${stamp}`;
        const mainName = `E2E Main ${stamp}`;
        const subName = `E2E Sub ${stamp}`;

        await page
            .getByRole('button', { name: 'Add Inquiry Category' })
            .first()
            .click();
        let dialog = modal(page, 'Add Inquiry Category');
        await expect(dialog).toBeVisible();
        await dialog.getByPlaceholder('Enter name').fill(catName);
        await dialog
            .getByPlaceholder('Enter short description')
            .fill('Created by the e2e suite');
        await dialog.getByRole('button', { name: 'Add', exact: true }).click();
        await expectToast(page, 'Inquiry category created successfully.');
        await expect(dialog).toBeHidden();

        const card = page
            .locator('div.overflow-hidden.rounded-xl')
            .filter({ hasText: stamp })
            .first();
        await expect(card).toBeVisible();
        const header = card.locator('div.border-b.border-gray-200');

        await header.getByRole('button', { name: '+ Main Category' }).click();
        dialog = modal(page, 'Add Main Category');
        await dialog.getByPlaceholder('Enter name').fill(mainName);
        await dialog.getByRole('button', { name: 'Add', exact: true }).click();
        await expectToast(page, 'Main category created successfully.');
        await expect(dialog).toBeHidden();

        await header.getByRole('button', { name: 'Edit' }).click();
        dialog = modal(page, 'Edit Inquiry Category');
        await dialog.getByPlaceholder('Enter name').fill(`${catName} Edited`);
        await dialog
            .getByRole('button', { name: 'Save Changes' })
            .click();
        await expectToast(page, 'Inquiry category updated successfully.');
        await expect(dialog).toBeHidden();
        await expect(card).toContainText(`${catName} Edited`);

        const ensureCategoryOpen = async () => {
            if ((await card.getByText(mainName, { exact: true }).count()) === 0) {
                await header.getByRole('button').first().click();
            }
            await expect(card.getByText(mainName, { exact: true })).toBeVisible();
        };
        await ensureCategoryOpen();

        const mainRow = card
            .locator('div.px-6.py-4')
            .filter({ hasText: mainName })
            .first();

        await mainRow.getByRole('button', { name: '+ Sub Category' }).click();
        dialog = modal(page, 'Add Sub Category');
        await dialog.getByPlaceholder('Enter name').fill(subName);
        await dialog.getByRole('button', { name: 'Add', exact: true }).click();
        await expectToast(page, 'Sub-category created successfully.');
        await expect(dialog).toBeHidden();
        await expect(mainRow).toContainText('1 sub-categories');

        if ((await mainRow.getByText(subName, { exact: true }).count()) === 0) {
            await mainRow.getByRole('button').first().click();
        }
        await expect(mainRow.getByText(subName, { exact: true })).toBeVisible();

        await mainRow.getByRole('button', { name: 'Delete' }).last().click();
        await expectToast(page, 'Sub-category deleted successfully.');
        await expect(
            mainRow.getByText(subName, { exact: true })
        ).toHaveCount(0);

        await mainRow.getByRole('button', { name: 'Delete' }).first().click();
        await expectToast(page, 'Main category deleted successfully.');
        await expect(mainRow).toHaveCount(0);

        await header.getByRole('button', { name: 'Delete' }).click();
        await expectToast(page, 'Inquiry category deleted successfully.');
        await expect(card).toHaveCount(0);
    });
});
