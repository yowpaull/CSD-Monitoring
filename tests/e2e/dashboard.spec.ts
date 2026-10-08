import { expect, test } from '@playwright/test';

import {
    BASE_URL,
    adminCreds,
    login,
    requireAdmin,
    requireUser,
    userCreds,
} from './helpers';

test.describe('Admin dashboard', () => {
    test.beforeEach(requireAdmin);

    test('shows KPIs, charts, the month filter and recent inquiries', async ({
        page,
    }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await expect(
            page.getByRole('heading', { name: 'Dashboard', exact: true })
        ).toBeVisible();

        const totalCard = page
            .locator('div.rounded-xl')
            .filter({ hasText: 'Total Inquiries' });
        const todayCard = page
            .locator('div.rounded-xl')
            .filter({ hasText: "Today's Logs" });
        const repsCard = page
            .locator('div.rounded-xl')
            .filter({ hasText: 'Active Representatives' });

        for (const card of [totalCard, todayCard, repsCard]) {
            await expect(card).toBeVisible();
            await expect(card.locator('p.text-2xl')).toContainText(/\d/);
        }
        await expect(totalCard).toContainText('All time');
        await expect(repsCard).toContainText(
            'Members able to log inquiries'
        );

        const chartTitles = [
            'Status',
            'Inquiries per Week',
            'By Platform',
            'By Brand',
            'By Category',
        ];
        for (const title of chartTitles) {
            const heading = page.getByRole('heading', {
                name: title,
                exact: true,
            });
            await expect(heading).toBeVisible();
            const section = heading.locator('xpath=ancestor::section[1]');
            await expect(
                section
                    .locator('canvas')
                    .or(section.getByText('No data yet'))
                    .first()
            ).toBeVisible();
        }

        const chartImages = page.locator('div[role="img"][aria-label]');
        await expect(chartImages.first()).toBeVisible();
        const imageCount = await chartImages.count();
        for (let i = 0; i < imageCount; i++) {
            await expect(chartImages.nth(i)).toHaveAttribute(
                'aria-label',
                /distribution|per week|counts/
            );
        }

        await expect(
            page.getByRole('heading', { name: 'Recent Inquiries' })
        ).toBeVisible();
        for (const header of [
            'Inquiry Date',
            'Customer',
            'Representative',
            'Platform',
            'Brand',
            'Status',
        ]) {
            await expect(
                page.getByRole('columnheader', { name: header, exact: true })
            ).toBeVisible();
        }
    });

    test('filters charts by month through the URL', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/dashboard');

        const select = page.locator('#dashboard-month-filter');
        await expect(select).toBeVisible();
        const optionCount = await select.locator('option').count();
        test.skip(optionCount < 2, 'No months with inquiry data');

        const monthLabel = (
            await select.locator('option').nth(1).textContent()
        )!.trim();

        await select.selectOption({ label: monthLabel });
        await page.waitForURL(/month=\d{4}-\d{2}/);
        await expect(select).not.toHaveValue('');

        const weeklyHeading = page.getByRole('heading', {
            name: 'Inquiries per Week',
            exact: true,
        });
        await expect(weeklyHeading.locator('..')).toContainText(monthLabel);
        await expect(weeklyHeading.locator('..')).not.toContainText(
            'Last 8 weeks'
        );

        await select.selectOption({ value: '' });
        await page.waitForURL((url) => !url.searchParams.has('month'));
        await expect(weeklyHeading.locator('..')).toContainText(
            'Last 8 weeks'
        );
        await expect(select).toHaveValue('');
    });

    test('links the recent table to the full log list', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/dashboard');

        await page.getByRole('link', { name: 'View All' }).click();
        await page.waitForURL('**/admin/inquiry-logs');
        await expect(
            page.getByRole('heading', { name: 'Customer Inquiry Logs' })
        ).toBeVisible();
    });
});

test.describe('Dashboard access', () => {
    test.beforeEach(requireUser);

    test('redirects members to their own home', async ({ page }) => {
        await login(page, userCreds, '/user/log');
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(`${BASE_URL}/user/log`);
        await expect(
            page.getByRole('heading', { name: 'Log Customer Inquiry' })
        ).toBeVisible();
    });
});
