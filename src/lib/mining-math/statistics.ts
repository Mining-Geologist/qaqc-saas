/**
 * QAQC SaaS - Shared Statistical Functions
 * Ported from Python pandas/numpy to TypeScript
 */

/**
 * Calculate the arithmetic mean of an array of numbers
 */
export function mean(values: number[]): number {
    if (values.length === 0) return NaN;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate the standard deviation of an array of numbers
 * @param ddof - Delta degrees of freedom (default 1 for sample std)
 */
export function standardDeviation(values: number[], ddof: number = 1): number {
    if (values.length <= ddof) return NaN;
    const avg = mean(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    const avgSquareDiff =
        squareDiffs.reduce((sum, val) => sum + val, 0) / (values.length - ddof);
    return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate a specific percentile of an array
 * Uses linear interpolation (same as numpy default)
 */
export function percentile(values: number[], p: number): number {
    if (values.length === 0) return NaN;
    if (p < 0 || p > 100) throw new Error("Percentile must be between 0 and 100");

    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return NaN;

    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        numerator += diffX * diffY;
        denomX += diffX * diffX;
        denomY += diffY * diffY;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return NaN;

    return numerator / denominator;
}

/**
 * Calculate rolling (moving) mean
 */
export function rollingMean(values: number[], window: number): (number | null)[] {
    if (window <= 0 || window > values.length) {
        throw new Error("Invalid window size");
    }

    const result: (number | null)[] = [];

    for (let i = 0; i < values.length; i++) {
        if (i < window - 1) {
            result.push(null); // Not enough data yet
        } else {
            const windowValues = values.slice(i - window + 1, i + 1);
            result.push(mean(windowValues));
        }
    }

    return result;
}

/**
 * Calculate minimum value
 */
export function min(values: number[]): number {
    if (values.length === 0) return NaN;
    return Math.min(...values);
}

/**
 * Calculate maximum value
 */
export function max(values: number[]): number {
    if (values.length === 0) return NaN;
    return Math.max(...values);
}

/**
 * Calculate median
 */
export function median(values: number[]): number {
    return percentile(values, 50);
}

/**
 * Count values that match a condition
 */
export function countWhere(
    values: number[],
    predicate: (value: number) => boolean
): number {
    return values.filter(predicate).length;
}

/**
 * Filter out NaN and undefined values
 */
export function cleanNumeric(values: (number | null | undefined)[]): number[] {
    return values.filter(
        (v): v is number => v !== null && v !== undefined && !isNaN(v)
    );
}
