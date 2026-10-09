import { statSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import {
    adminCreds,
    expectToast,
    login,
    modal,
    requireAdmin,
} from './helpers';

async function gotoLogs(page: Page) {
    await login(page, adminCreds, '/admin/dashboard');
    await page.goto('/admin/inquiry-logs');
    await expect(
        page.getByRole('heading', { name: 'Customer Inquiry Logs' })
    ).toBeVisible();
    await expect(page.locator('p[aria-live="polite"]')).toBeVisible();
}

async function requireLogs(page: Page) {
    const summary = page.locator('p[aria-live="polite"]');
    if (await summary.getByText('No inquiry logs found.').isVisible()) {
        test.skip(true, 'No inquiry logs in the database');
    }
}

test.describe('Inquiry logs', () => {
    test.beforeEach(requireAdmin);

    test('shows the filter form, table and export controls', async ({
        page,
    }) => {
        await gotoLogs(page);

        const form = page.getByRole('form', { name: 'Filter inquiry logs' });
        await expect(form).toBeVisible();
        for (const label of [
            'Brand',
            'Platform',
            'Representative',
            'Inquiry Type',
            'Status',
            'Rows per page',
        ]) {
            await expect(form.getByLabel(label, { exact: true })).toBeVisible();
        }

        for (const header of [
            'Inquiry Date & Time',
            'Platform',
            'Brand',
            'Representative',
            'Status',
            'Actions',
        ]) {
            await expect(
                page.getByRole('columnheader', { name: header, exact: true })
            ).toBeVisible();
        }

        const summary = page.locator('p[aria-live="polite"]');
        await expect(summary).toContainText(
            /Showing .* of .* logs|No inquiry logs found\./
        );
        await expect(
            page.getByRole('link', { name: 'Export to Excel' })
        ).toBeVisible();
        await expect(page.getByLabel('Export month')).toBeVisible();
    });

    test('filters by status and clears the filter again', async ({ page }) => {
        await gotoLogs(page);
        await requireLogs(page);

        const form = page.getByRole('form', { name: 'Filter inquiry logs' });
        await form
            .getByLabel('Status', { exact: true })
            .selectOption({ label: 'Closed' });
        await page.waitForURL(/status=Closed/);

        const rows = page.locator('tbody tr');
        const firstCellCount = await rows.first().locator('td').count();
        if (firstCellCount > 1) {
            const visible = Math.min(await rows.count(), 3);
            for (let i = 0; i < visible; i++) {
                await expect(rows.nth(i).locator('td').nth(15)).toHaveText(
                    'Closed'
                );
            }
        }

        await page.getByRole('button', { name: 'Clear Filters' }).click();
        await page.waitForURL((url) => !url.searchParams.has('status'));
        await expect(
            page.getByRole('button', { name: 'Clear Filters' })
        ).toBeDisabled();
    });

    test('paginates when there is more than one page', async ({ page }) => {
        await gotoLogs(page);
        await requireLogs(page);

        const nav = page.getByRole('navigation', { name: 'Pagination' });
        if (!(await nav.isVisible())) {
            test.skip(true, 'Fewer logs than one page of results');
        }

        await nav.getByRole('link', { name: 'Next page' }).click();
        await page.waitForURL(/page=2/);
        await expect(page.getByText(/^Page 2 of \d+$/)).toBeVisible();

        await nav.getByRole('link', { name: 'Previous page' }).click();
        await page.waitForURL(
            (url) =>
                !url.searchParams.get('page') ||
                url.searchParams.get('page') === '1'
        );
    });

    test('exports the selected month as an xlsx file', async ({ page }) => {
        await gotoLogs(page);
        await requireLogs(page);

        const link = page.getByRole('link', { name: 'Export to Excel' });
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        await expect(link).toHaveAttribute(
            'href',
            new RegExp(`inquiry_from=${month}-\\d{2}`)
        );

        const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
        await page.locator('#export_month').fill(previousMonth);
        await expect(link).toHaveAttribute(
            'href',
            new RegExp(`inquiry_from=${previousMonth}-\\d{2}`)
        );
        await page.locator('#export_month').fill(month);
        await expect(link).toHaveAttribute(
            'href',
            new RegExp(`inquiry_from=${month}-\\d{2}`)
        );

        if ((await link.getAttribute('aria-disabled')) === 'true') {
            test.skip(true, 'No logs recorded in the current month');
        }

        const downloadPromise = page.waitForEvent('download');
        await link.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(
            `inquiry-logs-${month}.xlsx`
        );
        const filePath = await download.path();
        expect(filePath).not.toBeNull();
        expect(statSync(filePath!).size).toBeGreaterThan(1000);
    });

    test('opens the view and edit modals for a log', async ({ page }) => {
        await gotoLogs(page);
        await requireLogs(page);

        const firstRow = page.locator('tbody tr').first();

        await firstRow.getByRole('button', { name: 'View' }).click();
        const viewModal = modal(page, 'Inquiry Log Details');
        await expect(viewModal).toBeVisible();
        await expect(viewModal).toContainText('General Information');
        await expect(viewModal).toContainText('Record Information');
        await viewModal
            .getByRole('button', { name: 'Close', exact: true })
            .click();
        await expect(viewModal).toBeHidden();

        await firstRow.getByRole('button', { name: 'Edit' }).click();
        const editModal = modal(page, 'Edit Inquiry Log');
        await expect(editModal).toBeVisible();
        await expect(editModal).toContainText('Changes apply to this log only');
        await editModal
            .getByRole('button', { name: 'Save Changes' })
            .click();
        await expectToast(page, 'Inquiry log updated.');
        await expect(editModal).toBeHidden();
    });
});
