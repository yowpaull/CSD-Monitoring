import { handleInquiryLogsExport } from '@/lib/inquiry-log-export';

/**
 * Excel download for the admin table. The proxy middleware restricts
 * `/admin` to administrators, and the query layer re-checks the role
 * before it returns a single row.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    return handleInquiryLogsExport('admin', searchParams);
}
