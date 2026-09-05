import React from 'react';
import { ScanLine, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const ScanReceiptPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Receipt Scanner</h2>
          <p className="text-xs text-slate-400 mt-1">
            Drag-and-drop receipt screenshots with automated OCR, duplicate detection, and review
          </p>
        </div>
        <Badge variant="warning" className="self-start sm:self-auto">
          Phase 5 &amp; 6 — Scheduled
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>OCR Ingestion Workflow (Foundation Placeholder)</CardTitle>
              <CardDescription>
                Phase 1 foundation is active. Receipt scanning and confirmation interfaces will be implemented in Phases 5 &amp; 6.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">
              Receipt OCR Scanner Awaiting Phase 5 Implementation
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              This workflow will integrate <code className="text-slate-300">POST /api/v1/transactions/scan-receipt</code>,
              generating <span className="text-amber-400 font-medium">PENDING_CONFIRMATION</span> drafts for user confirmation.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-amber-400">
              <span>Foundation Verified</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
