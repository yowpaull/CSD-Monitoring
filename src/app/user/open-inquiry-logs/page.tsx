import InquiryLogsView from '@/components/inquiry-logs/InquiryLogsView';
import { getInquiryLogFilterOptions, getInquiryLogs } from '@/lib/queries/inquiry-logs';
import { parseLogFilters, parseLogPagination } from '@/lib/inquiry-log';

/**
 * The shared pool of Open inquiry logs, visible to every representative.
 *
 * Status is pinned to Open in the query layer, so the URL cannot widen it
 * to Pending or Closed. Continue and Close both open the full edit form —
 * Close simply pre-selects the Closed status.
 */
export default async function OpenInquiryLogsPage({
    searchParams,
}: PageProps<'/user/open-inquiry-logs'>) {
    const params = await searchParams;
    const filters = parseLogFilters(params);
    const { page, pageSize } = parseLogPagination(params);

    const [options, { rows, totalCount, page: currentPage }] = await Promise.all([
        getInquiryLogFilterOptions(),
        getInquiryLogs({ scope: 'open', filters, page, pageSize }),
    ]);

    const viewKey = JSON.stringify([filters, currentPage, pageSize]);

    return (
        <InquiryLogsView
            key={viewKey} scope="open"
            title="Open Inquiry Logs"
            description="Inquiries still open across the team. Continue one to work on it, or close it when resolved."
            rows={rows} totalCount={totalCount} page={currentPage}
            pageSize={pageSize} filters={filters} options={options}
        />
    );
}
