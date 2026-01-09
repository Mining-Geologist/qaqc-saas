/**
 * QAQC SaaS - Z-Score Analysis Functions
 * Ported from Python Z_Score.py
 */

import { mean, standardDeviation, countWhere } from "./statistics";

export interface ZScoreDataPoint {
    index: number;
    date: Date;
    value: number;
    expected: number;
    sd: number;
    zScore: number;
    crm?: string;
    company?: string;
}

export interface ZScoreSummary {
    element: string;
    samples: number;
    outliers2SD: number;
    rate2SD: number;
    outliers3SD: number;
    rate3SD: number;
}

/**
 * Calculate Z-score for a single value
 * Z = (value - expected) / sd
 */
export function calculateZScore(
    value: number,
    expected: number,
    stdDev: number
): number {
    if (stdDev === 0) return NaN;
    return (value - expected) / stdDev;
}

/**
 * Calculate Z-scores for an array of values
 */
export function calculateZScores(
    values: number[],
    expectedValues: number[],
    stdDevs: number[]
): number[] {
    if (
        values.length !== expectedValues.length ||
        values.length !== stdDevs.length
    ) {
        throw new Error("All arrays must have the same length");
    }

    return values.map((value, i) =>
        calculateZScore(value, expectedValues[i], stdDevs[i])
    );
}

/**
 * Count outliers beyond a threshold
 */
export function countOutliers(zScores: number[], threshold: number): number {
    return countWhere(zScores, (z) => Math.abs(z) > threshold);
}

/**
 * Calculate Z-score summary statistics
 */
export function calculateZScoreSummary(
    element: string,
    zScores: number[]
): ZScoreSummary {
    const validZScores = zScores.filter((z) => !isNaN(z));

    const outliers2SD = countOutliers(validZScores, 2);
    const outliers3SD = countOutliers(validZScores, 3);

    return {
        element,
        samples: validZScores.length,
        outliers2SD,
        rate2SD: (outliers2SD / validZScores.length) * 100,
        outliers3SD,
        rate3SD: (outliers3SD / validZScores.length) * 100,
    };
}

/**
 * Generate Z-score chart data points
 */
export function generateZScoreChartData(
    dataPoints: {
        date: Date;
        value: number;
        expected: number;
        sd: number;
        crm?: string;
        company?: string;
    }[]
): ZScoreDataPoint[] {
    // Sort by date
    const sorted = [...dataPoints].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
    );

    return sorted.map((point, index) => ({
        index,
        date: point.date,
        value: point.value,
        expected: point.expected,
        sd: point.sd,
        zScore: calculateZScore(point.value, point.expected, point.sd),
        crm: point.crm,
        company: point.company,
    }));
}

/**
 * Control line definitions for Z-score charts
 */
export const Z_SCORE_CONTROL_LINES = [
    { value: 3, label: "+3 SD", color: "#7FA37F" },
    { value: -3, label: "-3 SD", color: "#7FA37F" },
    { value: 2, label: "+2 SD", color: "#B5ED38" },
    { value: -2, label: "-2 SD", color: "#B5ED38" },
    { value: 0, label: "0", color: "#000000", dashed: true },
];
