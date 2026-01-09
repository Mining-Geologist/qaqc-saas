/**
 * QAQC SaaS - CRM Analysis Functions
 * Ported from Python CRMs.py
 */

import { mean, standardDeviation, countWhere } from "./statistics";

export interface CrmBounds {
    upper2SD: number;
    lower2SD: number;
    upper3SD: number;
    lower3SD: number;
}

export interface CrmSummary {
    numSamples: number;
    mean: number;
    expectedValue: number;
    standardDeviation: number;
    numOutliers: number;
    bias: number; // Percentage
    failureRate: number; // Percentage
    bounds: CrmBounds;
}

/**
 * Calculate standard deviation bounds based on expected value
 * @param expectedValue - The certified/expected CRM value
 * @param stdDev - Standard deviation (from data or certificate)
 * @param multiplier2SD - Multiplier for 2SD bounds (default 2)
 * @param multiplier3SD - Multiplier for 3SD bounds (default 3)
 */
export function calculateBounds(
    expectedValue: number,
    stdDev: number,
    multiplier2SD: number = 2,
    multiplier3SD: number = 3
): CrmBounds {
    return {
        upper2SD: expectedValue + multiplier2SD * stdDev,
        lower2SD: expectedValue - multiplier2SD * stdDev,
        upper3SD: expectedValue + multiplier3SD * stdDev,
        lower3SD: expectedValue - multiplier3SD * stdDev,
    };
}

/**
 * Calculate bias percentage
 * Bias = ((mean / expected) - 1) * 100
 */
export function calculateBias(
    meanValue: number,
    expectedValue: number
): number {
    if (expectedValue === 0) return NaN;
    return ((meanValue / expectedValue) - 1) * 100;
}

/**
 * Detect outliers (values outside 3SD bounds)
 */
export function detectFailures(
    values: number[],
    upperBound: number,
    lowerBound: number
): { failures: number[]; indices: number[] } {
    const failures: number[] = [];
    const indices: number[] = [];

    values.forEach((value, index) => {
        if (value > upperBound || value < lowerBound) {
            failures.push(value);
            indices.push(index);
        }
    });

    return { failures, indices };
}

/**
 * Calculate complete CRM summary statistics
 */
export function calculateCrmSummary(
    gradeValues: number[],
    expectedValue: number,
    options: {
        useMean?: boolean; // Use data mean instead of expected value for bounds
        useExpectedSD?: boolean; // Use expected SD from certificate
        expectedSD?: number;
        multiplier2SD?: number;
        multiplier3SD?: number;
    } = {}
): CrmSummary {
    const {
        useMean = false,
        useExpectedSD = false,
        expectedSD = 0,
        multiplier2SD = 2,
        multiplier3SD = 3,
    } = options;

    const dataStdDev = standardDeviation(gradeValues);
    const dataMean = mean(gradeValues);

    // Determine which center point to use for bounds
    const centerValue = useMean ? dataMean : expectedValue;

    // Determine which SD to use
    const stdDevForBounds = useExpectedSD && expectedSD ? expectedSD : dataStdDev;

    const bounds = calculateBounds(
        centerValue,
        stdDevForBounds,
        multiplier2SD,
        multiplier3SD
    );

    const { failures } = detectFailures(
        gradeValues,
        bounds.upper3SD,
        bounds.lower3SD
    );

    const bias = calculateBias(dataMean, expectedValue);
    const failureRate = (failures.length / gradeValues.length) * 100;

    return {
        numSamples: gradeValues.length,
        mean: dataMean,
        expectedValue,
        standardDeviation: dataStdDev,
        numOutliers: failures.length,
        bias,
        failureRate,
        bounds,
    };
}

/**
 * Generate chart data points for CRM control chart
 */
export function generateCrmChartData(
    dates: Date[],
    gradeValues: number[],
    expectedValue: number,
    bounds: CrmBounds
): {
    sequence: number;
    date: Date;
    value: number;
    isFailure: boolean;
    expectedValue: number;
    upper2SD: number;
    lower2SD: number;
    upper3SD: number;
    lower3SD: number;
}[] {
    return dates.map((date, index) => ({
        sequence: index,
        date,
        value: gradeValues[index],
        isFailure:
            gradeValues[index] > bounds.upper3SD ||
            gradeValues[index] < bounds.lower3SD,
        expectedValue,
        upper2SD: bounds.upper2SD,
        lower2SD: bounds.lower2SD,
        upper3SD: bounds.upper3SD,
        lower3SD: bounds.lower3SD,
    }));
}
