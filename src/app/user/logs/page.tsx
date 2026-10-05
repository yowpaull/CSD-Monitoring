import InquiryLogsView from '@/components/inquiry-logs/InquiryLogsView';
import {
    getInquiryLogFilterOptions,
    getInquiryLogs,
} from '@/lib/queries/inquiry-logs';
import { parseLogFilters, parseLogPagination } from '@/lib/inquiry-log';

/**
 * Representative-facing log list. Shares the admin component but is
 * pinned to `own` scope, which both filters on the signed-in user and
 * drops the redundant Representative dropdown.
 */
export default async function MyLogsPage({
    searchParams,
}: PageProps<'/user/logs'>) {
    const params = await searchParams;

    const filters = parseLogFilters(params);
    const { page, pageSize } = parseLogPagination(params);

    const [options, { rows, totalCount, page: currentPage }] =
        await Promise.all([
            getInquiryLogFilterOptions(),
            getInquiryLogs({
                scope: 'own',
                filters,
                page,
                pageSize,
            }),
        ]);

    const viewKey = JSON.stringify([filters, currentPage, pageSize]);

    return (
        <InquiryLogsView
            key={viewKey}
            scope="own"
            title="My Inquiry Logs"
            description="Every inquiry you have logged, newest first."
            rows={rows}
            totalCount={totalCount}
            page={currentPage}
            pageSize={pageSize}
            filters={filters}
            options={options}
        />
    );
}
