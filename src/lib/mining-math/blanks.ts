/**
 * QAQC SaaS - Blanks Analysis Functions
 * Ported from Python Blanks.py
 */

import { mean, min, max, countWhere } from "./statistics";

export interface BlankDataPoint {
    index: number;
    date?: Date;
    value: number;
    limit: number;
    isFailure: boolean;
}

export interface BlankSummary {
    lab: string;
    element: string;
    type?: string;
    samples: number;
    fails: number;
    failureRate: number;
    limit: number;
    minValue: number;
    maxValue: number;
    meanValue: number;
}

/**
 * Check if a blank value exceeds the limit
 */
export function isBlankFailure(value: number, limit: number): boolean {
    return value > limit;
}

/**
 * Analyze blank samples
 */
export function analyzeBlanks(
    values: number[],
    limit: number | number[],
    dates?: (Date | undefined)[]
): { points: BlankDataPoint[]; summary: Omit<BlankSummary, "lab" | "element" | "type"> } {
    const points: BlankDataPoint[] = [];
    let failCount = 0;
    const validValues: number[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (isNaN(value)) continue;

        const pointLimit = Array.isArray(limit) ? limit[i] : limit;
        const isFailure = isBlankFailure(value, pointLimit);

        if (isFailure) failCount++;
        validValues.push(value);

        points.push({
            index: i,
            date: dates?.[i],
            value,
            limit: pointLimit,
            isFailure,
        });
    }

    const scalarLimit = Array.isArray(limit)
        ? mean(limit.filter((l) => !isNaN(l)))
        : limit;

    return {
        points,
        summary: {
            samples: validValues.length,
            fails: failCount,
            failureRate: (failCount / validValues.length) * 100,
            limit: scalarLimit,
            minValue: min(validValues),
            maxValue: max(validValues),
            meanValue: mean(validValues),
        },
    };
}

/**
 * Calculate limit based on LOD factor
 */
export function calculateLodLimit(lodValues: number[], factor: number): number[] {
    return lodValues.map((lod) => lod * factor);
}
