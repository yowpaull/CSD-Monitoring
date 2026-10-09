import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: 'Email must be a valid email address' })
        .min(1, { message: 'Email is required' }),
    password: z
        .string()
        .min(1, { message: 'Password is required' }),
});

export const createMemberSchema = z.object({
    full_name: z
        .string()
        .min(2, { message: 'Full name must be at least 2 characters long' 
    }),
    email: z
        .string()
        .email({ message: 'Email must be a valid email address' 
    }),
    role: z
        .enum(['admin', 'user'], { message: 'Role must be either admin or user' 
    }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .regex(passwordRegex, { message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
    }),
    confirm_password: z
        .string()
        .min(1, { message: 'Confirm password is required' 
    }),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})  

/** Editing your own display name — the only editable profile field. */
export const updateProfileSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(2, { message: 'Full name must be at least 2 characters long' }),
});

/**
 * Password strength mirrors `createMemberSchema` on purpose: one
 * definition of "strong enough" for the whole app, and members already
 * meet it because an admin had to create them with it.
 */
export const changePasswordSchema = z.object({
    current_password: z
        .string()
        .min(1, { message: 'Current password is required' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .regex(passwordRegex, { message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' }),
    confirm_password: z
        .string()
        .min(1, { message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
}).refine((data) => data.password !== data.current_password, {
    message: 'New password must be different from your current password',
    path: ['password'],
})