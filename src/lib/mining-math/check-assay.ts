/**
 * QAQC SaaS - Check Assay Analysis Functions
 * Ported from Python Check_assay.py
 */

import { mean, standardDeviation, correlation, percentile, min, max, median } from "./statistics";

export interface CheckAssaySummary {
    count: number;
    meanOriginal: number;
    meanDuplicate: number;
    maxOriginal: number;
    maxDuplicate: number;
    minOriginal: number;
    minDuplicate: number;
    medianOriginal: number;
    medianDuplicate: number;
    q3Original: number;
    q3Duplicate: number;
    stdOriginal: number;
    stdDuplicate: number;
    cvOriginal: number; // Coefficient of variation
    cvDuplicate: number;
    correlation: number;
}

/**
 * Calculate complete check assay statistics
 */
export function calculateCheckAssayStats(
    originalValues: number[],
    duplicateValues: number[]
): CheckAssaySummary {
    if (originalValues.length !== duplicateValues.length) {
        throw new Error("Arrays must have same length");
    }

    // Filter out pairs where either value is NaN
    const validPairs = originalValues
        .map((orig, i) => ({ orig, dup: duplicateValues[i] }))
        .filter((pair) => !isNaN(pair.orig) && !isNaN(pair.dup));

    const originals = validPairs.map((p) => p.orig);
    const duplicates = validPairs.map((p) => p.dup);

    const meanOrig = mean(originals);
    const meanDup = mean(duplicates);
    const stdOrig = standardDeviation(originals);
    const stdDup = standardDeviation(duplicates);

    return {
        count: validPairs.length,
        meanOriginal: meanOrig,
        meanDuplicate: meanDup,
        maxOriginal: max(originals),
        maxDuplicate: max(duplicates),
        minOriginal: min(originals),
        minDuplicate: min(duplicates),
        medianOriginal: median(originals),
        medianDuplicate: median(duplicates),
        q3Original: percentile(originals, 75),
        q3Duplicate: percentile(duplicates, 75),
        stdOriginal: stdOrig,
        stdDuplicate: stdDup,
        cvOriginal: meanOrig !== 0 ? (stdOrig / meanOrig) * 100 : NaN,
        cvDuplicate: meanDup !== 0 ? (stdDup / meanDup) * 100 : NaN,
        correlation: correlation(originals, duplicates),
    };
}

/**
 * Generate Q-Q plot data points
 */
export function generateQQPlotData(
    originalValues: number[],
    duplicateValues: number[],
    numPercentiles: number = 100
): { xPercentile: number; yPercentile: number; percentile: number }[] {
    const percentiles = Array.from(
        { length: numPercentiles },
        (_, i) => ((i + 1) / numPercentiles) * 100
    );

    return percentiles.map((p) => ({
        percentile: p,
        xPercentile: percentile(originalValues, p),
        yPercentile: percentile(duplicateValues, p),
    }));
}

/**
 * Generate scatter plot data for check assay comparison
 */
export function generateCheckAssayScatterData(
    originalValues: number[],
    duplicateValues: number[]
): { x: number; y: number }[] {
    const validPairs = originalValues
        .map((orig, i) => ({ x: orig, y: duplicateValues[i] }))
        .filter((pair) => !isNaN(pair.x) && !isNaN(pair.y));

    return validPairs;
}
