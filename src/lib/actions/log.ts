'use server';

import { logSchema } from '@/lib/validations/log-schema';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;

    enteredValues?: {
        inquiry_datetime?: string;
        platform_id?: string;
        brand_id?: string;
        inquiry_sub_category_id?: string;
        start_attended?: string;
        end_attended?: string;
        customer_name?: string;
        thread_number?: number;
        quantity?: number;
        order_number?: string;
        item?: string;
        customer_concern?: string;
        action_response?: string;
        status?: string;
        remarks?: string;
    };

    success?: boolean;
    message?: string;
    redirectTo?: string;
};

function getEnteredValues(formData: FormData) {
    return {
        inquiry_datetime: String(
            formData.get('inquiry_datetime') ?? ''
        ).trim(),

        platform_id: String(
            formData.get('platform_id') ?? ''
        ).trim(),

        brand_id: String(
            formData.get('brand_id') ?? ''
        ).trim(),

        inquiry_sub_category_id: String(
            formData.get('inquiry_sub_category_id') ?? ''
        ).trim(),

        start_attended: String(
            formData.get('start_attended') ?? ''
        ).trim(),

        end_attended: String(
            formData.get('end_attended') ?? ''
        ).trim(),

        customer_name: String(
            formData.get('customer_name') ?? ''
        ).trim(),

        thread_number: Number(
            formData.get('thread_number') ?? 0
        ),

        quantity: Number(
            formData.get('quantity') ?? 1
        ),

        order_number: String(
            formData.get('order_number') ?? ''
        ).trim(),

        item: String(
            formData.get('item') ?? ''
        ).trim(),

        customer_concern: String(
            formData.get('customer_concern') ?? ''
        ).trim(),

        action_response: String(
            formData.get('action_response') ?? ''
        ).trim(),

        status: String(
            formData.get('status') ?? ''
        ).trim(),

        remarks: String(
            formData.get('remarks') ?? ''
        ).trim(),
    };
}

export async function log(
    _prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {

    /*
     * 1. Create Supabase client
     */
    const supabase = await createClient();

    /*
     * 2. Get currently authenticated user
     */
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in.',
        };
    }

    /*
     * 3. Get representative from authenticated user
     *
     * We DO NOT trust representative_id
     * coming from the client.
     */
    const representative_id = user.id;

    /*
     * 4. Get form data
     */
    const raw = {
        inquiry_datetime: formData.get('inquiry_datetime'),
        platform_id: formData.get('platform_id'),
        brand_id: formData.get('brand_id'),
        inquiry_sub_category_id:
            formData.get('inquiry_sub_category_id'),
        start_attended: formData.get('start_attended'),
        end_attended: formData.get('end_attended'),
        customer_name: formData.get('customer_name'),
        thread_number: formData.get('thread_number'),
        quantity: formData.get('quantity'),
        order_number: formData.get('order_number'),
        item: formData.get('item'),
        customer_concern: formData.get('customer_concern'),
        action_response: formData.get('action_response'),
        status: formData.get('status'),
        remarks: formData.get('remarks'),
    };

    /*
     * 5. Validate form data
     */
    const parsed = logSchema.safeParse(raw);

    if (!parsed.success) {
        return {
            fieldErrors:
                parsed.error.flatten().fieldErrors,

            enteredValues:
                getEnteredValues(formData),
        };
    }

    const data = parsed.data;

    /*
     * 6. Validate start/end time
     */
    const start = new Date(
        `1970-01-01T${data.start_attended}`
    );

    const end = new Date(
        `1970-01-01T${data.end_attended}`
    );

    if (end < start) {
        return {
            fieldErrors: {
                end_attended: [
                    'End time cannot be earlier than start time.',
                ],
            },

            enteredValues:
                getEnteredValues(formData),
        };
    }

    /*
     * 7. Insert inquiry log
     */
    const { error } = await supabase
        .from('log_inquiries')
        .insert({
            inquiry_datetime: data.inquiry_datetime,

            platform_id: data.platform_id,

            brand_id: data.brand_id,

            // Automatically comes from authenticated user
            representative_id,

            inquiry_sub_category_id:
                data.inquiry_sub_category_id,

            start_attended:
                data.start_attended,

            end_attended:
                data.end_attended,

            customer_name:
                data.customer_name,

            thread_number:
                data.thread_number || null,

            quantity:
                data.quantity,

            order_number:
                data.order_number || null,

            item:
                data.item || null,

            customer_concern:
                data.customer_concern,

            action_response:
                data.action_response,

            status:
                data.status,

            remarks:
                data.remarks || null,
        });

    /*
     * 8. Handle database error
     */
    if (error) {
        console.error(
            'Failed to log inquiry:',
            error
        );

        return {
            error:
                'Failed to log inquiry. Please try again.',

            enteredValues:
                getEnteredValues(formData),
        };
    }

    /*
     * 9. Success
     */
    return {
        success: true,
        message: 'Inquiry logged successfully!',
    };
}