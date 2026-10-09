import { handleInquiryLogsExport } from '@/lib/inquiry-log-export';

/**
 * Excel download for the representative's own table. Scope `own` pins
 * the query to the signed-in user (with RLS behind it), so this can
 * never hand back another representative's rows.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    return handleInquiryLogsExport('own', searchParams);
}
