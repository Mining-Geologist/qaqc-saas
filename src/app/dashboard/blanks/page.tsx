"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Play, Download, FileSpreadsheet, BarChart3, AlertCircle, Settings2, ChevronDown, ChevronUp, FileImage, Check, Filter, X } from "lucide-react";
import Papa from "papaparse";
import {
    ResponsiveContainer,
    ComposedChart,
    Scatter,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend,
} from "recharts";
import { analyzeBlanks, BlankDataPoint, BlankSummary } from "@/lib/mining-math/blanks";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useAuthStore } from "@/stores/auth-store";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PptxGenJS from "pptxgenjs";
import { toPng } from "html-to-image";

// -----------------------------------------------------------------------------
// Interfaces
// -----------------------------------------------------------------------------

export interface BlanksChartResult {
    element: string;
    lab: string;
    type: string;
    points: BlankDataPoint[];
    summary: BlankSummary;
    limitLine: number | number[]; // Scalar or array
}

export interface GlobalChartSettings {
    pointColor: string;
    failureColor: string;
    limitLineColor: string;
    decimals: number;
    rotation: number;
    showSummary: boolean;
    summarySize: number;
    backgroundColor: string;
    textColor: string;
    pointSize: number;
}

export interface ChartOverrideSettings {
    yMin?: number;
    yMax?: number;
    minDate?: string;
    maxDate?: string;
    limitMultiplier?: number; // e.g., 5x or 10x LOD
    showSummary?: boolean;
    pointColor?: string;
    decimals?: number;
    rotation?: number;
    summarySize?: number;
    limitValue?: number; // Override base limit (scalar)
}

// -----------------------------------------------------------------------------
// Shared Utilities & Components
// -----------------------------------------------------------------------------

const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const safeStr = dateStr.includes("-") && !dateStr.includes("T") && !dateStr.includes(":")
        ? dateStr + "T00:00:00"
        : dateStr;
    const d = new Date(safeStr);
    return isNaN(d.getTime()) ? dateStr : d.toISOString().split("T")[0];
};

function GlobalChartSettingsPanel({
    defaults,
    onApply
}: {
    defaults: GlobalChartSettings;
    onApply: (newDefaults: GlobalChartSettings) => void;
}) {
    const [pendingDefaults, setPendingDefaults] = useState<GlobalChartSettings>(defaults);

    useEffect(() => {
        setPendingDefaults(defaults);
    }, [defaults]);

    const hasChanges = JSON.stringify(defaults) !== JSON.stringify(pendingDefaults);

    return (
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t-lg">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Settings2 className="w-5 h-5" />
                            Global Chart Defaults
                        </CardTitle>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 border-t border-slate-800 mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Background</Label>
                                <Input type="color" value={pendingDefaults.backgroundColor} onChange={(e) => setPendingDefaults({ ...pendingDefaults, backgroundColor: e.target.value })} className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Point Color</Label>
                                <Input type="color" value={pendingDefaults.pointColor} onChange={(e) => setPendingDefaults({ ...pendingDefaults, pointColor: e.target.value })} className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Failure Color</Label>
                                <Input type="color" value={pendingDefaults.failureColor} onChange={(e) => setPendingDefaults({ ...pendingDefaults, failureColor: e.target.value })} className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Point Size</Label>
                                <Input type="number" min={1} max={20} value={pendingDefaults.pointSize} onChange={(e) => setPendingDefaults({ ...pendingDefaults, pointSize: parseInt(e.target.value) || 3 })} className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Decimals</Label>
                                <Input type="number" min={0} max={10} value={pendingDefaults.decimals} onChange={(e) => setPendingDefaults({ ...pendingDefaults, decimals: parseInt(e.target.value) || 2 })} className="bg-slate-800 border-slate-700 text-white" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Summary Size</Label>
                                <Slider min={0.5} max={1.5} step={0.1} value={[pendingDefaults.summarySize]} onValueChange={(vals) => setPendingDefaults({ ...pendingDefaults, summarySize: vals[0] })} className="mt-4" />
                            </div>
                            <div className="flex flex-col gap-4 pt-1">
                                <div className="flex items-center gap-2">
                                    <Switch checked={pendingDefaults.showSummary} onCheckedChange={(c) => setPendingDefaults({ ...pendingDefaults, showSummary: c })} />
                                    <Label className="text-slate-300">Show Summary</Label>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => onApply(pendingDefaults)}
                                    disabled={!hasChanges}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply Changes
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

function ExportDialog({ charts }: { charts: BlanksChartResult[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCharts, setSelectedCharts] = useState<Set<number>>(new Set(charts.map((_, i) => i)));
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState("");

    const toggleChart = (index: number) => {
        setSelectedCharts(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleExportPPT = async () => {
        setIsExporting(true);
        setExportStatus("Generating PowerPoint...");
        try {
            const pptx = new PptxGenJS();
            pptx.layout = "LAYOUT_16x9";

            const slide = pptx.addSlide();
            slide.background = { color: "111827" };
            slide.addText("Blanks Analysis Report", { x: 1, y: 3, fontSize: 32, color: "10b981", align: "center" });
            slide.addText(`Generated: ${new Date().toLocaleDateString()}`, { x: 1, y: 4, fontSize: 16, color: "94a3b8", align: "center" });

            const chartElements = document.querySelectorAll('[id^="blank-chart-"]');

            for (let i = 0; i < chartElements.length; i++) {
                if (!selectedCharts.has(i)) continue;

                const chartEl = chartElements[i] as HTMLElement;
                const chartData = charts[i];

                setExportStatus(`Processing chart ${i + 1}/${charts.length}...`);

                const chartSlide = pptx.addSlide();
                chartSlide.background = { color: "111827" };
                chartSlide.addText(`${chartData.element} - ${chartData.lab} (${chartData.type})`, { x: 0.5, y: 0.5, fontSize: 18, color: "ffffff", bold: true });

                const dataUrl = await toPng(chartEl, { backgroundColor: "#1e293b" });
                chartSlide.addImage({ data: dataUrl, x: 0.5, y: 1.0, w: 9, h: 4 });

                const stats = [
                    ["Samples", chartData.summary.samples.toString()],
                    ["Failures", chartData.summary.fails.toString()],
                    ["Fail Rate", chartData.summary.failureRate.toFixed(2) + "%"],
                    ["Limit", chartData.summary.limit.toFixed(4)],
                    ["Max Value", chartData.summary.maxValue.toFixed(4)]
                ];

                chartSlide.addTable(stats, {
                    x: 0.5, y: 5.2, w: 4, colW: [2, 2], color: "ffffff", fontSize: 12, border: { color: "334155" }
                });
            }

            await pptx.writeFile({ fileName: `Blanks_Report_${new Date().toISOString().split("T")[0]}.pptx` });
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            setExportStatus("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        setExportStatus("Generating PDF...");
        try {
            const doc = new jsPDF("l", "mm", "a4");
            const chartElements = document.querySelectorAll('[id^="blank-chart-"]');

            for (let i = 0; i < chartElements.length; i++) {
                if (!selectedCharts.has(i)) continue;
                if (i > 0) doc.addPage();

                const chartEl = chartElements[i] as HTMLElement;
                const chartData = charts[i];

                setExportStatus(`Processing page ${i + 1}...`);

                doc.setFillColor(17, 24, 39);
                doc.rect(0, 0, 297, 210, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.text(`${chartData.element} - ${chartData.lab} (${chartData.type})`, 10, 15);

                const dataUrl = await toPng(chartEl, { backgroundColor: "#1e293b" });
                const props = doc.getImageProperties(dataUrl);
                const ratio = props.height / props.width;
                const width = 270;
                const height = width * ratio;
                doc.addImage(dataUrl, "PNG", 10, 25, width, height);

                autoTable(doc, {
                    startY: 25 + height + 10,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Samples", String(chartData.summary.samples)],
                        ["Failures", String(chartData.summary.fails)],
                        ["Failure Rate", `${chartData.summary.failureRate.toFixed(2)}%`],
                        ["Limit", chartData.summary.limit.toFixed(4)],
                        ["Max Value", chartData.summary.maxValue.toFixed(4)],
                    ] as any,
                    theme: 'grid',
                    styles: { fillColor: [30, 41, 59], textColor: 255 },
                    headStyles: { fillColor: [16, 185, 129] },
                });
            }
            doc.save(`Blanks_Report_${new Date().toISOString().split("T")[0]}.pdf`);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            setExportStatus("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Analysis Report</DialogTitle>
                    <DialogDescription className="text-slate-400">Select charts to include.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCharts(new Set(charts.map((_, i) => i)))}>Select All</Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCharts(new Set())}>Select None</Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-800 rounded p-2">
                        {charts.map((chart, i) => (
                            <div key={i} className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded">
                                <Checkbox
                                    id={`chart-${i}`}
                                    checked={selectedCharts.has(i)}
                                    onCheckedChange={() => toggleChart(i)}
                                    className="border-slate-600 data-[state=checked]:bg-emerald-500"
                                />
                                <label htmlFor={`chart-${i}`} className="text-sm cursor-pointer flex-1">
                                    {chart.element} - {chart.lab} <span className="text-slate-500">({chart.type})</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    {isExporting && (
                        <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center py-2 bg-emerald-500/10 rounded"><div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />{exportStatus}</div>
                    )}
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button onClick={handleExportPPT} disabled={isExporting} className="bg-[#D04423] hover:bg-[#B03413] w-full sm:w-auto"><FileImage className="w-4 h-4 mr-2" />PowerPoint</Button>
                        <Button onClick={handleExportPDF} disabled={isExporting} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"><FileSpreadsheet className="w-4 h-4 mr-2" />PDF</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// -----------------------------------------------------------------------------
// Chart Component
// -----------------------------------------------------------------------------

function BlankChartWithControls({
    chart,
    chartId,
    defaults,
    overrides = {},
    onOverrideChange
}: {
    chart: BlanksChartResult;
    chartId: string;
    defaults: GlobalChartSettings;
    overrides?: ChartOverrideSettings;
    onOverrideChange: (settings: Partial<ChartOverrideSettings>) => void;
}) {
    const showSummary = overrides.showSummary ?? defaults.showSummary;
    const summarySize = overrides.summarySize ?? defaults.summarySize;
    const decimals = overrides.decimals ?? defaults.decimals;
    const rotation = overrides.rotation ?? defaults.rotation;
    const pointColor = overrides.pointColor ?? defaults.pointColor;

    const limitMultiplier = overrides.limitMultiplier ?? 1.0;
    const effectiveLimit = useMemo(() => {
        if (overrides.limitValue !== undefined) {
            return overrides.limitValue * limitMultiplier;
        }
        if (Array.isArray(chart.limitLine)) {
            return chart.limitLine.map(l => l * limitMultiplier);
        }
        return chart.limitLine * limitMultiplier;
    }, [chart.limitLine, limitMultiplier, overrides.limitValue]);

    const displayData = useMemo(() => {
        let data = chart.points;
        if (overrides.minDate) data = data.filter(d => d.date && normalizeDate(d.date.toISOString()) >= overrides.minDate!);
        if (overrides.maxDate) data = data.filter(d => d.date && normalizeDate(d.date.toISOString()) <= overrides.maxDate!);

        return data.map(p => {
            let limit = 0;
            if (Array.isArray(effectiveLimit)) {
                limit = effectiveLimit[p.index] ?? 0;
            } else {
                limit = effectiveLimit;
            }
            return {
                ...p,
                limit,
                isFailure: p.value > limit
            };
        });
    }, [chart.points, overrides.minDate, overrides.maxDate, effectiveLimit]);

    const yMin = overrides.yMin ?? 0;
    // Ensure yMax is at least limit or data max, avoiding 0
    const maxVal = Math.max(...displayData.map(d => d.value));
    const limitVal = typeof effectiveLimit === 'number' ? effectiveLimit : Math.max(...(effectiveLimit as number[]));
    const autoMax = Math.max(maxVal, limitVal) * 1.1 || 1.0;

    const yMax = overrides.yMax ?? autoMax;

    return (
        <Card id={chartId} className="bg-slate-900 border-slate-800 overflow-hidden" style={{ backgroundColor: defaults.backgroundColor }}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg" style={{ color: defaults.textColor }}>
                            {chart.element} <span className="text-slate-500 text-sm">({chart.lab})</span>
                            <Badge variant="outline" className="ml-2 text-slate-400 border-slate-700">{chart.type}</Badge>
                        </h3>
                        {showSummary && (
                            <div className="flex gap-4 text-sm bg-slate-800/50 rounded-lg px-3 py-1" style={{ transform: `scale(${summarySize})`, transformOrigin: "left center" }}>
                                <div className="text-slate-400">Samples: <span className="text-white font-mono">{displayData.length}</span></div>
                                <div className="text-slate-400">Fails: <span className="text-red-400 font-mono">{displayData.filter(d => d.isFailure).length}</span></div>
                                <div className="text-slate-400">Limit: <span className="text-emerald-400 font-mono">{(typeof effectiveLimit === 'number' ? effectiveLimit : Math.max(...effectiveLimit)).toFixed(decimals)}</span></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis
                                    dataKey={displayData[0]?.date ? "date" : "index"}
                                    stroke={defaults.textColor}
                                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                                    tickFormatter={(val) => val instanceof Date ? val.toLocaleDateString() : val}
                                    angle={-rotation}
                                    textAnchor={rotation > 0 ? "end" : "middle"}
                                    height={60}
                                />
                                <YAxis domain={[yMin, yMax]} stroke={defaults.textColor} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload as BlankDataPoint;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
                                                    <p className="text-slate-400 text-xs mb-1">Row: {data.index + 1}</p>
                                                    {data.date && <p className="text-slate-400 text-xs mb-1">{data.date.toLocaleDateString()}</p>}
                                                    <p className="text-white font-bold text-lg">{data.value.toFixed(decimals)}</p>
                                                    <div className="mt-2 pt-2 border-t border-slate-800">
                                                        <p className="text-xs text-emerald-400">Limit: {data.limit.toFixed(decimals)}</p>
                                                        {data.isFailure && <p className="text-xs text-red-400 font-bold mt-1">FAILURE</p>}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter
                                    data={displayData}
                                    shape={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const isFail = payload.isFailure;
                                        return <circle cx={cx} cy={cy} r={isFail ? defaults.pointSize + 2 : defaults.pointSize} fill={isFail ? defaults.failureColor : pointColor} stroke={isFail ? "#fff" : "none"} strokeWidth={1} />;
                                    }}
                                />
                                {typeof effectiveLimit === 'number' && (
                                    <ReferenceLine y={effectiveLimit} stroke={defaults.limitLineColor} strokeDasharray="5 5" label={{ value: "Limit", fill: defaults.limitLineColor, fontSize: 10 }} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-6 bg-slate-950/30 p-4 rounded-lg border border-slate-800/50 h-fit">
                        <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Y-Axis</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" value={yMin} onChange={(e) => onOverrideChange({ yMin: parseFloat(e.target.value) })} className="h-8 text-xs bg-slate-900" />
                                <Input type="number" value={yMax.toFixed(2)} onChange={(e) => onOverrideChange({ yMax: parseFloat(e.target.value) })} className="h-8 text-xs bg-slate-900" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Multiplier: {limitMultiplier}x</Label>
                            <Slider min={1} max={10} step={0.5} value={[limitMultiplier]} onValueChange={(vals) => onOverrideChange({ limitMultiplier: vals[0] })} />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Base Limit</Label>
                            <Input
                                type="number"
                                placeholder={Array.isArray(chart.limitLine) ? "Dynamic" : String(chart.limitLine)}
                                value={overrides.limitValue ?? ""}
                                onChange={(e) => onOverrideChange({ limitValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                className="h-8 text-xs bg-slate-900"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Color</Label>
                            <Input type="color" value={pointColor} onChange={(e) => onOverrideChange({ pointColor: e.target.value })} className="h-8 w-full p-1 bg-slate-900 cursor-pointer" />
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <Label className="text-xs text-slate-400">Summary</Label>
                            <Switch checked={showSummary} onCheckedChange={(c) => onOverrideChange({ showSummary: c })} className="scale-75" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function BlanksPage() {
    const { currentUser } = useAuthStore();
    const userId = currentUser?.id ?? "guest";
    const { getDraft, setData, setColumnMapping, setDraft, setFilters: setStoreFilters } = useAnalysisStore();
    const draft = getDraft(userId, "BLANKS");

    // Local State
    const [rawData, setRawData] = useState<Record<string, unknown>[]>(
        (draft?.data as Record<string, unknown>[]) ?? []
    );
    const [columns, setColumns] = useState<string[]>(draft?.columns ?? []);
    const [charts, setCharts] = useState<BlanksChartResult[]>(
        (draft?.results as unknown as BlanksChartResult[]) ?? []
    );
    const [chartOverrides, setChartOverrides] = useState<Record<string, ChartOverrideSettings>>(
        (draft?.overrides as Record<string, ChartOverrideSettings>) ?? {}
    );

    // Filter State
    const [filters, setFilters] = useState<{
        selectedLabs: string[];
        selectedElements: string[];
        selectedTypes: string[];
        categorical: { column: string; values: string[] }[];
        numerical: { column: string; range: [number, number] }[];
        dateRange: { start: string | null; end: string | null };
    }>((draft?.filters?.advanced as any) ?? {
        selectedLabs: [],
        selectedElements: [],
        selectedTypes: [],
        categorical: [
            { column: "", values: [] },
            { column: "", values: [] },
            { column: "", values: [] }
        ],
        numerical: [
            { column: "", range: [0, 0] },
            { column: "", range: [0, 0] }
        ],
        dateRange: { start: null, end: null }
    });

    const [activeTab, setActiveTab] = useState("setup");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mappings
    const [mapping, setMapping] = useState({
        element: draft?.columnMapping?.element ?? "",
        lab: draft?.columnMapping?.lab ?? "",
        sampleId: draft?.columnMapping?.sampleId ?? "",
        value: draft?.columnMapping?.value ?? "",
        limit: draft?.columnMapping?.limit ?? "",
        date: draft?.columnMapping?.date ?? "",
        type: draft?.columnMapping?.type ?? "",
        unit: draft?.columnMapping?.unit ?? "",
    });

    // Global Defaults
    const [chartDefaults, setChartDefaults] = useState<GlobalChartSettings>((draft?.styleSettings?.chartDefaults as GlobalChartSettings) ?? {
        pointColor: "#3b82f6",
        failureColor: "#ef4444",
        limitLineColor: "#10b981",
        pointSize: 3,
        decimals: 4,
        rotation: 0,
        showSummary: true,
        summarySize: 1,
        backgroundColor: "#0f172a",
        textColor: "#94a3b8"
    });

    // Persistence Effect
    useEffect(() => {
        setDraft(userId, "BLANKS", {
            filters: { advanced: filters }, // Store complex filter object
            styleSettings: { chartDefaults },
            results: charts,
            overrides: chartOverrides
        });
    }, [userId, filters, chartDefaults, charts, chartOverrides, setDraft]);


    // Handlers
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                const parsedData = results.data as Record<string, unknown>[];
                const cols = results.meta.fields ?? [];
                setRawData(parsedData);
                setColumns(cols);
                setData(userId, "BLANKS", parsedData);
                setCharts([]);
            },
            error: (err) => setError(`CSV Error: ${err.message}`)
        });
    };

    const handleMappingChange = (key: string, value: string) => {
        setMapping(prev => {
            const next = { ...prev, [key]: value };
            setColumnMapping(userId, "BLANKS", next);
            return next;
        });
    };

    const handleOverrideChange = (id: string, newSettings: Partial<ChartOverrideSettings>) => {
        setChartOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...newSettings } }));
    };

    // Filter Logic Helpers
    const getUniqueValues = (col: string) => {
        if (!col || !rawData.length) return [];
        return Array.from(new Set(rawData.map(r => String(r[col])))).filter(Boolean).sort();
    };

    const getNumRange = (col: string): [number, number] => {
        if (!col || !rawData.length) return [0, 100];
        const vals = rawData.map(r => Number(r[col])).filter(n => !isNaN(n));
        return [Math.min(...vals), Math.max(...vals)];
    };


    // Helper to clean numeric values (remove <, >, etc.)
    const cleanValue = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return NaN;

        // Handle strings like "<0.01" or ">500"
        const s = String(val).trim();
        const clean = s.replace(/[<>,]/g, ''); // Remove <, >, and commas
        return Number(clean);
    };

    const runAnalysis = () => {
        if (!mapping.element || !mapping.value) {
            setError("Please map at least Element and Value columns.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Apply all filters first
            let filteredData = [...rawData];

            // 1. Core Filters
            if (filters.selectedElements.length > 0) {
                filteredData = filteredData.filter(r => filters.selectedElements.includes(String(r[mapping.element])));
            }
            if (filters.selectedLabs.length > 0 && mapping.lab) {
                filteredData = filteredData.filter(r => filters.selectedLabs.includes(String(r[mapping.lab])));
            }
            if (filters.selectedTypes.length > 0 && mapping.type) {
                filteredData = filteredData.filter(r => filters.selectedTypes.includes(String(r[mapping.type])));
            }

            // 2. Categorical
            filters.categorical.forEach(f => {
                if (f.column && f.values.length > 0) {
                    filteredData = filteredData.filter(r => f.values.includes(String(r[f.column])));
                }
            });

            // 3. Numerical
            filters.numerical.forEach(f => {
                if (f.column) {
                    filteredData = filteredData.filter(r => {
                        const val = Number(r[f.column]);
                        return !isNaN(val) && val >= f.range[0] && val <= f.range[1];
                    });
                }
            });

            // 4. Date
            if (mapping.date && filters.dateRange.start && filters.dateRange.end) {
                const s = new Date(filters.dateRange.start);
                const e = new Date(filters.dateRange.end);
                filteredData = filteredData.filter(r => {
                    const d = new Date(String(r[mapping.date]));
                    return !isNaN(d.getTime()) && d >= s && d <= e;
                });
            }

            // Group by Element | Lab | Type
            const groups: Record<string, typeof rawData> = {};

            filteredData.forEach(row => {
                const element = String(row[mapping.element]);
                const lab = mapping.lab ? String(row[mapping.lab]) : "Default Lab";
                const type = mapping.type ? String(row[mapping.type]) : "Unknown";

                const key = `${element}|${lab}|${type}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            const newCharts: BlanksChartResult[] = Object.entries(groups).map(([key, rows]) => {
                const [element, lab, type] = key.split("|");

                // Sort by Date if available
                if (mapping.date) {
                    rows.sort((a, b) => {
                        const da = new Date(String(a[mapping.date]));
                        const db = new Date(String(b[mapping.date]));
                        return (isNaN(da.getTime()) ? 0 : da.getTime()) - (isNaN(db.getTime()) ? 0 : db.getTime());
                    });
                }

                // Use cleanValue for parsing
                const values = rows.map(r => cleanValue(r[mapping.value]));

                let limit: number | number[] = 0.01;
                if (mapping.limit) {
                    limit = rows.map(r => cleanValue(r[mapping.limit]));
                }

                // Ensure dates align 1:1 with values
                const dates = mapping.date ? rows.map(r => {
                    const d = new Date(String(r[mapping.date]));
                    return isNaN(d.getTime()) ? undefined : d;
                }) : undefined;

                const result = analyzeBlanks(values, limit, dates);

                return {
                    element,
                    lab,
                    type,
                    points: result.points,
                    summary: { ...result.summary, lab, element, type },
                    limitLine: limit
                };
            });

            setCharts(newCharts);
            setActiveTab("charts");

        } catch (err: any) {
            setError(err.message || "An error occurred during analysis.");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 p-1">
                            <BarChart3 className="w-6 h-6" />
                        </Badge>
                        Blanks Analysis
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {charts.length > 0 && <ExportDialog charts={charts} />}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="setup" className="data-[state=active]:bg-emerald-500">Setup & Data</TabsTrigger>
                    <TabsTrigger value="charts" disabled={charts.length === 0} className="data-[state=active]:bg-emerald-500">
                        Analysis Charts
                        {charts.length > 0 && <Badge className="ml-2 bg-slate-950 text-emerald-400">{charts.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="setup" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Data Column */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">1. Data Input</CardTitle>
                                    <CardDescription>Upload your assay CSV data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
                                            <Label htmlFor="file-upload" className="flex items-center justify-center w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer border border-slate-700 transition-colors">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload CSV
                                            </Label>
                                        </div>
                                        {rawData.length > 0 && (
                                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                                                <Check className="w-3 h-3 mr-1" />
                                                {rawData.length} rows loaded
                                            </Badge>
                                        )}
                                    </div>

                                    {rawData.length > 0 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
                                            <div className="space-y-2">
                                                <Label className="text-emerald-400 font-bold">Element *</Label>
                                                <Select value={mapping.element} onValueChange={(v) => handleMappingChange("element", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-emerald-400 font-bold">Value *</Label>
                                                <Select value={mapping.value} onValueChange={(v) => handleMappingChange("value", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">Lab (Optional)</Label>
                                                <Select value={mapping.lab} onValueChange={(v) => handleMappingChange("lab", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">Date (Optional)</Label>
                                                <Select value={mapping.date} onValueChange={(v) => handleMappingChange("date", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">Limit/LOD (Optional)</Label>
                                                <Select value={mapping.limit} onValueChange={(v) => handleMappingChange("limit", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-200">Blank Type (Optional)</Label>
                                                <Select value={mapping.type} onValueChange={(v) => handleMappingChange("type", v)}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Run Button Area */}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={runAnalysis}
                                disabled={!rawData.length || isProcessing}
                                className="w-full h-12 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                                {isProcessing ? "Processing..." : "Run Analysis"}
                                <Play className="w-5 h-5 ml-2" />
                            </Button>
                        </div>

                        {/* Sidebar Filters */}
                        <div className="space-y-4">
                            <Card className="bg-slate-950/50 border-slate-800 h-fit sticky top-4">
                                <CardHeader className="pb-3 border-b border-slate-800">
                                    <CardTitle className="text-white text-base flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-emerald-400" />
                                        Filtering
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                    {/* Core Filters */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-emerald-500 uppercase">Core Filters</Label>

                                        {/* Labs */}
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-400">Labs</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.lab && getUniqueValues(mapping.lab).map(lab => (
                                                    <div
                                                        key={lab}
                                                        onClick={() => setFilters(f => ({
                                                            ...f,
                                                            selectedLabs: f.selectedLabs.includes(lab) ? f.selectedLabs.filter(l => l !== lab) : [...f.selectedLabs, lab]
                                                        }))}
                                                        className={`px-2 py-1 text-[10px] rounded cursor-pointer border ${filters.selectedLabs.includes(lab) ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
                                                    >
                                                        {lab}
                                                    </div>
                                                ))}
                                                {(!mapping.lab || getUniqueValues(mapping.lab).length === 0) && <span className="text-xs text-slate-600 italic">Map Lab col first</span>}
                                            </div>
                                        </div>

                                        {/* Elements */}
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-400">Elements</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.element && getUniqueValues(mapping.element).map(el => (
                                                    <div
                                                        key={el}
                                                        onClick={() => setFilters(f => ({
                                                            ...f,
                                                            selectedElements: f.selectedElements.includes(el) ? f.selectedElements.filter(e => e !== el) : [...f.selectedElements, el]
                                                        }))}
                                                        className={`px-2 py-1 text-[10px] rounded cursor-pointer border ${filters.selectedElements.includes(el) ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
                                                    >
                                                        {el}
                                                    </div>
                                                ))}
                                                {(!mapping.element || getUniqueValues(mapping.element).length === 0) && <span className="text-xs text-slate-600 italic">Map Element col first</span>}
                                            </div>
                                        </div>

                                        {/* Types */}
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-400">Blank Types</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {mapping.type && getUniqueValues(mapping.type).map(t => (
                                                    <div
                                                        key={t}
                                                        onClick={() => setFilters(f => ({
                                                            ...f,
                                                            selectedTypes: f.selectedTypes.includes(t) ? f.selectedTypes.filter(x => x !== t) : [...f.selectedTypes, t]
                                                        }))}
                                                        className={`px-2 py-1 text-[10px] rounded cursor-pointer border ${filters.selectedTypes.includes(t) ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
                                                    >
                                                        {t}
                                                    </div>
                                                ))}
                                                {(!mapping.type || getUniqueValues(mapping.type).length === 0) && <span className="text-xs text-slate-600 italic">Map Type col first</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categorical Filters 1-3 */}
                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <Label className="text-xs font-bold text-emerald-500 uppercase">Categorical Filters</Label>
                                        {[0, 1, 2].map(idx => (
                                            <div key={idx} className="space-y-2">
                                                <Label className="text-xs text-slate-400">Filter {idx + 1}</Label>
                                                <Select
                                                    value={filters.categorical[idx].column}
                                                    onValueChange={(col) => setFilters(f => {
                                                        const newCat = [...f.categorical];
                                                        newCat[idx] = { column: col, values: [] };
                                                        return { ...f, categorical: newCat };
                                                    })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs bg-slate-900"><SelectValue placeholder="Select Column..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>

                                                {filters.categorical[idx].column && (
                                                    <div className="flex flex-wrap gap-1 pt-1 max-h-20 overflow-y-auto">
                                                        {getUniqueValues(filters.categorical[idx].column).map(val => (
                                                            <div
                                                                key={val}
                                                                onClick={() => setFilters(f => {
                                                                    const newCat = [...f.categorical];
                                                                    const currentVals = newCat[idx].values;
                                                                    newCat[idx].values = currentVals.includes(val) ? currentVals.filter(v => v !== val) : [...currentVals, val];
                                                                    return { ...f, categorical: newCat };
                                                                })}
                                                                className={`px-2 py-1 text-[10px] rounded cursor-pointer border ${filters.categorical[idx].values.includes(val) ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
                                                            >
                                                                {val}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Numerical Filters 1-2 */}
                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <Label className="text-xs font-bold text-emerald-500 uppercase">Numerical Filters</Label>
                                        {[0, 1].map(idx => (
                                            <div key={idx} className="space-y-2">
                                                <Label className="text-xs text-slate-400">Range {idx + 1}</Label>
                                                <Select
                                                    value={filters.numerical[idx].column}
                                                    onValueChange={(col) => setFilters(f => {
                                                        const newNum = [...f.numerical];
                                                        newNum[idx] = { column: col, range: getNumRange(col) };
                                                        return { ...f, numerical: newNum };
                                                    })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs bg-slate-900"><SelectValue placeholder="Select Column..." /></SelectTrigger>
                                                    <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                </Select>

                                                {filters.numerical[idx].column && (
                                                    <div className="pt-2 px-1">
                                                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                            <span>{filters.numerical[idx].range[0]}</span>
                                                            <span>{filters.numerical[idx].range[1]}</span>
                                                        </div>
                                                        <Slider
                                                            min={getNumRange(filters.numerical[idx].column)[0]}
                                                            max={getNumRange(filters.numerical[idx].column)[1]}
                                                            step={0.1}
                                                            value={[filters.numerical[idx].range[0], filters.numerical[idx].range[1]]}
                                                            onValueChange={(vals) => setFilters(f => {
                                                                const newNum = [...f.numerical];
                                                                newNum[idx].range = [vals[0], vals[1]];
                                                                return { ...f, numerical: newNum };
                                                            })}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Date Filter */}
                                    {mapping.date && (
                                        <div className="space-y-2 pt-4 border-t border-slate-800">
                                            <Label className="text-xs font-bold text-emerald-500 uppercase">Date Range</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-[10px] text-slate-400">Start</Label>
                                                    <Input type="date" className="h-8 text-xs bg-slate-900"
                                                        value={filters.dateRange.start || ""}
                                                        onChange={(e) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, start: e.target.value } }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-slate-400">End</Label>
                                                    <Input type="date" className="h-8 text-xs bg-slate-900"
                                                        value={filters.dateRange.end || ""}
                                                        onChange={(e) => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, end: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-4 border-slate-700 hover:bg-slate-800"
                                        onClick={() => setFilters({
                                            selectedLabs: [], selectedElements: [], selectedTypes: [],
                                            categorical: [{ column: "", values: [] }, { column: "", values: [] }, { column: "", values: [] }],
                                            numerical: [{ column: "", range: [0, 0] }, { column: "", range: [0, 0] }],
                                            dateRange: { start: null, end: null }
                                        })}
                                    >
                                        <X className="w-3 h-3 mr-2" />
                                        Clear Filters
                                    </Button>

                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="space-y-6">
                    <GlobalChartSettingsPanel defaults={chartDefaults} onApply={setChartDefaults} />

                    <div className="space-y-8">
                        {charts.map((chart, i) => {
                            const uniqueKey = `${chart.element}-${chart.lab}-${chart.type}`;
                            return (
                                <BlankChartWithControls
                                    key={uniqueKey}
                                    chartId={`blank-chart-${i}`}
                                    chart={chart}
                                    defaults={chartDefaults}
                                    overrides={chartOverrides[uniqueKey]}
                                    onOverrideChange={(settings) => handleOverrideChange(uniqueKey, settings)}
                                />
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
