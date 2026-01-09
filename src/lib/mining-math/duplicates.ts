/**
 * QAQC SaaS - Duplicates Analysis Functions
 * Ported from Python Duplicates.py
 */

import { mean, standardDeviation, correlation, percentile } from "./statistics";

/**
 * Default HARD thresholds by duplicate type
 * PD = Pulp Duplicate (10%)
 * CD = Coarse Duplicate (20%)
 * FD = Field Duplicate (30%)
 */
export const HARD_THRESHOLDS: Record<string, number> = {
    PD: 0.1,
    CD: 0.2,
    FD: 0.3,
};

export interface DuplicatePair {
    original: number;
    duplicate: number;
    hard: number;
    isFailure: boolean;
}

export interface DuplicateSummary {
    pairs: number;
    fails: number;
    failureRate: number;
    correlation: number;
    meanDelta: number;
    minOriginal: number;
    maxOriginal: number;
    meanOriginal: number;
}

/**
 * Calculate HARD index (Half Absolute Relative Difference)
 * HARD = |dup - orig| / (dup + orig) * 100
 */
export function calculateHARD(original: number, duplicate: number): number {
    const sum = original + duplicate;
    if (sum === 0) return NaN;
    return (Math.abs(duplicate - original) / sum) * 100;
}

/**
 * Get the HARD threshold for a duplicate type
 * Returns percentage (e.g., 10 for PD, 20 for CD, 30 for FD)
 */
export function getHardThreshold(
    duplicateType: string,
    nuggetEffect: boolean = false
): number {
    const baseThreshold = HARD_THRESHOLDS[duplicateType] ?? 0.3;
    const threshold = nuggetEffect ? baseThreshold + 0.1 : baseThreshold;
    return threshold * 100; // Convert to percentage
}

/**
 * Analyze duplicate pairs and calculate summary statistics
 */
export function analyzeDuplicates(
    originalValues: number[],
    duplicateValues: number[],
    duplicateType: string = "FD",
    nuggetEffect: boolean = false
): { pairs: DuplicatePair[]; summary: DuplicateSummary } {
    if (originalValues.length !== duplicateValues.length) {
        throw new Error("Original and duplicate arrays must have same length");
    }

    const threshold = getHardThreshold(duplicateType, nuggetEffect);
    const pairs: DuplicatePair[] = [];
    let failCount = 0;
    const deltas: number[] = [];

    for (let i = 0; i < originalValues.length; i++) {
        const orig = originalValues[i];
        const dup = duplicateValues[i];

        // Skip if either value is NaN
        if (isNaN(orig) || isNaN(dup)) continue;

        const hard = calculateHARD(orig, dup);
        const isFailure = hard > threshold;

        if (isFailure) failCount++;
        deltas.push(dup - orig);

        pairs.push({
            original: orig,
            duplicate: dup,
            hard,
            isFailure,
        });
    }

    const validOriginals = pairs.map((p) => p.original);
    const validDuplicates = pairs.map((p) => p.duplicate);

    const summary: DuplicateSummary = {
        pairs: pairs.length,
        fails: failCount,
        failureRate: (failCount / pairs.length) * 100,
        correlation: correlation(validOriginals, validDuplicates),
        meanDelta: mean(deltas),
        minOriginal: Math.min(...validOriginals),
        maxOriginal: Math.max(...validOriginals),
        meanOriginal: mean(validOriginals),
    };

    return { pairs, summary };
}

/**
 * Generate HARD chart data (sorted by HARD value)
 */
export function generateHardChartData(
    pairs: DuplicatePair[]
): { percentile: number; hard: number; isFailure: boolean }[] {
    const sorted = [...pairs].sort((a, b) => a.hard - b.hard);

    return sorted.map((pair, index) => ({
        percentile: ((index + 1) / sorted.length) * 100,
        hard: pair.hard,
        isFailure: pair.isFailure,
    }));
}

/**
 * Generate scatter plot data with envelope lines
 */
export function generateScatterData(
    pairs: DuplicatePair[],
    duplicateType: string = "FD"
): {
    points: { x: number; y: number; isFailure: boolean }[];
    envelopePercent: number;
    maxValue: number;
} {
    const points = pairs.map((p) => ({
        x: p.original,
        y: p.duplicate,
        isFailure: p.isFailure,
    }));

    const maxOriginal = Math.max(...pairs.map((p) => p.original));
    const maxDuplicate = Math.max(...pairs.map((p) => p.duplicate));
    const maxValue = Math.max(maxOriginal, maxDuplicate) * 1.05;

    const envelopePercent = (HARD_THRESHOLDS[duplicateType] ?? 0.3) * 100;

    return { points, envelopePercent, maxValue };
}
