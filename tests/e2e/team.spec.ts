import { expect, test } from '@playwright/test';

import {
    BASE_URL,
    adminCreds,
    expectToast,
    login,
    modal,
    requireAdmin,
    uniqueId,
} from './helpers';

test.describe('Team management', () => {
    test.beforeEach(requireAdmin);

    test('shows the team list and guards the admin own row', async ({
        page,
    }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/team');

        await expect(
            page.getByRole('heading', { name: 'My Team' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Add Member' })
        ).toBeVisible();
        await expect(
            page.getByRole('columnheader', { name: 'Status' })
        ).toBeVisible();
        await expect(
            page.locator('span').filter({ hasText: /^\d+ members?$/ })
        ).toBeVisible();

        // Search narrows to the admin's own row, so the guard below
        // works even once the list spans more than one page.
        await page
            .getByLabel('Search members')
            .fill(adminCreds.email!);

        const ownRow = page
            .getByRole('row')
            .filter({ hasText: adminCreds.email! });
        await expect(ownRow).toBeVisible();
        const deactivate = ownRow.getByRole('button', {
            name: 'Deactivate',
        });
        await expect(deactivate).toBeDisabled();
        await expect(deactivate).toHaveAttribute(
            'title',
            'You cannot deactivate your own account'
        );
    });

    test('validates the add-member form', async ({ page }) => {
        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/team');
        await page.getByRole('button', { name: 'Add Member' }).click();

        const dialog = modal(page, 'Add New Member');
        await expect(dialog).toBeVisible();

        const email = `e2e-validation-${uniqueId()}@example.com`;
        await dialog.getByLabel('Full Name').fill('E2E Validation');
        await dialog.getByLabel('Email').fill(email);
        await dialog.getByLabel('Password', { exact: true }).fill('abc');
        await dialog.getByLabel('Confirm Password').fill('abc');
        await dialog.getByLabel('Role').selectOption({ label: 'Member' });
        await dialog.getByRole('button', { name: 'Add Member' }).click();

        await expectToast(
            page,
            'Password must be at least 8 characters long'
        );

        await dialog.getByLabel('Full Name').fill('E2E Validation');
        await dialog.getByLabel('Email').fill(email);
        await dialog.getByLabel('Password', { exact: true }).fill('E2eMember123');
        await dialog.getByLabel('Confirm Password').fill('Different123');
        await dialog.getByLabel('Role').selectOption({ label: 'Member' });
        await dialog.getByRole('button', { name: 'Add Member' }).click();
        await expectToast(page, 'Passwords do not match');

        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(dialog).toBeHidden();
    });

    test('creates, renames, blocks, deactivates and reactivates a member', async ({
        page,
        browser,
    }) => {
        const stamp = uniqueId();
        const email = `e2e-member-${stamp}@example.com`;
        const password = 'E2eMember123';
        const name = `E2E Member ${stamp}`;

        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/team');

        await page.getByRole('button', { name: 'Add Member' }).click();
        const dialog = modal(page, 'Add New Member');
        await dialog.getByLabel('Full Name').fill(name);
        await dialog.getByLabel('Email').fill(email);
        await dialog.getByLabel('Password', { exact: true }).fill(password);
        await dialog.getByLabel('Confirm Password').fill(password);
        await dialog.getByLabel('Role').selectOption({ label: 'Member' });
        await dialog.getByRole('button', { name: 'Add Member' }).click();

        await expectToast(page, /Account created successfully/);
        await expect(dialog).toBeHidden();

        const row = page.getByRole('row').filter({ hasText: email });
        await expect(row).toBeVisible();
        await expect(row.getByText('Active')).toBeVisible();
        await expect(row).toContainText('user');

        const memberContext = await browser.newContext({
            baseURL: BASE_URL,
        });
        const memberPage = await memberContext.newPage();
        await memberPage.goto('/');
        await memberPage.locator('#email').fill(email);
        await memberPage.locator('#password').fill(password);
        await Promise.all([
            memberPage.waitForURL('**/user/log'),
            memberPage
                .getByRole('button', { name: 'Login', exact: true })
                .click(),
        ]);
        await memberPage.goto('/admin/dashboard');
        await expect(memberPage).toHaveURL(`${BASE_URL}/user/log`);
        await memberContext.close();

        await row.getByRole('button', { name: 'Edit' }).click();
        const editDialog = modal(page, 'Edit Member');
        await editDialog.getByLabel('Full Name').fill(`${name} Jr`);
        await editDialog.getByRole('button', { name: 'Save Changes' }).click();
        await expectToast(page, 'Member name updated successfully!');
        await expect(editDialog).toBeHidden();
        await page.reload();
        await expect(row).toContainText(`${name} Jr`);

        await row.getByRole('button', { name: 'Deactivate' }).click();
        await expectToast(page, 'Member deactivated successfully!');
        await expect(row.getByText('Deactivated')).toBeVisible();
        await expect(
            row.getByRole('button', { name: 'Activate' })
        ).toBeVisible();

        const blockedContext = await browser.newContext({
            baseURL: BASE_URL,
        });
        const blockedPage = await blockedContext.newPage();
        await blockedPage.goto('/');
        await blockedPage.locator('#email').fill(email);
        await blockedPage.locator('#password').fill(password);
        await blockedPage
            .getByRole('button', { name: 'Login', exact: true })
            .click();
        await expect(blockedPage.locator('p.text-red-600')).toContainText(
            'This account has been deactivated. Please contact your administrator.'
        );
        await expect(blockedPage).toHaveURL(`${BASE_URL}/`);
        await blockedContext.close();

        await row.getByRole('button', { name: 'Activate' }).click();
        await expectToast(page, 'Member activated successfully!');
        await expect(row.getByText('Active')).toBeVisible();

        await row.getByRole('button', { name: 'Deactivate' }).click();
        await expect(row.getByText('Deactivated')).toBeVisible();
    });

    test('searches, sorts, paginates and edits the member role', async ({
        page,
    }) => {
        const stamp = uniqueId();
        const email = `e2e-role-${stamp}@example.com`;
        const password = 'E2eMember123';
        const name = `E2E Role ${stamp}`;

        await login(page, adminCreds, '/admin/dashboard');
        await page.goto('/admin/team');

        await page.getByRole('button', { name: 'Add Member' }).click();
        const dialog = modal(page, 'Add New Member');
        await dialog.getByLabel('Full Name').fill(name);
        await dialog.getByLabel('Email').fill(email);
        await dialog.getByLabel('Password', { exact: true }).fill(password);
        await dialog.getByLabel('Confirm Password').fill(password);
        await dialog.getByLabel('Role').selectOption({ label: 'Member' });
        await dialog.getByRole('button', { name: 'Add Member' }).click();
        await expectToast(page, /Account created successfully/);
        await expect(dialog).toBeHidden();

        const row = page.getByRole('row').filter({ hasText: email });
        await expect(row).toBeVisible();

        // Search matches both name and email; a miss shows the empty
        // state, and clearing restores the full list.
        await page.getByLabel('Search members').fill(name);
        await expect(row).toBeVisible();
        await page.getByLabel('Search members').fill(email);
        await expect(row).toBeVisible();
        await page.getByLabel('Search members').fill(`no-match-${stamp}`);
        await expect(
            page.getByText('No team members found.')
        ).toBeVisible();
        await page.getByLabel('Search members').fill('');

        // Name header sort cycles none → A→Z → Z→A → none, and each
        // sorted view really is ordered the way the icon claims.
        const nameHeader = page.getByRole('columnheader', { name: 'Name' });
        await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
        const sortButton = nameHeader.getByRole('button', {
            name: 'Name',
            exact: true,
        });

        await sortButton.click();
        await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
        const ascending = (
            await page.locator('tbody tr td:first-child').allTextContents()
        ).map((text) => text.trim());
        expect(ascending).toEqual(
            [...ascending].sort((a, b) => a.localeCompare(b))
        );

        await sortButton.click();
        await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
        const descending = (
            await page.locator('tbody tr td:first-child').allTextContents()
        ).map((text) => text.trim());
        expect(descending).toEqual(
            [...descending].sort((a, b) => b.localeCompare(a))
        );

        await sortButton.click();
        await expect(nameHeader).toHaveAttribute('aria-sort', 'none');

        // Pagination only appears once the list is longer than one page.
        const countText = await page
            .locator('span')
            .filter({ hasText: /^\d+ members?$/ })
            .textContent();
        const total = Number((countText ?? '').split(' ')[0]);
        if (total > 10) {
            await page.getByRole('button', { name: 'Next page' }).click();
            await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
            await page
                .getByRole('button', { name: 'Previous page' })
                .click();
            await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
        }

        // Role edit: promote, verify, then demote again to leave the
        // shared e2e database with one admin fewer than it gained.
        await row.getByRole('button', { name: 'Edit' }).click();
        const editDialog = modal(page, 'Edit Member');
        await editDialog.getByLabel('Role').selectOption({ label: 'Admin' });
        await editDialog
            .getByRole('button', { name: 'Save Changes' })
            .click();
        await expectToast(page, 'Member role updated successfully!');
        await expect(editDialog).toBeHidden();
        await page.reload();
        await expect(row).toContainText('admin');

        await row.getByRole('button', { name: 'Edit' }).click();
        const demoteDialog = modal(page, 'Edit Member');
        await demoteDialog
            .getByLabel('Role')
            .selectOption({ label: 'Member' });
        await demoteDialog
            .getByRole('button', { name: 'Save Changes' })
            .click();
        await expectToast(page, 'Member role updated successfully!');
        await expect(demoteDialog).toBeHidden();
        await page.reload();
        await expect(row).toContainText('user');
    });
});
