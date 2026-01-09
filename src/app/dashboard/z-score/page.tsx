"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Play, Download, FileSpreadsheet, BarChart3, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from "recharts";
import { calculateZScore, calculateZScoreSummary, Z_SCORE_CONTROL_LINES } from "@/lib/mining-math";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useAuthStore } from "@/stores/auth-store";

interface ChartDataPoint {
    index: number;
    zScore: number;
    date: string;
    crm: string;
    isOutlier2SD: boolean;
    isOutlier3SD: boolean;
}

export default function ZScorePage() {
    const { currentUser } = useAuthStore();
    const userId = currentUser?.id ?? "guest";

    const { getDraft, setData, setColumnMapping } = useAnalysisStore();
    const draft = getDraft(userId, "Z_SCORE");

    const [data, setLocalData] = useState<Record<string, unknown>[]>(
        (draft?.data as Record<string, unknown>[]) ?? []
    );
    const [columns, setColumns] = useState<string[]>(draft?.columns ?? []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [activeTab, setActiveTab] = useState("setup");
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<{
        element: string;
        samples: number;
        outliers2SD: number;
        rate2SD: number;
        outliers3SD: number;
        rate3SD: number;
    } | null>(null);

    const [mapping, setMapping] = useState({
        element: draft?.columnMapping?.element ?? "",
        crm: draft?.columnMapping?.crm ?? "",
        value: draft?.columnMapping?.value ?? "",
        expected: draft?.columnMapping?.expected ?? "",
        sd: draft?.columnMapping?.sd ?? "",
        date: draft?.columnMapping?.date ?? "",
        company: draft?.columnMapping?.company ?? "",
    });

    const handleFileUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setError(null);

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData = results.data as Record<string, unknown>[];
                    const cols = results.meta.fields ?? [];
                    console.log("Parsed CSV:", { rows: parsedData.length, columns: cols });
                    setLocalData(parsedData);
                    setColumns(cols);
                    setData(userId, "Z_SCORE", parsedData);
                },
                error: (error) => {
                    console.error("CSV parsing error:", error);
                    setError(`Failed to parse CSV: ${error.message}`);
                },
            });
        },
        [setData]
    );

    const handleMappingChange = (key: string, value: string) => {
        const newMapping = { ...mapping, [key]: value };
        setMapping(newMapping);
        setColumnMapping(userId, "Z_SCORE", newMapping);
    };

    const runAnalysis = useCallback(() => {
        if (!data.length) {
            setError("No data loaded. Please upload a CSV file first.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const points: ChartDataPoint[] = [];
            const zScores: number[] = [];
            let skippedRows = 0;

            console.log("Running analysis with mapping:", mapping);
            console.log("Sample row:", data[0]);

            data.forEach((row, index) => {
                const valueRaw = row[mapping.value];
                const expectedRaw = row[mapping.expected];
                const sdRaw = row[mapping.sd];

                const value = parseFloat(String(valueRaw ?? ""));
                const expected = parseFloat(String(expectedRaw ?? ""));
                const sd = parseFloat(String(sdRaw ?? ""));

                if (isNaN(value) || isNaN(expected) || isNaN(sd) || sd === 0) {
                    skippedRows++;
                    return;
                }

                const zScore = calculateZScore(value, expected, sd);
                zScores.push(zScore);

                points.push({
                    index: points.length,
                    zScore,
                    date: String(row[mapping.date] ?? ""),
                    crm: String(row[mapping.crm] ?? "Unknown"),
                    isOutlier2SD: Math.abs(zScore) > 2,
                    isOutlier3SD: Math.abs(zScore) > 3,
                });
            });

            console.log(`Analysis complete: ${points.length} valid points, ${skippedRows} skipped`);

            if (points.length === 0) {
                setError(`No valid data points found. ${skippedRows} rows were skipped due to invalid or missing values in the mapped columns. Make sure Value, Expected, and SD columns contain numeric values.`);
                setIsProcessing(false);
                return;
            }

            setChartData(points);
            const summaryResult = calculateZScoreSummary(mapping.element || "Element", zScores);
            setSummary(summaryResult);

            // Switch to chart tab to show results
            setActiveTab("chart");
        } catch (err) {
            console.error("Analysis error:", err);
            setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsProcessing(false);
        }
    }, [data, mapping]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Z-Score Analysis</h1>
                    <p className="text-slate-400">Upload CRM data to calculate and visualize Z-scores</p>
                </div>
                {chartData.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                            <Download className="w-4 h-4 mr-2" />Export Excel
                        </Button>
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />Export PPT
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="setup" className="data-[state=active]:bg-slate-800">
                        <Upload className="w-4 h-4 mr-2" />Setup
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="data-[state=active]:bg-slate-800">
                        <BarChart3 className="w-4 h-4 mr-2" />Chart
                        {chartData.length > 0 && (
                            <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                {chartData.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="setup" className="space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">Upload Data</CardTitle>
                            <CardDescription className="text-slate-400">
                                Upload a CSV file containing your CRM data with Value, Expected Value, and SD columns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="bg-slate-800 border-slate-700 text-white file:bg-emerald-500 file:text-white file:border-0"
                                />
                                {data.length > 0 && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                        {data.length} rows loaded
                                    </Badge>
                                )}
                            </div>
                            {columns.length > 0 && (
                                <p className="text-slate-400 text-sm mt-2">
                                    Columns: {columns.join(", ")}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {columns.length > 0 && (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Column Mapping</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Map your CSV columns to the required fields. Value, Expected, and SD are required.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { key: "value", label: "Value Column *", required: true },
                                        { key: "expected", label: "Expected Value Column *", required: true },
                                        { key: "sd", label: "SD Column *", required: true },
                                        { key: "crm", label: "CRM Column" },
                                        { key: "element", label: "Element Column" },
                                        { key: "date", label: "Date Column" },
                                        { key: "company", label: "Company Column" },
                                    ].map(({ key, label, required }) => (
                                        <div key={key} className="space-y-2">
                                            <Label className={required ? "text-white" : "text-slate-300"}>{label}</Label>
                                            <Select
                                                value={mapping[key as keyof typeof mapping]}
                                                onValueChange={(value) => handleMappingChange(key, value)}
                                            >
                                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                                    <SelectValue placeholder="Select column" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800">
                                                    {columns.map((col) => (
                                                        <SelectItem key={col} value={col} className="text-white">{col}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={runAnalysis}
                                    disabled={isProcessing || !mapping.value || !mapping.expected || !mapping.sd}
                                    className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    {isProcessing ? "Processing..." : "Run Analysis"}
                                </Button>
                                {(!mapping.value || !mapping.expected || !mapping.sd) && data.length > 0 && (
                                    <p className="text-yellow-400 text-sm mt-2">
                                        Please map the required columns (Value, Expected, SD) before running analysis.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="chart" className="space-y-6">
                    {summary && (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader><CardTitle className="text-white">Summary Statistics</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div><p className="text-slate-400 text-sm">Samples</p><p className="text-2xl font-bold text-white">{summary.samples}</p></div>
                                    <div><p className="text-slate-400 text-sm">|Z| &gt; 2</p><p className="text-2xl font-bold text-yellow-400">{summary.outliers2SD}</p></div>
                                    <div><p className="text-slate-400 text-sm">Rate &gt; 2σ</p><p className="text-2xl font-bold text-yellow-400">{summary.rate2SD.toFixed(1)}%</p></div>
                                    <div><p className="text-slate-400 text-sm">|Z| &gt; 3</p><p className="text-2xl font-bold text-red-400">{summary.outliers3SD}</p></div>
                                    <div><p className="text-slate-400 text-sm">Rate &gt; 3σ</p><p className="text-2xl font-bold text-red-400">{summary.rate3SD.toFixed(1)}%</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {chartData.length > 0 && (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Z-Score Chart</CardTitle>
                                <CardDescription className="text-slate-400">Z-scores by sequence with ±2/3 SD control limits</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis type="number" dataKey="index" name="Sequence" stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                                            <YAxis type="number" dataKey="zScore" name="Z-Score" domain={["auto", "auto"]} stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} />
                                            {Z_SCORE_CONTROL_LINES.map((line) => (
                                                <ReferenceLine key={line.label} y={line.value} stroke={line.color} strokeDasharray={line.dashed ? "5 5" : "0"} strokeWidth={1.5} />
                                            ))}
                                            <Scatter
                                                name="Z-Scores"
                                                data={chartData}
                                                fill="#10b981"
                                                shape={(props: unknown) => {
                                                    const typedProps = props as { cx: number; cy: number; payload: ChartDataPoint };
                                                    const { cx, cy, payload } = typedProps;
                                                    const color = payload.isOutlier3SD ? "#ef4444" : payload.isOutlier2SD ? "#eab308" : "#10b981";
                                                    return <circle cx={cx} cy={cy} r={4} fill={color} />;
                                                }}
                                            />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {chartData.length > 0 && (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader><CardTitle className="text-white">Data Table</CardTitle></CardHeader>
                            <CardContent>
                                <div className="max-h-[400px] overflow-auto">
                                    <Table>
                                        <TableHeader><TableRow className="border-slate-800">
                                            <TableHead className="text-slate-400">#</TableHead>
                                            <TableHead className="text-slate-400">Date</TableHead>
                                            <TableHead className="text-slate-400">CRM</TableHead>
                                            <TableHead className="text-slate-400">Z-Score</TableHead>
                                            <TableHead className="text-slate-400">Status</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {chartData.slice(0, 100).map((row) => (
                                                <TableRow key={row.index} className="border-slate-800">
                                                    <TableCell className="text-slate-300">{row.index + 1}</TableCell>
                                                    <TableCell className="text-slate-300">{row.date}</TableCell>
                                                    <TableCell className="text-slate-300">{row.crm}</TableCell>
                                                    <TableCell className="text-slate-300">{row.zScore.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        {row.isOutlier3SD ? (
                                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">&gt;3σ</Badge>
                                                        ) : row.isOutlier2SD ? (
                                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">&gt;2σ</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">OK</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {chartData.length === 0 && (
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardContent className="py-12 text-center">
                                <BarChart3 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                                <p className="text-slate-400">No data yet. Upload a CSV file in the Setup tab and run the analysis.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
