import InquiryLogsView from '@/components/inquiry-logs/InquiryLogsView';
import {
    getInquiryLogFilterOptions,
    getInquiryLogs,
} from '@/lib/queries/inquiry-logs';
import { parseLogFilters, parseLogPagination } from '@/lib/inquiry-log';

export default async function InquiryLogsPage({
    searchParams,
}: PageProps<'/admin/inquiry-logs'>) {
    const params = await searchParams;

    const filters = parseLogFilters(params);
    const { page, pageSize } = parseLogPagination(params);

    const [options, { rows, totalCount, page: currentPage }] =
        await Promise.all([
            getInquiryLogFilterOptions(),
            getInquiryLogs({
                scope: 'admin',
                filters,
                page,
                pageSize,
            }),
        ]);

    // Remounting on every query-string change keeps the uncontrolled
    // filter inputs in step with the URL, including on back/forward.
    const viewKey = JSON.stringify([filters, currentPage, pageSize]);

    return (
        <InquiryLogsView
            key={viewKey}
            scope="admin"
            title="Customer Inquiry Logs"
            description="Manage and monitor customer inquiry logs."
            rows={rows}
            totalCount={totalCount}
            page={currentPage}
            pageSize={pageSize}
            filters={filters}
            options={options}
        />
    );
}
