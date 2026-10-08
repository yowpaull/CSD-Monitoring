import { expect, test } from '@playwright/test';

import {
    expectToast,
    localDateTimeNow,
    login,
    modal,
    requireSelectOptions,
    requireUser,
    toasts,
    uniqueId,
    userCreds,
} from './helpers';

async function fillRequiredLogFields(page: import('@playwright/test').Page) {
    await page.locator('[name=inquiry_datetime]').fill(localDateTimeNow());
    await page.locator('[name=platform_id]').selectOption({ index: 1 });
    await page.locator('[name=brand_id]').selectOption({ index: 1 });
    await page
        .locator('[name=inquiry_sub_category_id]')
        .selectOption({ index: 1 });
    await page.locator('[name=customer_name]').fill('E2E Customer');
    await page.locator('[name=status]').selectOption({ label: 'Open' });
}

test.describe('Logging an inquiry', () => {
    test.beforeEach(requireUser);

    test('renders every form section', async ({ page }) => {
        await login(page, userCreds, '/user/log');
        await expect(
            page.getByRole('heading', { name: 'Log Customer Inquiry' })
        ).toBeVisible();

        for (const section of [
            'General Information',
            'Conversation Information',
            'Customer Information',
            'Concern and Response',
        ]) {
            await expect(
                page.getByRole('heading', { name: section, exact: true })
            ).toBeVisible();
        }

        const representative = page.locator('input[readonly]');
        await expect(representative).toBeVisible();
        await expect(representative).not.toHaveValue('');
        await expect(
            page.getByRole('button', { name: 'Submit Log' })
        ).toBeVisible();
    });

    test('blocks empty submits and flags impossible times', async ({
        page,
    }) => {
        await login(page, userCreds, '/user/log');

        await page.getByRole('button', { name: 'Submit Log' }).click();
        await expect(toasts(page)).toHaveCount(0);
        await expect(page).toHaveURL('**/user/log');

        await requireSelectOptions(page, 'platform_id');
        await requireSelectOptions(page, 'brand_id');
        await requireSelectOptions(page, 'inquiry_sub_category_id');

        await fillRequiredLogFields(page);
        await page.locator('[name=start_attended]').fill('10:00');
        await page.locator('[name=end_attended]').fill('09:00');
        await page.getByRole('button', { name: 'Submit Log' }).click();

        await expectToast(
            page,
            'End time cannot be earlier than start time.'
        );
        await expect(page).toHaveURL('**/user/log');
    });

    test('creates a log, then edits and deletes it', async ({ page }) => {
        await login(page, userCreds, '/user/log');

        await requireSelectOptions(page, 'platform_id');
        await requireSelectOptions(page, 'brand_id');
        await requireSelectOptions(page, 'inquiry_sub_category_id');

        const customer = `E2E Cust ${uniqueId()}`;
        await fillRequiredLogFields(page);
        await page.locator('[name=customer_name]').fill(customer);
        await page.locator('[name=start_attended]').fill('10:00');
        await page.locator('[name=end_attended]').fill('10:30');
        await page.getByRole('button', { name: 'Submit Log' }).click();
        await expectToast(page, 'Inquiry logged successfully!');

        await page.goto('/user/logs');
        await expect(
            page.getByRole('heading', { name: 'My Inquiry Logs' })
        ).toBeVisible();
        await expect(
            page.getByRole('form', { name: 'Filter inquiry logs' })
        ).toBeVisible();

        const row = page.getByRole('row').filter({ hasText: customer });
        await expect(row).toBeVisible();
        await expect(row).toContainText('Open');

        const exportLink = page.getByRole('link', {
            name: 'Export to Excel',
        });
        if ((await exportLink.getAttribute('aria-disabled')) !== 'true') {
            const downloadPromise = page.waitForEvent('download');
            await exportLink.click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(
                /^my-inquiry-logs-\d{4}-\d{2}(-\d{2})?\.xlsx$/
            );
        }

        await row.getByRole('button', { name: 'Edit' }).click();
        const editModal = modal(page, 'Edit Inquiry Log');
        await expect(editModal).toBeVisible();
        await editModal
            .getByRole('button', { name: 'Save Changes' })
            .click();
        await expectToast(page, 'Inquiry log updated.');
        await expect(editModal).toBeHidden();

        await row.getByRole('button', { name: 'Delete' }).click();
        const deleteModal = modal(page, 'Delete Inquiry Log');
        await expect(deleteModal).toBeVisible();
        await expect(deleteModal).toContainText(customer);
        await deleteModal.getByRole('button', { name: 'Delete Log' }).click();
        await expectToast(page, 'Inquiry log deleted.');
        await expect(deleteModal).toBeHidden();
        await expect(
            page.getByRole('row').filter({ hasText: customer })
        ).toHaveCount(0);
    });
});
