"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Play, Download, FileSpreadsheet, BarChart3, AlertCircle, Settings2, ChevronDown, ChevronUp, FileImage, Check } from "lucide-react";
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
import { calculateCrmSummary, CrmSummary, CrmBounds } from "@/lib/mining-math";
import { useAnalysisStore } from "@/stores/analysis-store";
import { saveAnalysisDraft, loadAnalysisDraft } from "@/actions/analysis-persistence";
import { useUser } from "@clerk/nextjs";


export interface ChartDataPoint {
    index: number;
    sequence: number;
    value: number;
    date: string;
    expected: number;
    upper2SD: number;
    lower2SD: number;
    upper3SD: number;
    lower3SD: number;
    isFailure: boolean;
    movingMean?: number;
}

export interface CRMChartData {
    element: string;
    crm: string;
    data: ChartDataPoint[];
    summary: CrmSummary;
    bounds: CrmBounds;
    expectedValue: number;
    meanValue: number;
    minValue: number;
    maxValue: number;
}

export interface GlobalChartSettings {
    pointColor: string;
    failureColor: string;
    decimals: number;
    rotation: number;
    showSummary: boolean;
    summarySize: number;
    backgroundColor: string;
    textColor: string;
}

export interface ChartOverrideSettings {
    yMin?: number;
    yMax?: number;
    minDate?: string;
    maxDate?: string;
    labName?: string;
    tickInterval?: number;
    showSummary?: boolean;
    pointColor?: string;
    failureColor?: string;
    decimals?: number;
    rotation?: number;
    summarySize?: number;
}

// Helper for date normalization
const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return "";
    // Force local time parsing for ISO dates (YYYY-MM-DD -> YYYY-MM-DDT00:00:00)
    // to prevent timezone shifts (e.g. UTC-5 making 2023-01-01 into 2022-12-31)
    const safeStr = dateStr.includes("-") && !dateStr.includes("T") && !dateStr.includes(":")
        ? dateStr + "T00:00:00"
        : dateStr;

    const d = new Date(safeStr);
    if (isNaN(d.getTime())) return dateStr;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Isolated component for Global Settings to prevent CRMPage re-renders on every input change
function GlobalChartSettingsPanel({
    defaults,
    onApply
}: {
    defaults: GlobalChartSettings;
    onApply: (newDefaults: GlobalChartSettings) => void;
}) {
    const [pendingDefaults, setPendingDefaults] = useState<GlobalChartSettings>(defaults);

    // Sync when external defaults change (e.g. initial load)
    useEffect(() => {
        setPendingDefaults(defaults);
    }, [defaults]);

    const hasChanges = JSON.stringify(defaults) !== JSON.stringify(pendingDefaults);

    return (
        <Card className="bg-slate-900/50 border-slate-800">
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
                                <Label className="text-slate-300">Text Color</Label>
                                <Input type="color" value={pendingDefaults.textColor} onChange={(e) => setPendingDefaults({ ...pendingDefaults, textColor: e.target.value })} className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer" />
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
                                <Label className="text-slate-300">Decimals</Label>
                                <Input type="number" min={0} max={10} value={pendingDefaults.decimals} onChange={(e) => setPendingDefaults({ ...pendingDefaults, decimals: parseInt(e.target.value) || 2 })} className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Rotate X °</Label>
                                <Input type="number" min={0} max={90} value={pendingDefaults.rotation} onChange={(e) => setPendingDefaults({ ...pendingDefaults, rotation: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-white" />
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

// Export Dialog Component
function ExportDialog({ charts }: { charts: CRMChartData[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCharts, setSelectedCharts] = useState<Set<number>>(new Set(charts.map((_, i) => i)));
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState("");

    const toggleChart = (index: number) => {
        setSelectedCharts(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    // Reset selection when charts change using useEffect
    useEffect(() => {
        setSelectedCharts(new Set(charts.map((_, i) => i)));
    }, [charts]);

    const selectAll = () => setSelectedCharts(new Set(charts.map((_, i) => i)));
    const selectNone = () => setSelectedCharts(new Set());

    const getSummaryTableData = (selectedIndexes: number[]) => {
        const header = ["Element", "CRM", "Samples", "Mean", "Expected", "SD", "Bias%", "Failures", "Fail Rate%"];
        const rows = selectedIndexes.map(idx => {
            const c = charts[idx];
            if (!c) return ["", "", "", "", "", "", "", "", ""];
            return [
                c.element,
                c.crm,
                c.summary.numSamples.toString(),
                c.meanValue.toFixed(4),
                c.expectedValue.toFixed(4),
                c.summary.standardDeviation.toFixed(4),
                c.summary.bias.toFixed(2),
                c.summary.numOutliers.toString(),
                c.summary.failureRate.toFixed(1)
            ];
        });
        return { header, rows };
    };

    const handleExportPPT = async () => {
        setIsExporting(true);
        setExportStatus("Init...");

        try {
            const pptxgen = (await import("pptxgenjs")).default;
            const { toPng } = await import("html-to-image");
            const pptx = new pptxgen();
            pptx.layout = "LAYOUT_WIDE";
            pptx.title = "CRM Analysis";

            const selectedIndexes = Array.from(selectedCharts).sort((a, b) => a - b);

            // 1. Chart Slides
            for (let i = 0; i < selectedIndexes.length; i++) {
                const idx = selectedIndexes[i];
                setExportStatus(`Capturing chart ${i + 1} of ${selectedIndexes.length}...`);

                const element = document.getElementById(`crm-chart-${idx}`);
                if (element) {
                    const imgData = await toPng(element, {
                        pixelRatio: 2,
                        backgroundColor: "#020817",
                        filter: (node) => !(node as HTMLElement).classList?.contains?.("exclude-from-export")
                    });

                    const slide = pptx.addSlide();
                    slide.background = { color: "020817" };
                    slide.addImage({
                        data: imgData,
                        x: 0.5, y: 0.5, w: 12.33, h: 6,
                        sizing: { type: "contain", w: 12.33, h: 6.5 }
                    });
                }
            }

            // 2. Summary Table Slide
            setExportStatus("Generating Summary Table...");
            const tableSlide = pptx.addSlide();
            tableSlide.background = { color: "020817" };
            tableSlide.addText("Analysis Summary", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: "10B981" });

            const { header, rows } = getSummaryTableData(selectedIndexes);
            const tableData = [
                header.map(text => ({ text, options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } })),
                ...rows.map(row => row.map(text => ({ text, options: { color: "CBD5E1" } })))
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tableSlide.addTable(tableData as any, {
                x: 0.5, y: 1.2, w: 12.33,
                fontSize: 10,
                border: { type: "solid", color: "334155", pt: 0.5 },
                fill: { color: "0F172A" },
                color: "FFFFFF",
            });

            setExportStatus("Saving PPT...");
            await pptx.writeFile({ fileName: `CRM_Analysis_${new Date().toISOString().split("T")[0]}.pptx` });
            setIsOpen(false);
        } catch (err) {
            console.error(err);
            setExportStatus(`Error: ${err instanceof Error ? err.message : "PPT Export Failed"}`);
        } finally {
            setIsExporting(false);
            setExportStatus("");
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        setExportStatus("Init...");

        try {
            const { jsPDF } = await import("jspdf");
            const { toPng } = await import("html-to-image");
            const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const selectedIndexes = Array.from(selectedCharts).sort((a, b) => a - b);

            // 1. Chart Pages
            for (let i = 0; i < selectedIndexes.length; i++) {
                const idx = selectedIndexes[i];
                if (i > 0) pdf.addPage();

                setExportStatus(`Capturing chart ${i + 1} of ${selectedIndexes.length}...`);

                // Background
                pdf.setFillColor(2, 8, 23); // slate-950
                pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

                const element = document.getElementById(`crm-chart-${idx}`);
                if (element) {
                    const imgData = await toPng(element, {
                        pixelRatio: 2,
                        backgroundColor: "#020817",
                        filter: (node) => !(node as HTMLElement).classList?.contains?.("exclude-from-export")
                    });

                    // Fit image to page with margins
                    const margin = 10;
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfImgWidth = pdfWidth - (margin * 2);
                    const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

                    const yPos = pdfImgHeight < (pdfHeight - 20) ? (pdfHeight - pdfImgHeight) / 2 : margin;

                    pdf.addImage(imgData, "PNG", margin, yPos, pdfImgWidth, pdfImgHeight);
                }
            }

            // 2. Summary Table Page
            setExportStatus("Generating Summary Table...");
            pdf.addPage();
            pdf.setFillColor(2, 8, 23);
            pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

            pdf.setTextColor(16, 185, 129);
            pdf.setFontSize(20);
            pdf.text("Analysis Summary", 14, 20);

            const { header, rows } = getSummaryTableData(selectedIndexes);

            // Simple table rendering
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);

            const startY = 30;
            const rowHeight = 8;
            const colWidths = [30, 30, 20, 25, 25, 25, 20, 20, 25];

            // Header
            let x = 14;
            pdf.setFillColor(30, 41, 59); // slate-800
            pdf.rect(14, startY - 5, pdfWidth - 28, rowHeight, "F");
            header.forEach((h, i) => {
                pdf.text(h, x, startY);
                x += colWidths[i];
            });

            // Rows
            rows.forEach((row, rowIndex) => {
                const y = startY + (rowIndex + 1) * rowHeight;
                x = 14;
                if (y > pdfHeight - 20) return;
                row.forEach((cell, colIndex) => {
                    pdf.text(cell, x, y);
                    x += colWidths[colIndex];
                });
            });

            setExportStatus("Saving PDF...");
            pdf.save(`CRM_Analysis_${new Date().toISOString().split("T")[0]}.pdf`);
            setIsOpen(false);
        } catch (err) {
            console.error(err);
            setExportStatus(`Error: ${err instanceof Error ? err.message : "PDF Export Failed"}`);
        } finally {
            setIsExporting(false);
            setExportStatus("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export Charts
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white">Export Charts</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Select charts to export. Images will be captured from current view.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                    <Button variant="outline" size="sm" onClick={selectAll} className="border-slate-700 text-slate-300">
                        <Check className="w-4 h-4 mr-2" />Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone} className="border-slate-700 text-slate-300">
                        Select None
                    </Button>
                    <span className="text-slate-400 text-sm ml-auto">
                        {selectedCharts.size} of {charts.length} selected
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                    {charts.map((chart, idx) => (
                        <div
                            key={idx}
                            onClick={() => toggleChart(idx)}
                            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedCharts.has(idx)
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                }`}
                        >
                            <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center ${selectedCharts.has(idx) ? "bg-emerald-500 border-emerald-500" : "border-slate-500"
                                }`}>
                                {selectedCharts.has(idx) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex items-center justify-center h-20 mb-3 bg-slate-900 rounded">
                                <BarChart3 className="w-8 h-8 text-slate-600" />
                            </div>
                            <h4 className="text-white font-medium text-sm truncate">{chart.crm}</h4>
                            <p className="text-slate-400 text-xs truncate">{chart.element}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-slate-700 text-slate-300 text-xs">{chart.summary.numSamples} samples</Badge>
                                {chart.summary.numOutliers > 0 && (
                                    <Badge className="bg-red-500/20 text-red-400 text-xs">{chart.summary.numOutliers} failures</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {exportStatus && (
                    <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm animate-pulse">
                        {exportStatus}
                    </div>
                )}

                <DialogFooter className="flex gap-3 pt-4 border-t border-slate-800">
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-slate-700 text-slate-300" disabled={isExporting}>Cancel</Button>
                    <Button onClick={handleExportPDF} disabled={selectedCharts.size === 0 || isExporting} className="bg-blue-600 hover:bg-blue-700">
                        <FileImage className="w-4 h-4 mr-2" />{isExporting ? "Exporting..." : "Export to PDF"}
                    </Button>
                    <Button onClick={handleExportPPT} disabled={selectedCharts.size === 0 || isExporting} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />{isExporting ? "Exporting..." : "Export to PPT"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// Per-chart controls component
function ChartWithControls({
    chart,
    idx,
    globalColors,
    defaults,
    showMovingMean,
    overrides = {},
    onOverrideChange
}: {
    chart: CRMChartData;
    idx: number;
    globalColors: { twoSD: string; threeSD: string; expected: string; mean: string };
    defaults: GlobalChartSettings;
    showMovingMean: boolean;
    overrides?: ChartOverrideSettings;
    onOverrideChange: (settings: Partial<ChartOverrideSettings>) => void;
}) {
    const [isControlsOpen, setIsControlsOpen] = useState(false);
    // Effective settings (Merge Override > Default)
    const showSummary = overrides.showSummary ?? defaults.showSummary;
    const pointColor = overrides.pointColor ?? defaults.pointColor;
    const failureColor = overrides.failureColor ?? defaults.failureColor;
    const decimals = overrides.decimals ?? defaults.decimals;
    const rotation = overrides.rotation ?? defaults.rotation;
    const summarySize = overrides.summarySize ?? defaults.summarySize;

    // Data-dependent defaults if no override
    const yMin = overrides.yMin ?? (chart.minValue - chart.summary.standardDeviation);
    const yMax = overrides.yMax ?? (chart.maxValue + chart.summary.standardDeviation);

    const labName = overrides.labName ?? "";
    const tickInterval = overrides.tickInterval ?? 3;

    // Date Filtering & defaults
    const sortedDates = useMemo(() => [...chart.data].map(d => d.date).sort(), [chart.data]);
    const minDate = overrides.minDate ?? (sortedDates[0] || "");
    const maxDate = overrides.maxDate ?? (sortedDates[sortedDates.length - 1] || "");

    // Filter data based on current Y range and Date range
    const filteredData = useMemo(() => {
        return chart.data.filter(d =>
            d.value >= yMin &&
            d.value <= yMax &&
            (!minDate || d.date >= minDate) &&
            (!maxDate || d.date <= maxDate)
        );
    }, [chart.data, yMin, yMax, minDate, maxDate]);

    const chartTitle = `${chart.crm} - ${chart.element}${labName ? ` - ${labName}` : ""}`;

    return (
        <div id={`crm-chart-${idx}`} className="space-y-4 border border-slate-800 rounded-lg p-4 bg-slate-950/50">
            <h2 className="text-xl font-bold text-emerald-400 text-center">{chartTitle}</h2>

            {/* Collapsible Controls */}
            <div className="exclude-from-export">
                <Collapsible open={isControlsOpen} onOpenChange={setIsControlsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full border-slate-700 text-slate-300 justify-between">
                            <span className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                Chart Controls
                            </span>
                            {isControlsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* Y Axis Range */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Y Min</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={yMin}
                                    onChange={(e) => onOverrideChange({ yMin: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Y Max</Label>
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={yMax}
                                    onChange={(e) => onOverrideChange({ yMax: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            {/* Date Range */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Min Date</Label>
                                <Input
                                    type="date"
                                    value={minDate}
                                    onChange={(e) => onOverrideChange({ minDate: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Max Date</Label>
                                <Input
                                    type="date"
                                    value={maxDate}
                                    onChange={(e) => onOverrideChange({ maxDate: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            {/* Lab Name */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Lab Name</Label>
                                <Input
                                    type="text"
                                    value={labName}
                                    onChange={(e) => onOverrideChange({ labName: e.target.value })}
                                    placeholder="Enter lab name"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            {/* Tick Interval */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Tick Interval</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={tickInterval}
                                    onChange={(e) => onOverrideChange({ tickInterval: parseInt(e.target.value) || 3 })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            {/* Y Axis Decimals */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Decimals</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={decimals}
                                    onChange={(e) => onOverrideChange({ decimals: parseInt(e.target.value) || 2 })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            {/* Colors */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Point Color</Label>
                                <Input
                                    type="color"
                                    value={pointColor}
                                    onChange={(e) => onOverrideChange({ pointColor: e.target.value })}
                                    className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Failure Color</Label>
                                <Input
                                    type="color"
                                    value={failureColor}
                                    onChange={(e) => onOverrideChange({ failureColor: e.target.value })}
                                    className="bg-slate-800 border-slate-700 h-10 p-1 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-t border-slate-800 pt-4 mt-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={showSummary}
                                    onCheckedChange={(c) => onOverrideChange({ showSummary: c })}
                                />
                                <Label className="text-slate-300">Show Summary</Label>
                            </div>

                            {/* Summary Size */}
                            <div className="flex items-center gap-2">
                                <Label className="text-slate-300 text-xs">Size</Label>
                                <Slider
                                    min={0.5} max={1.5} step={0.1}
                                    value={[summarySize]}
                                    onValueChange={(vals) => onOverrideChange({ summarySize: vals[0] })}
                                    className="w-24"
                                />
                            </div>

                            {/* Rotation */}
                            <div className="flex items-center gap-2">
                                <Label className="text-slate-300 text-xs whitespace-nowrap">Rotate X °</Label>
                                <Input
                                    type="number"
                                    min={0} max={90}
                                    value={rotation}
                                    onChange={(e) => onOverrideChange({ rotation: parseInt(e.target.value) || 0 })}
                                    className="w-16 h-8 bg-slate-800 border-slate-700 text-white"
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300 ml-auto"
                                onClick={() => {
                                    onOverrideChange({
                                        yMin: chart.minValue - chart.summary.standardDeviation,
                                        yMax: chart.maxValue + chart.summary.standardDeviation
                                    });
                                }}
                            >
                                Reset Y Axis
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Summary stats */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                        <div>
                            <p className="text-slate-400 text-sm">Samples</p>
                            <p className="text-xl font-bold text-white">{chart.summary.numSamples}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Mean</p>
                            <p className="text-xl font-bold text-white">{(chart.meanValue ?? 0).toFixed(4)}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Expected</p>
                            <p className="text-xl font-bold text-emerald-400">{chart.expectedValue.toFixed(4)}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Std Dev</p>
                            <p className="text-xl font-bold text-white">{(chart.summary.standardDeviation ?? 0).toFixed(4)}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Bias</p>
                            <p className={`text-xl font-bold ${Math.abs(chart.summary.bias ?? 0) > 5 ? "text-yellow-400" : "text-emerald-400"}`}>
                                {(chart.summary.bias ?? 0).toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Failures</p>
                            <p className="text-xl font-bold text-red-400">{chart.summary.numOutliers}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Failure Rate</p>
                            <p className={`text-xl font-bold ${(chart.summary.failureRate ?? 0) > 5 ? "text-red-400" : "text-emerald-400"}`}>
                                {(chart.summary.failureRate ?? 0).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chart */}
            <Card className="border-slate-800" style={{ backgroundColor: defaults?.backgroundColor || "#0f172a" }}>
                <CardContent className="pt-6">
                    <div className="text-center pb-2 font-bold text-lg" style={{ color: defaults?.textColor || "#e2e8f0" }}>
                        {chart.crm} - {chart.element} {labName ? `- ${labName}` : ""}
                    </div>
                    <div className="h-[400px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={filteredData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke={defaults?.textColor || "#94a3b8"}
                                    height={rotation > 0 ? 100 : 30}
                                    tick={{
                                        fill: defaults?.textColor || "#94a3b8",
                                        angle: -rotation,
                                        textAnchor: rotation > 0 ? "end" : "middle"
                                    } as any}
                                    interval={tickInterval - 1}
                                />
                                <YAxis
                                    domain={[yMin, yMax]}
                                    stroke={defaults?.textColor || "#94a3b8"}
                                    tick={{ fill: defaults?.textColor || "#94a3b8" }}
                                    tickFormatter={(val) => Number(val).toFixed(decimals)}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                    labelStyle={{ color: "#fff" }}
                                    formatter={(value) => [typeof value === "number" ? value.toFixed(decimals) : String(value)]}
                                />
                                <Legend />

                                {/* Control lines */}
                                <ReferenceLine y={chart.expectedValue} stroke={globalColors.expected} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: "Expected", position: "right", fill: "#94a3b8", fontSize: 10 }} />
                                <ReferenceLine y={chart.meanValue} stroke={globalColors.mean} strokeWidth={1.5} label={{ value: "Mean", position: "right", fill: "#92B2F5", fontSize: 10 }} />
                                <ReferenceLine y={chart.bounds.upper2SD} stroke={globalColors.twoSD} strokeWidth={1.5} label={{ value: "+2SD", position: "right", fill: globalColors.twoSD, fontSize: 10 }} />
                                <ReferenceLine y={chart.bounds.lower2SD} stroke={globalColors.twoSD} strokeWidth={1.5} label={{ value: "-2SD", position: "right", fill: globalColors.twoSD, fontSize: 10 }} />
                                <ReferenceLine y={chart.bounds.upper3SD} stroke={globalColors.threeSD} strokeDasharray="3 3" strokeWidth={1.5} label={{ value: "+3SD", position: "right", fill: globalColors.threeSD, fontSize: 10 }} />
                                <ReferenceLine y={chart.bounds.lower3SD} stroke={globalColors.threeSD} strokeDasharray="3 3" strokeWidth={1.5} label={{ value: "-3SD", position: "right", fill: globalColors.threeSD, fontSize: 10 }} />

                                {/* Moving mean line */}
                                {showMovingMean && (
                                    <Line
                                        type="monotone"
                                        dataKey="movingMean"
                                        stroke="#A6A6A6"
                                        strokeDasharray="5 5"
                                        strokeWidth={1}
                                        dot={false}
                                        name="Moving Mean (7)"
                                        connectNulls
                                    />
                                )}

                                {/* Data points */}
                                <Scatter
                                    name="CRM Values"
                                    dataKey="value"
                                    fill={pointColor}
                                    shape={(props: unknown) => {
                                        const typedProps = props as { cx: number; cy: number; payload: ChartDataPoint };
                                        const { cx, cy, payload } = typedProps;
                                        const isOutside2SD = payload.value > payload.upper2SD || payload.value < payload.lower2SD;
                                        const color = payload.isFailure ? failureColor : isOutside2SD ? globalColors.twoSD : pointColor;
                                        return <circle cx={cx} cy={cy} r={5} fill={color} />;
                                    }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>

                        {/* Summary overlay */}
                        {showSummary && (
                            <div
                                className="absolute top-4 right-14 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs shadow-xl z-20 pointer-events-none"
                                style={{ transform: `scale(${summarySize})`, transformOrigin: 'top right' }}
                            >
                                <div className="space-y-1">
                                    <p className="text-slate-300">Samples: <span className="text-white font-bold">{chart.summary.numSamples}</span></p>
                                    <p className="text-slate-300">Mean: <span className="text-white font-bold">{(chart.meanValue ?? 0).toFixed(4)}</span></p>
                                    <p className="text-slate-300">Expected: <span className="text-emerald-400 font-bold">{(chart.expectedValue ?? 0).toFixed(4)}</span></p>
                                    <p className="text-slate-300">Std Dev: <span className="text-white font-bold">{(chart.summary.standardDeviation ?? 0).toFixed(4)}</span></p>
                                    <p className="text-slate-300">Bias: <span className={Math.abs(chart.summary.bias ?? 0) > 5 ? "text-yellow-400" : "text-emerald-400"}>{(chart.summary.bias ?? 0).toFixed(2)}%</span></p>
                                    <p className="text-slate-300">Failures: <span className="text-red-400 font-bold">{chart.summary.numOutliers}</span></p>
                                    <p className="text-slate-300">Failure Rate: <span className={(chart.summary.failureRate ?? 0) > 5 ? "text-red-400" : "text-emerald-400"}>{(chart.summary.failureRate ?? 0).toFixed(1)}%</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pointColor }}></div>
                            <span className="text-slate-400">Within limits</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: globalColors.twoSD }}></div>
                            <span className="text-slate-400">Outside ±2σ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: failureColor }}></div>
                            <span className="text-slate-400">Failure (±3σ)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table - Collapsible */}
            <div className="exclude-from-export">
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                            View Data Table ({chart.data.length} rows)
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardContent className="pt-4">
                                <div className="max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-800">
                                                <TableHead className="text-slate-400">#</TableHead>
                                                <TableHead className="text-slate-400">Date</TableHead>
                                                <TableHead className="text-slate-400">Value</TableHead>
                                                <TableHead className="text-slate-400">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {chart.data.slice(0, 50).map((row) => (
                                                <TableRow key={row.index} className="border-slate-800">
                                                    <TableCell className="text-slate-300">{row.index + 1}</TableCell>
                                                    <TableCell className="text-slate-300">{row.date}</TableCell>
                                                    <TableCell className="text-slate-300">{row.value.toFixed(4)}</TableCell>
                                                    <TableCell>
                                                        {row.isFailure ? (
                                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Failure</Badge>
                                                        ) : row.value > row.upper2SD || row.value < row.lower2SD ? (
                                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Warning</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Pass</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}

// Main CRM Page Component
export default function CRMPage() {
    const { user, isLoaded } = useUser();
    const userId = user?.id || "guest";
    // Force complete state reset when user changes by using userId as key for the content
    // Also prevent rendering with "guest" data while loading
    if (!isLoaded) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

    return <CRMPageContent key={userId} userId={userId} user={user} />;
}

function CRMPageContent({ userId, user }: { userId: string, user: any }) {
    const { getDraft, setData, setColumnMapping, setDraft } = useAnalysisStore();
    const draft = getDraft(userId, "CRM");

    const [rawData, setRawData] = useState<Record<string, unknown>[]>(
        (draft?.data as Record<string, unknown>[]) ?? []
    );
    const [columns, setColumns] = useState<string[]>(draft?.columns ?? []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("setup");
    const [error, setError] = useState<string | null>(null);

    const [charts, setCharts] = useState<CRMChartData[]>(
        (draft?.results as unknown as CRMChartData[]) ?? []
    );
    const [chartOverrides, setChartOverrides] = useState<Record<string, ChartOverrideSettings>>(
        (draft?.overrides as Record<string, ChartOverrideSettings>) ?? {}
    );
    const [allSummaries, setAllSummaries] = useState<Record<string, unknown>[]>([]);

    const [mapping, setMapping] = useState({
        date: draft?.columnMapping?.date ?? "",
        grade: draft?.columnMapping?.grade ?? "",
        crm: draft?.columnMapping?.crm ?? "",
        element: draft?.columnMapping?.element ?? "",
        expected: draft?.columnMapping?.expected ?? "",
        sd: draft?.columnMapping?.sd ?? "",
    });

    const [selectedElements, setSelectedElements] = useState<string[]>(
        (draft?.filters?.selectedElements as string[]) ?? []
    );
    const [selectedCRMs, setSelectedCRMs] = useState<Record<string, string[]>>(
        (draft?.filters?.selectedCRMs as Record<string, string[]>) ?? {}
    );

    const [options, setOptions] = useState({
        useMean: (draft?.filters?.options as any)?.useMean ?? false,
        useExpectedSD: (draft?.filters?.options as any)?.useExpectedSD ?? false,
        multiplier2SD: (draft?.filters?.options as any)?.multiplier2SD ?? 2,
        multiplier3SD: (draft?.filters?.options as any)?.multiplier3SD ?? 3,
        showMovingMean: (draft?.filters?.options as any)?.showMovingMean ?? true,
        movingMeanWindow: (draft?.filters?.options as any)?.movingMeanWindow ?? 7,
    });

    const [colors] = useState({
        point: "#7FA37F",
        failure: "#FF0000",
        twoSD: "#B5ED38",
        threeSD: "#7FA37F",
        expected: "#000000",
        mean: "#92B2F5",
    });

    const [chartDefaults, setChartDefaults] = useState<GlobalChartSettings>({
        pointColor: (draft?.styleSettings?.chartDefaults as any)?.pointColor ?? "#10B981",
        failureColor: (draft?.styleSettings?.chartDefaults as any)?.failureColor ?? "#EF4444",
        decimals: (draft?.styleSettings?.chartDefaults as any)?.decimals ?? 2,
        rotation: (draft?.styleSettings?.chartDefaults as any)?.rotation ?? 0,
        showSummary: (draft?.styleSettings?.chartDefaults as any)?.showSummary ?? false,
        summarySize: (draft?.styleSettings?.chartDefaults as any)?.summarySize ?? 1,
        backgroundColor: (draft?.styleSettings?.chartDefaults as any)?.backgroundColor ?? "#0f172a",
        textColor: (draft?.styleSettings?.chartDefaults as any)?.textColor ?? "#e2e8f0"
    });

    // -----------------------------------------------------------------------------
    // Cloud Synchronization
    // -----------------------------------------------------------------------------
    const isFirstMount = useRef(true);

    // 1. Hydrate from Server on Mount
    useEffect(() => {
        if (userId === "guest") return;

        loadAnalysisDraft("CRM").then((res) => {
            if (res.success && res.draft) {
                console.log("Hydrating CRM from server:", res.draft);
                // If server has data, load it into store and local state
                setDraft(userId, "CRM", res.draft);

                // Update local state
                if (res.draft.data) setRawData(res.draft.data as any);
                if (res.draft.columns) setColumns(res.draft.columns);
                if (res.draft.results) setCharts(res.draft.results as any);
                if (res.draft.overrides) setChartOverrides(res.draft.overrides as any);

                const style = res.draft.styleSettings as any;
                if (style?.chartDefaults) setChartDefaults(style.chartDefaults);

                if (res.draft.columnMapping) {
                    setMapping({
                        date: res.draft.columnMapping.date || "",
                        grade: res.draft.columnMapping.grade || "",
                        crm: res.draft.columnMapping.crm || "",
                        element: res.draft.columnMapping.element || "",
                        expected: res.draft.columnMapping.expected || "",
                        sd: res.draft.columnMapping.sd || "",
                    });
                }
                const opts = res.draft.filters?.options as any;
                if (opts) {
                    setOptions(prev => ({ ...prev, ...opts }));
                }
                if (res.draft.filters?.selectedElements) setSelectedElements(res.draft.filters.selectedElements as any);
                if (res.draft.filters?.selectedCRMs) setSelectedCRMs(res.draft.filters.selectedCRMs as any);
            }
        });
    }, [userId]);

    // 2. Debounced Save to Server on Change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (!userId || userId === "guest") return;

            const currentDraft = {
                data: rawData,
                columns,
                columnMapping: mapping,
                filters: {
                    selectedElements,
                    selectedCRMs,
                    options
                },
                styleSettings: {
                    colors,
                    chartDefaults
                },
                results: charts,
                overrides: chartOverrides,
                lastModified: Date.now()
            };

            console.log("Auto-saving CRM to server...");
            saveAnalysisDraft("CRM", currentDraft).catch(err => console.error("Auto-save failed", err));
        }, 2000);

        return () => clearTimeout(timer);
    }, [rawData, columns, mapping, selectedElements, selectedCRMs, options, colors, chartDefaults, charts, chartOverrides, userId]);

    // Save state to store on change
    useEffect(() => {
        setDraft(userId, "CRM", {
            filters: {
                selectedElements,
                selectedCRMs,
                options
            },
            styleSettings: {
                chartDefaults
            },
            results: charts,
            overrides: chartOverrides
        });
    }, [userId, selectedElements, selectedCRMs, options, chartDefaults, charts, chartOverrides, setDraft]);

    const handleOverrideChange = (key: string, newSettings: Partial<ChartOverrideSettings>) => {
        setChartOverrides(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                ...newSettings
            }
        }));
    };

    const uniqueElements = useMemo(() => {
        if (!rawData.length || !mapping.element) return [];
        const elements = new Set<string>();
        rawData.forEach(row => {
            const val = row[mapping.element];
            if (val !== null && val !== undefined && val !== "") {
                elements.add(String(val));
            }
        });
        return Array.from(elements).sort();
    }, [rawData, mapping.element]);

    const getCRMsForElement = useCallback((element: string) => {
        if (!rawData.length || !mapping.crm || !mapping.element) return [];
        const crms = new Set<string>();
        rawData.forEach(row => {
            if (String(row[mapping.element]) === element) {
                const val = row[mapping.crm];
                if (val !== null && val !== undefined && val !== "") {
                    crms.add(String(val));
                }
            }
        });
        return Array.from(crms).sort();
    }, [rawData, mapping.crm, mapping.element]);

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
                    setRawData(parsedData);
                    setColumns(cols);
                    setData(userId, "CRM", parsedData);
                    setSelectedElements([]);
                    setSelectedCRMs({});
                    setCharts([]);
                },
                error: (error) => {
                    setError(`Failed to parse CSV: ${error.message}`);
                },
            });
        },
        [setData]
    );

    const handleMappingChange = (key: string, value: string) => {
        setMapping({ ...mapping, [key]: value });
        setColumnMapping(userId, "CRM", { ...mapping, [key]: value });
    };

    const selectAll = () => {
        setSelectedElements(uniqueElements);
        const allCRMs: Record<string, string[]> = {};
        uniqueElements.forEach(el => {
            allCRMs[el] = getCRMsForElement(el);
        });
        setSelectedCRMs(allCRMs);
    };

    const selectNone = () => {
        // Only clear CRMs, keep elements selected
        const newCRMs: Record<string, string[]> = {};
        selectedElements.forEach(el => {
            newCRMs[el] = [];
        });
        setSelectedCRMs(newCRMs);
    };

    const toggleElement = (element: string) => {
        setSelectedElements(prev => {
            if (prev.includes(element)) {
                return prev.filter(e => e !== element);
            } else {
                const crms = getCRMsForElement(element);
                setSelectedCRMs(prevCRMs => ({ ...prevCRMs, [element]: crms }));
                return [...prev, element];
            }
        });
    };

    const toggleCRM = (element: string, crm: string) => {
        setSelectedCRMs(prev => {
            const current = prev[element] || [];
            if (current.includes(crm)) {
                return { ...prev, [element]: current.filter(c => c !== crm) };
            } else {
                return { ...prev, [element]: [...current, crm] };
            }
        });
    };

    const calculateMovingMean = (values: number[], window: number): (number | undefined)[] => {
        const result: (number | undefined)[] = [];
        for (let i = 0; i < values.length; i++) {
            if (i < window - 1) {
                result.push(undefined);
            } else {
                const slice = values.slice(i - window + 1, i + 1);
                result.push(slice.reduce((a, b) => a + b, 0) / window);
            }
        }
        return result;
    };

    const runAnalysis = useCallback(() => {
        if (!rawData.length) {
            setError("No data loaded.");
            return;
        }
        if (!selectedElements.length) {
            setError("Please select at least one element.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const generatedCharts: CRMChartData[] = [];
            const summaries: Record<string, unknown>[] = [];

            for (const element of selectedElements) {
                const elementCRMs = selectedCRMs[element] || getCRMsForElement(element);
                const elementData = rawData.filter(row => String(row[mapping.element]) === element);

                for (const crm of elementCRMs) {
                    const crmData = elementData.filter(row => String(row[mapping.crm]) === crm);
                    if (crmData.length === 0) continue;

                    const gradeValues: number[] = [];
                    const expectedValues: number[] = [];
                    const sdValues: number[] = [];
                    const dateValues: string[] = [];

                    crmData.forEach(row => {
                        const grade = parseFloat(String(row[mapping.grade] ?? ""));
                        const expected = mapping.expected ? parseFloat(String(row[mapping.expected] ?? "")) : 0;
                        const sd = mapping.sd ? parseFloat(String(row[mapping.sd] ?? "")) : 0;
                        const date = String(row[mapping.date] ?? "");

                        if (!isNaN(grade)) {
                            gradeValues.push(grade);
                            expectedValues.push(isNaN(expected) ? 0 : expected);
                            sdValues.push(isNaN(sd) ? 0 : sd);
                            dateValues.push(normalizeDate(date));
                        }
                    });

                    if (gradeValues.length === 0) continue;

                    const avgExpected = expectedValues.filter(v => v > 0).length > 0
                        ? expectedValues.filter(v => v > 0).reduce((a, b) => a + b, 0) / expectedValues.filter(v => v > 0).length
                        : gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length;

                    const avgSD = sdValues.filter(v => v > 0).length > 0
                        ? sdValues.filter(v => v > 0).reduce((a, b) => a + b, 0) / sdValues.filter(v => v > 0).length
                        : undefined;

                    const summary = calculateCrmSummary(gradeValues, avgExpected, {
                        useMean: options.useMean,
                        useExpectedSD: options.useExpectedSD,
                        expectedSD: avgSD,
                        multiplier2SD: options.multiplier2SD,
                        multiplier3SD: options.multiplier3SD,
                    });

                    const movingMeans = options.showMovingMean
                        ? calculateMovingMean(gradeValues, options.movingMeanWindow)
                        : [];

                    const chartPoints: ChartDataPoint[] = gradeValues.map((value, idx) => ({
                        index: idx,
                        sequence: idx,
                        value,
                        date: dateValues[idx],
                        expected: avgExpected,
                        upper2SD: summary.bounds.upper2SD,
                        lower2SD: summary.bounds.lower2SD,
                        upper3SD: summary.bounds.upper3SD,
                        lower3SD: summary.bounds.lower3SD,
                        isFailure: value > summary.bounds.upper3SD || value < summary.bounds.lower3SD,
                        movingMean: movingMeans[idx],
                    }));

                    generatedCharts.push({
                        element,
                        crm,
                        data: chartPoints,
                        summary,
                        bounds: summary.bounds,
                        expectedValue: avgExpected,
                        meanValue: summary.mean,
                        minValue: Math.min(...gradeValues),
                        maxValue: Math.max(...gradeValues),
                    });

                    summaries.push({
                        Element: element,
                        CRM: crm,
                        Samples: summary.numSamples,
                        Mean: summary.mean.toFixed(4),
                        Expected: summary.expectedValue.toFixed(4),
                        "Std Dev": summary.standardDeviation.toFixed(4),
                        "Bias (%)": summary.bias.toFixed(2),
                        Failures: summary.numOutliers,
                        "Failure Rate (%)": summary.failureRate.toFixed(1),
                    });
                }
            }

            setCharts(generatedCharts);
            setAllSummaries(summaries);

            if (generatedCharts.length === 0) {
                setError("No valid data found.");
            } else {
                setActiveTab("charts");
            }
        } catch (err) {
            setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsProcessing(false);
        }
    }, [rawData, mapping, selectedElements, selectedCRMs, options, getCRMsForElement]);
                )
}
            </div >

    { error && (
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
        <TabsTrigger value="charts" className="data-[state=active]:bg-slate-800">
            <BarChart3 className="w-4 h-4 mr-2" />Charts
            {charts.length > 0 && <Badge className="ml-2 bg-emerald-500/20 text-emerald-400">{charts.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="summary" className="data-[state=active]:bg-slate-800">Summary</TabsTrigger>
    </TabsList>

    {/* SETUP TAB */}
    <TabsContent value="setup" className="space-y-6">
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-white">Upload Data</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Input type="file" accept=".csv" onChange={handleFileUpload} className="bg-slate-800 border-slate-700 text-white file:bg-emerald-500 file:text-white file:border-0" />
                    {rawData.length > 0 && <Badge className="bg-emerald-500/20 text-emerald-400">{rawData.length} rows</Badge>}
                </div>
            </CardContent>
        </Card>

        {columns.length > 0 && (
            <>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader><CardTitle className="text-white">Column Mapping</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {["date", "grade", "crm", "element", "expected", "sd"].map((key) => (
                                <div key={key} className="space-y-2">
                                    <Label className="text-slate-300 capitalize">{key} Column {["grade", "crm", "element"].includes(key) && "*"}</Label>
                                    <Select value={mapping[key as keyof typeof mapping]} onValueChange={(v) => handleMappingChange(key, v)}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            {columns.map((col) => <SelectItem key={col} value={col} className="text-white">{col}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {uniqueElements.length > 0 && (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Select Elements</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={selectAll} className="border-slate-700 text-slate-300 hover:text-white">
                                    Select All
                                </Button>
                                <Button variant="outline" size="sm" onClick={selectNone} className="border-slate-700 text-slate-300 hover:text-white">
                                    Clear All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {uniqueElements.map((element) => (
                                    <Button key={element} variant={selectedElements.includes(element) ? "default" : "outline"} size="sm" onClick={() => toggleElement(element)}
                                        className={selectedElements.includes(element) ? "bg-emerald-500 hover:bg-emerald-600" : "border-slate-700 text-slate-300"}>
                                        {element}
                                    </Button>
                                ))}
                            </div>
                            {selectedElements.map((element) => (
                                <div key={element} className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                                    <h4 className="text-white font-medium mb-2">{element} - Select CRMs</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getCRMsForElement(element).map((crm) => (
                                            <Button key={crm} variant={(selectedCRMs[element] || []).includes(crm) ? "default" : "outline"} size="sm" onClick={() => toggleCRM(element, crm)}
                                                className={(selectedCRMs[element] || []).includes(crm) ? "bg-blue-500 hover:bg-blue-600" : "border-slate-600 text-slate-400"}>
                                                {crm}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2"><Settings2 className="w-5 h-5" />Analysis Options</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-white">Use Mean as Center</Label>
                                <Switch checked={options.useMean} onCheckedChange={(c) => setOptions({ ...options, useMean: c })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-white">Use Certificate SD</Label>
                                <Switch checked={options.useExpectedSD} onCheckedChange={(c) => setOptions({ ...options, useExpectedSD: c })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-white">Show Moving Mean</Label>
                                <Switch checked={options.showMovingMean} onCheckedChange={(c) => setOptions({ ...options, showMovingMean: c })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">1st SD Threshold</Label>
                                <Input type="number" value={options.multiplier2SD} onChange={(e) => setOptions({ ...options, multiplier2SD: parseFloat(e.target.value) || 2 })} className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">2nd SD Threshold</Label>
                                <Input type="number" value={options.multiplier3SD} onChange={(e) => setOptions({ ...options, multiplier3SD: parseFloat(e.target.value) || 3 })} className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={runAnalysis} disabled={isProcessing || !mapping.grade || !mapping.crm || !mapping.element || selectedElements.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50">
                    <Play className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : selectedElements.length > 0 ? `Run Analysis (${selectedElements.length} element${selectedElements.length !== 1 ? "s" : ""})` : "Run Analysis"}
                </Button>
                {selectedElements.length === 0 && mapping.element && (
                    <p className="text-yellow-400 text-sm">Please select at least one element above to run analysis</p>
                )}
                {!mapping.element && (
                    <p className="text-yellow-400 text-sm">Please map the Element column to see available elements</p>
                )}
            </>
        )}
    </TabsContent>

    {/* CHARTS TAB */}
    <TabsContent value="charts" className="space-y-8">
        {/* Global Settings */}
        {charts.length > 0 && (
            <GlobalChartSettingsPanel
                defaults={chartDefaults}
                onApply={setChartDefaults}
            />
        )}

        {charts.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">No charts yet. Select elements and run the analysis.</p>
                </CardContent>
            </Card>
        ) : (
            charts.map((chart, idx) => {
                const uniqueKey = `${chart.crm}-${chart.element}`;
                return (
                    <ChartWithControls
                        key={uniqueKey}
                        chart={chart}
                        idx={idx}
                        globalColors={colors}
                        defaults={chartDefaults}
                        showMovingMean={options.showMovingMean}
                        overrides={chartOverrides[uniqueKey]}
                        onOverrideChange={(settings) => handleOverrideChange(uniqueKey, settings)}
                    />
                );
            })
        )}
    </TabsContent>

    {/* SUMMARY TAB */}
    <TabsContent value="summary" className="space-y-6">
        {allSummaries.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                    <p className="text-slate-400">No summary data yet.</p>
                </CardContent>
            </Card>
        ) : (
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader><CardTitle className="text-white">Combined Summary Table</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800">
                                    {Object.keys(allSummaries[0] || {}).map((key) => (
                                        <TableHead key={key} className="text-slate-400">{key}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allSummaries.map((row, idx) => (
                                    <TableRow key={idx} className="border-slate-800">
                                        {Object.values(row).map((value, i) => (
                                            <TableCell key={i} className="text-slate-300">{String(value)}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
                        <Download className="w-4 h-4 mr-2" />Download CSV
                    </Button>
                </CardContent>
            </Card>
        )}
    </TabsContent>
</Tabs>
        </div >
    );
}
