import { handleInquiryLogsExport } from '@/lib/inquiry-log-export';

/**
 * Excel download for the shared Open pool. Scope `open` forces the status
 * filter to Open in the query layer; RLS limits the rows to Open logs plus
 * the caller's own, so this can never export Closed or Pending logs from
 * other representatives.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    return handleInquiryLogsExport('open', searchParams);
}
