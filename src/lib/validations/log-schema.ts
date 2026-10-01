import { z } from "zod"

export const logSchema = z.object({
    inquiry_datetime: z
        .string()
        .min(1, { message: 'Inquiry date and time is required' }),
    platform_id: z
        .string()
        .min(1, { message: 'Platform is required' }),
    brand_id: z
        .string()
        .min(1, { message: 'Brand is required' }),
    representative_id: z
        .string()
        .min(1, { message: 'Representative is required' }),
    inquiry_sub_category_id: z
        .string()
        .min(1, { message: 'Type of Inquiry is required' }),
    start_attended: z
        .string()
        .min(1, { message: 'Start attended time is required' }),
    end_attended: z
        .string()
        .min(1, { message: 'End attended time is required' }),
    customer_name: z
        .string()
        .min(1, { message: 'Customer name is required' }),
    thread_number: z
        .number()
        .min(1, { message: 'Thread number is required' }),
    quantity: z
        .number()
        .min(1, { message: 'Quantity is required' }),
    order_number: z
        .string(),
    item: z
        .string(),
    customer_concern: z
        .string(),
    action_response: z
        .string(),
    status: z
        .string()
        .min(1, { message: 'Status is required' }),
    remarks: z
        .string()
})