import React from 'react';
import { LayoutDashboard, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Financial Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monthly overview, budget summaries, recent transactions, and pending receipts
          </p>
        </div>
        <Badge variant="neutral" className="self-start sm:self-auto">
          Phase 3 — Scheduled
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Dashboard Overview (Foundation Placeholder)</CardTitle>
              <CardDescription>
                Phase 1 foundation is active. Full dashboard integration will be implemented in Phase 3.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">
              Dashboard Metrics Awaiting Phase 3 Implementation
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              This screen will aggregate your current month's budget summary, recent transactions,
              and pending receipt confirmations using verified backend endpoints.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span>Foundation Verified</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
