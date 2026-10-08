/**
 * Shared shapes for the inquiry log list. Imported by both the
 * server query layer and the client table component.
 */

/**
 * `admin` sees every representative's logs.
 * `own` is hard-scoped to the signed-in representative.
 */
export type InquiryLogScope = 'admin' | 'own';

export type InquiryLogFilters = {
    brand_id: string;
    platform_id: string;
    representative_id: string;
    inquiry_sub_category_id: string;
    status: string;
    /** Exact calendar day matched against `created_at`. */
    created_date: string;
    /** Inclusive lower bound (yyyy-mm-dd) on `inquiry_datetime`. */
    inquiry_from: string;
    /** Inclusive upper bound (yyyy-mm-dd) on `inquiry_datetime`. */
    inquiry_to: string;
};

export type InquiryLogSubCategory = {
    id: string;
    name: string;
};

export type InquiryLogMainCategory = {
    id: string;
    name: string;
    inquiry_sub_categories: InquiryLogSubCategory[];
};

export type InquiryLogCategory = {
    id: string;
    name: string;
    inquiry_main_categories: InquiryLogMainCategory[];
};

export type InquiryLogNamedOption = {
    id: string;
    name: string;
};

export type InquiryLogRepresentative = {
    id: string;
    full_name: string | null;
    email: string | null;
};

export type InquiryLogFilterOptions = {
    brands: InquiryLogNamedOption[];
    platforms: InquiryLogNamedOption[];
    representatives: InquiryLogRepresentative[];
    categories: InquiryLogCategory[];
    /** Mirrors the `status` check constraint on the table. */
    statuses: readonly string[];
};

/**
 * A single `log_inquiries` row with its PostgREST embeds. The
 * relational columns are nullable because RLS on `profiles` hides
 * rows the caller is not allowed to read.
 */
export type InquiryLogRow = {
    id: string;
    inquiry_datetime: string;
    platform_id: string;
    brand_id: string;
    representative_id: string;
    inquiry_sub_category_id: string;
    start_attended: string;
    end_attended: string;
    customer_name: string;
    thread_number: number;
    quantity: number;
    order_number: string | null;
    item: string | null;
    customer_concern: string | null;
    action_response: string | null;
    status: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    platform: InquiryLogNamedOption | null;
    brand: InquiryLogNamedOption | null;
    representative: InquiryLogRepresentative | null;
    sub_category: {
        id: string;
        name: string;
        main_category: {
            id: string;
            name: string;
            category: InquiryLogNamedOption | null;
        } | null;
    } | null;
};
