import { expect, test, type Page } from '@playwright/test';

import {
    expectToast,
    localDateTimeNow,
    login,
    modal,
    requireSelectOptions,
    requireUser,
    uniqueId,
    userCreds,
} from './helpers';

async function fillRequiredLogFields(page: Page) {
    await page.locator('[name=inquiry_datetime]').fill(localDateTimeNow());
    await page.locator('[name=platform_id]').selectOption({ index: 1 });
    await page.locator('[name=brand_id]').selectOption({ index: 1 });
    await page
        .locator('[name=inquiry_sub_category_id]')
        .selectOption({ index: 1 });
    await page.locator('[name=customer_name]').fill('E2E Open Customer');
    await page.locator('[name=thread_number]').fill('200');
    await page.locator('[name=status]').selectOption({ label: 'Open' });
}

async function createOpenLog(page: Page, customer: string) {
    await login(page, userCreds, '/user/log');

    await requireSelectOptions(page, 'platform_id');
    await requireSelectOptions(page, 'brand_id');
    await requireSelectOptions(page, 'inquiry_sub_category_id');

    await fillRequiredLogFields(page);
    await page.locator('[name=customer_name]').fill(customer);
    await page.locator('[name=start_attended]').fill('11:00');
    await page.locator('[name=end_attended]').fill('11:30');
    await page.getByRole('button', { name: 'Submit Log' }).click();
    await expectToast(page, 'Inquiry logged successfully!');
}

test.describe('Open Inquiry Logs', () => {
    test.beforeEach(requireUser);

    test('lists an open log with Continue and Close, and no Status filter', async ({
        page,
    }) => {
        const customer = `E2E Open ${uniqueId()}`;
        await createOpenLog(page, customer);

        await page.goto('/user/open-inquiry-logs');
        await expect(
            page.getByRole('heading', { name: 'Open Inquiry Logs' })
        ).toBeVisible();

        const form = page.getByRole('form', { name: 'Filter inquiry logs' });
        await expect(form).toBeVisible();

        // The pool is always Open, so the status filter is hidden, but the
        // representative filter is live (logs can belong to anyone).
        await expect(
            form.getByLabel('Status', { exact: true })
        ).toHaveCount(0);
        await expect(
            form.getByLabel('Representative', { exact: true })
        ).toBeVisible();

        // Last Updated By is a first-class column.
        await expect(
            page.getByRole('columnheader', { name: 'Last Updated By' })
        ).toBeVisible();

        const row = page.getByRole('row').filter({ hasText: customer });
        await expect(row).toBeVisible();
        await expect(row).toContainText('Open');

        // Scope-aware actions: Continue + Close, never View/Edit/Delete.
        await expect(row.getByRole('button', { name: 'Continue' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Close' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'View' })).toHaveCount(0);
        await expect(row.getByRole('button', { name: 'Edit' })).toHaveCount(0);
        await expect(row.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    });

    test('Close asks for confirmation, closes the log, and removes it from the pool', async ({
        page,
    }) => {
        const customer = `E2E Close ${uniqueId()}`;
        await createOpenLog(page, customer);

        await page.goto('/user/open-inquiry-logs');
        const row = page.getByRole('row').filter({ hasText: customer });
        await expect(row).toBeVisible();

        // "Close" is a confirmation dialog, not the edit form.
        await row.getByRole('button', { name: 'Close' }).click();
        const closeDialog = modal(page, 'Close Inquiry Log');
        await expect(closeDialog).toBeVisible();
        await expect(closeDialog).toContainText(customer);
        await expect(closeDialog).toContainText('Closed');
        await expect(
            closeDialog.getByRole('button', { name: 'Cancel' })
        ).toBeVisible();

        await closeDialog
            .getByRole('button', { name: 'Close Inquiry' })
            .click();
        await expectToast(page, 'Inquiry log closed.');
        await expect(closeDialog).toBeHidden();

        // Once Closed, the log no longer belongs to the pool.
        await expect(
            page.getByRole('row').filter({ hasText: customer })
        ).toHaveCount(0);
    });

    test('Continue opens the edit form with the stored status intact', async ({
        page,
    }) => {
        const customer = `E2E Continue ${uniqueId()}`;
        await createOpenLog(page, customer);

        await page.goto('/user/open-inquiry-logs');
        const row = page.getByRole('row').filter({ hasText: customer });
        await expect(row).toBeVisible();

        await row.getByRole('button', { name: 'Continue' }).click();
        const editModal = modal(page, 'Edit Inquiry Log');
        await expect(editModal).toBeVisible();

        // Continue does not force a status change.
        await expect(editModal.locator('[name=status]')).toHaveValue('Open');
        await expect(editModal.locator('[name=customer_name]')).toHaveValue(
            customer
        );

        await editModal
            .getByRole('button', { name: 'Close modal' })
            .click();
        await expect(editModal).toBeHidden();
    });

    test('Pending logs belong to the pool and close the same way', async ({
        page,
    }) => {
        const customer = `E2E Pending ${uniqueId()}`;
        await login(page, userCreds, '/user/log');

        await requireSelectOptions(page, 'platform_id');
        await requireSelectOptions(page, 'brand_id');
        await requireSelectOptions(page, 'inquiry_sub_category_id');

        await fillRequiredLogFields(page);
        await page.locator('[name=customer_name]').fill(customer);
        await page.locator('[name=start_attended]').fill('11:00');
        await page.locator('[name=end_attended]').fill('11:30');
        await page.locator('[name=status]').selectOption({ label: 'Pending' });
        await page.getByRole('button', { name: 'Submit Log' }).click();
        await expectToast(page, 'Inquiry logged successfully!');

        await page.goto('/user/open-inquiry-logs');
        const row = page.getByRole('row').filter({ hasText: customer });
        await expect(row).toBeVisible();
        await expect(row).toContainText('Pending');
        await expect(row.getByRole('button', { name: 'Close' })).toBeVisible();

        await row.getByRole('button', { name: 'Close' }).click();
        const closeDialog = modal(page, 'Close Inquiry Log');
        await expect(closeDialog).toBeVisible();

        await closeDialog
            .getByRole('button', { name: 'Close Inquiry' })
            .click();
        await expectToast(page, 'Inquiry log closed.');
        await expect(closeDialog).toBeHidden();

        await expect(
            page.getByRole('row').filter({ hasText: customer })
        ).toHaveCount(0);
    });
});
