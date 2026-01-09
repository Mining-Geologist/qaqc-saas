"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Wrench } from "lucide-react";

export default function CheckAssayPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Check Assay</h1>
                    <p className="text-slate-400">
                        Q-Q plots comparing primary and secondary lab results
                    </p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    <Wrench className="w-3 h-3 mr-1" />
                    Coming Soon
                </Badge>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                    <FileCheck className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        Check Assay Tool
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        This tool will generate Q-Q plots and scatter comparisons between
                        primary and secondary lab results with comprehensive statistics.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
