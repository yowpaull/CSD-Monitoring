/**
 * Excel export for the inquiry logs table.
 *
 * Shared by the admin and user route handlers so both sides produce an
 * identical workbook. Server-only: it pulls in exceljs and the Supabase
 * query layer, neither of which belongs in a client bundle.
 */

import * as ExcelJS from 'exceljs';

import {
    formatLocalDay,
    parseLogFilters,
    totalMinutesBetween,
} from '@/lib/inquiry-log';
import {
    EXPORT_ROW_LIMIT,
    getInquiryLogsForExport,
} from '@/lib/queries/inquiry-logs';
import type {
    InquiryLogFilters,
    InquiryLogRow,
    InquiryLogScope,
} from '@/lib/types/inquiry-log';

const DATETIME_FORMAT = 'yyyy-mm-dd hh:mm';

const TIME_FORMAT = 'h:mm AM/PM';

/**
 * `inquiry_datetime` is a wall clock (`timestamp without time zone`), so
 * its parts are read straight off the string — handing it to `new Date()`
 * would re-interpret it in the server's zone. Excel stores a bare serial
 * number, so the parts are encoded through a UTC Date to survive
 * exceljs's `getTime()` conversion unchanged.
 */
const WALL_CLOCK_PARTS =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/;

function wallClockCell(value: string | null): Date | null {
    if (!value) return null;

    const parts = WALL_CLOCK_PARTS.exec(value);
    if (!parts) return null;

    return new Date(
        Date.UTC(
            Number(parts[1]),
            Number(parts[2]) - 1,
            Number(parts[3]),
            Number(parts[4]),
            Number(parts[5]),
            Number(parts[6] ?? 0)
        )
    );
}

/**
 * `created_at` / `updated_at` are genuine instants. They are shown in
 * the viewer's local wall clock — the same thing the table displays —
 * rebuilt through a UTC Date for the reason above.
 */
function instantCell(value: string | null): Date | null {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    return new Date(
        Date.UTC(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate(),
            parsed.getHours(),
            parsed.getMinutes()
        )
    );
}

/** `time` columns become Excel time serials, sortable and subtractable. */
function clockCell(value: string | null): number | null {
    if (!value) return null;

    const parts = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());

    if (parts) {
        const hours = Number(parts[1]);
        const minutes = Number(parts[2]);
        const seconds = Number(parts[3] ?? 0);

        if (hours > 23 || minutes > 59 || seconds > 59) return null;

        return (hours * 3600 + minutes * 60 + seconds) / 86400;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    return (
        parsed.getHours() * 3600 +
        parsed.getMinutes() * 60 +
        parsed.getSeconds()
    ) / 86400;
}

type ExportColumn = {
    header: string;
    width: number;
    /** Applied to every cell in the column. */
    numFmt?: string;
    /** Prose columns wrap instead of being clipped by the column width. */
    wrap?: boolean;
    value: (row: InquiryLogRow) => ExcelJS.CellValue;
};

/**
 * The table's columns, minus the Actions cell and the redundant
 * relational ids. Order matters: it is the workbook's column order.
 */
const EXPORT_COLUMNS: ExportColumn[] = [
    {
        header: 'Inquiry Date & Time',
        width: 20,
        numFmt: DATETIME_FORMAT,
        value: (row) => wallClockCell(row.inquiry_datetime),
    },
    {
        header: 'Platform',
        width: 16,
        value: (row) => row.platform?.name ?? null,
    },
    {
        header: 'Brand',
        width: 18,
        value: (row) => row.brand?.name ?? null,
    },
    {
        header: 'Representative',
        width: 22,
        value: (row) =>
            row.representative?.full_name ||
            row.representative?.email ||
            'Unknown',
    },
    {
        header: 'Inquiry Type',
        width: 32,
        value: (row) => {
            const sub = row.sub_category;
            if (!sub) return null;

            const main = sub.main_category;

            return main ? `${main.name} - ${sub.name}` : sub.name;
        },
    },
    {
        header: 'Start Attended',
        width: 16,
        numFmt: TIME_FORMAT,
        value: (row) => clockCell(row.start_attended),
    },
    {
        header: 'End Attended',
        width: 16,
        numFmt: TIME_FORMAT,
        value: (row) => clockCell(row.end_attended),
    },
    {
        header: 'Total Minutes',
        width: 14,
        value: (row) =>
            totalMinutesBetween(row.start_attended, row.end_attended),
    },
    {
        header: 'Customer Name',
        width: 22,
        value: (row) => row.customer_name,
    },
    {
        header: 'Thread Number',
        width: 14,
        value: (row) => row.thread_number,
    },
    {
        header: 'Quantity',
        width: 10,
        value: (row) => row.quantity,
    },
    {
        header: 'Order Number',
        width: 16,
        value: (row) => row.order_number,
    },
    {
        header: 'Item',
        width: 28,
        wrap: true,
        value: (row) => row.item,
    },
    {
        header: 'Customer Concern / Complaint',
        width: 40,
        wrap: true,
        value: (row) => row.customer_concern,
    },
    {
        header: 'Action / Response',
        width: 40,
        wrap: true,
        value: (row) => row.action_response,
    },
    {
        header: 'Status',
        width: 12,
        value: (row) => row.status,
    },
    {
        header: 'Remarks',
        width: 32,
        wrap: true,
        value: (row) => row.remarks,
    },
    {
        header: 'Created At',
        width: 20,
        numFmt: DATETIME_FORMAT,
        value: (row) => instantCell(row.created_at),
    },
    {
        header: 'Updated At',
        width: 20,
        numFmt: DATETIME_FORMAT,
        value: (row) => instantCell(row.updated_at),
    },
];

const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
};

/**
 * Serialises rows into an xlsx buffer. Dates and times are written as
 * real Excel values (with display formats), so the file sorts, filters
 * and does arithmetic like the screen does.
 */
export async function buildInquiryLogsWorkbook(
    rows: InquiryLogRow[],
    { truncated = false }: { truncated?: boolean } = {}
) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Taskboard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Inquiry Logs', {
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = EXPORT_COLUMNS.map((column) => ({
        header: column.header,
        key: column.header,
        width: column.width,
    }));

    const headerRow = sheet.getRow(1);

    headerRow.height = 22;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = HEADER_FILL;
    headerRow.alignment = { vertical: 'middle' };

    for (const row of rows) {
        const excelRow = sheet.addRow(
            EXPORT_COLUMNS.map((column) => column.value(row))
        );

        EXPORT_COLUMNS.forEach((column, index) => {
            const cell = excelRow.getCell(index + 1);

            if (column.numFmt) cell.numFmt = column.numFmt;
            if (column.wrap) {
                cell.alignment = { wrapText: true, vertical: 'top' };
            }
        });
    }

    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: EXPORT_COLUMNS.length },
    };

    // A capped export must never look like the whole result set.
    if (truncated) {
        const notice = workbook.addWorksheet('Notice');

        notice.getColumn(1).width = 100;
        notice.getCell('A1').value =
            `This export stopped at the ${EXPORT_ROW_LIMIT.toLocaleString('en-US')}-row limit. ` +
            'Narrow the filters and export again to get the remaining rows.';
    }

    return workbook.xlsx.writeBuffer();
}

/**
 * A whole-month export is the normal case, so the file is named after
 * the month it covers: that still means something weeks later, when the
 * download date does not. Anything else falls back to the download day.
 */
function exportDateLabel(filters: InquiryLogFilters): string {
    const { inquiry_from: from, inquiry_to: to } = filters;

    if (
        from &&
        to &&
        from.endsWith('-01') &&
        from.slice(0, 7) === to.slice(0, 7)
    ) {
        const daysInMonth = new Date(
            Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)), 0)
        ).getUTCDate();

        if (Number(to.slice(8)) === daysInMonth) return from.slice(0, 7);
    }

    return formatLocalDay(new Date());
}

/**
 * One handler behind two routes: `/admin/inquiry-logs/export` and
 * `/user/logs/export`. The proxy middleware already guards both paths,
 * and the query layer re-checks the role, so this only has to translate
 * its result into a file response.
 */
export async function handleInquiryLogsExport(
    scope: InquiryLogScope,
    searchParams: URLSearchParams
): Promise<Response> {
    const filters = parseLogFilters(Object.fromEntries(searchParams));

    const result = await getInquiryLogsForExport({ scope, filters });

    if (!result.ok) {
        return result.reason === 'unauthorized'
            ? new Response('Forbidden', { status: 403 })
            : new Response('Failed to load inquiry logs', { status: 500 });
    }

    const file = await buildInquiryLogsWorkbook(result.rows, {
        truncated: result.truncated,
    });

    const filename = `${
        scope === 'admin' ? '' : 'my-'
    }inquiry-logs-${exportDateLabel(filters)}.xlsx`;

    return new Response(file, {
        headers: {
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}
