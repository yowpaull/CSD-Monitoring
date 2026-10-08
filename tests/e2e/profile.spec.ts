import { expect, test } from '@playwright/test';

import {
    clearToast,
    expectToast,
    login,
    requireUser,
    uniqueId,
    userCreds,
} from './helpers';

test.describe('Profile', () => {
    test.beforeEach(requireUser);

    test('shows account details and the password form', async ({ page }) => {
        await login(page, userCreds, '/user/log');
        await page.goto('/user/profile');

        await expect(
            page.getByRole('heading', { name: 'Your Profile' })
        ).toBeVisible();
        await expect(page.getByText('Email', { exact: true })).toBeVisible();
        await expect(
            page.getByText('Member since', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByText('Last sign-in', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Change Password' })
        ).toBeVisible();
        await expect(page.locator('#full_name')).not.toHaveValue('');
        await expect(
            page.getByRole('button', { name: 'Save Changes' })
        ).toBeVisible();
        await expect(
            page
                .getByRole('button', { name: 'Change Password', exact: true })
        ).toBeVisible();
        await expect(
            page.getByLabel('Current Password', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByLabel('New Password', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByLabel('Confirm New Password', { exact: true })
        ).toBeVisible();

        const current = page.getByLabel('Current Password', { exact: true });
        await current.fill('Secret123');
        await page
            .getByRole('button', { name: 'Show password' })
            .first()
            .click();
        await expect(current).toHaveAttribute('type', 'text');
    });

    test('updates the display name and restores it', async ({ page }) => {
        await login(page, userCreds, '/user/log');
        await page.goto('/user/profile');

        const input = page.locator('#full_name');
        const original = await input.inputValue();
        const changed = `E2E Tester ${uniqueId()}`;

        await input.fill(changed);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expectToast(page, 'Profile updated successfully!');
        await expect(input).toHaveValue(changed);

        await clearToast(page, 'Profile updated successfully!');
        await input.fill(original);
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await expectToast(page, 'Profile updated successfully!');
        await expect(input).toHaveValue(original);
    });

    test('validates password changes and restores the original', async ({
        page,
    }) => {
        await login(page, userCreds, '/user/log');
        await page.goto('/user/profile');

        const current = page.getByLabel('Current Password', { exact: true });
        const next = page.getByLabel('New Password', { exact: true });
        const confirm = page.getByLabel('Confirm New Password', {
            exact: true,
        });
        const submit = page.getByRole('button', {
            name: 'Change Password',
            exact: true,
        });
        const original = userCreds.password!;
        const temp = `Temp${uniqueId()}9`;

        await current.fill('WrongCurrent123');
        await next.fill(temp);
        await confirm.fill(temp);
        await submit.click();
        await expectToast(page, 'Current password is incorrect.');

        await current.fill(original);
        await next.fill(temp);
        await confirm.fill(`${temp}X`);
        await submit.click();
        await expectToast(page, 'Passwords do not match');

        await current.fill(original);
        await next.fill('abc');
        await confirm.fill('abc');
        await submit.click();
        await expectToast(
            page,
            'Password must be at least 8 characters long'
        );

        await current.fill(original);
        await next.fill(temp);
        await confirm.fill(temp);
        await submit.click();
        await expectToast(page, 'Password changed successfully!');
        await expect(next).toHaveValue('');

        await clearToast(page, 'Password changed successfully!');
        await current.fill(temp);
        await next.fill(original);
        await confirm.fill(original);
        await submit.click();
        await expectToast(page, 'Password changed successfully!');
        await expect(next).toHaveValue('');
    });
});
