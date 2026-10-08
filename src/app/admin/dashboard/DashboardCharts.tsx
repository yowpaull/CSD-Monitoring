'use client';

import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import type { DashboardCount } from '@/lib/queries/admin-dashboard';

// Controllers arrive with the typed components from react-chartjs-2;
// these are the elements, scales and plugins the three chart types use.
ChartJS.register(
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Filler,
    Tooltip,
    Legend
);

/**
 * Matches the status badges in the inquiry-log table (Open = blue,
 * Pending = amber, Closed = green) so the doughnut and the table speak
 * the same colour language.
 */
const STATUS_COLORS: Record<string, string> = {
    Open: '#3b82f6',
    Pending: '#f59e0b',
    Closed: '#10b981',
};

const FALLBACK_COLOR = '#94a3b8';

const FONT = {
    family:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

/**
 * Week labels are real date ranges ("August 1 - 7", and occasionally
 * "September 28 - October 4"), so they are long: keep every one of
 * them on the axis and lean them at 45° rather than letting Chart.js
 * auto-skip alternate ticks.
 */
const WEEK_TICK_FONT = { ...FONT, size: 10 };

function hasData(data: DashboardCount[]): boolean {
    return data.some((entry) => entry.value > 0);
}

function chartAltText(prefix: string, data: DashboardCount[]): string {
    return `${prefix}: ${data
        .map((entry) => `${entry.label} ${entry.value}`)
        .join(', ')}`;
}

/** A doughnut of zeroes would render as an empty circle; say so instead. */
function EmptyChart() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No data yet
        </div>
    );
}

export function StatusDoughnut({ data }: { data: DashboardCount[] }) {
    if (!hasData(data)) return <EmptyChart />;

    return (
        <div
            className="h-64"
            role="img"
            aria-label={chartAltText('Status distribution', data)}
        >
            <Doughnut
                data={{
                    labels: data.map((entry) => entry.label),
                    datasets: [
                        {
                            data: data.map((entry) => entry.value),
                            backgroundColor: data.map(
                                (entry) =>
                                    STATUS_COLORS[entry.label] ??
                                    FALLBACK_COLOR
                            ),
                            borderWidth: 0,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '66%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                boxHeight: 6,
                                padding: 16,
                                font: FONT,
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    ` ${context.label}: ${context.parsed} inquiries`,
                            },
                        },
                    },
                }}
            />
        </div>
    );
}

export function WeeklyTrendLine({ data }: { data: DashboardCount[] }) {
    return (
        <div
            className="h-72"
            role="img"
            aria-label={chartAltText('Inquiries per week', data)}
        >
            <Line
                data={{
                    labels: data.map((entry) => entry.label),
                    datasets: [
                        {
                            label: 'Inquiries',
                            data: data.map((entry) => entry.value),
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.12)',
                            fill: true,
                            tension: 0.35,
                            pointBackgroundColor: '#2563eb',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    ` ${context.parsed.y} inquiries`,
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, font: FONT },
                            grid: { color: '#f1f5f9' },
                        },
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: 45,
                                minRotation: 0,
                                font: WEEK_TICK_FONT,
                            },
                            grid: { display: false },
                        },
                    },
                }}
            />
        </div>
    );
}

/**
 * Shared horizontal bars for the platform / brand / category charts —
 * horizontal so long names stay readable without rotating labels.
 */
export function CountBarChart({
    data,
    color,
}: {
    data: DashboardCount[];
    color: string;
}) {
    if (!hasData(data)) return <EmptyChart />;

    // Platform and brand charts draw every entry, so the card grows
    // with the list instead of squeezing long-tail bars into slivers.
    const height = Math.max(288, data.length * 26 + 48);

    return (
        <div
            style={{ height }}
            role="img"
            aria-label={chartAltText('Inquiry counts', data)}
        >
            <Bar
                data={{
                    labels: data.map((entry) => entry.label),
                    datasets: [
                        {
                            label: 'Inquiries',
                            data: data.map((entry) => entry.value),
                            backgroundColor: color,
                            borderRadius: 4,
                            maxBarThickness: 18,
                        },
                    ],
                }}
                options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) =>
                                    ` ${context.parsed.x} inquiries`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { precision: 0, font: FONT },
                            grid: { color: '#f1f5f9' },
                        },
                        y: {
                            ticks: { font: FONT },
                            grid: { display: false },
                        },
                    },
                }}
            />
        </div>
    );
}
