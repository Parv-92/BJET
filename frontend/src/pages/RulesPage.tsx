import React from 'react';
import { Sliders, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const RulesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Merchant Rules</h2>
          <p className="text-xs text-slate-400 mt-1">
            Priority-based substring pattern rules to customize automatic transaction categorization
          </p>
        </div>
        <Badge variant="neutral" className="self-start sm:self-auto">
          Phase 9 — Scheduled
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Merchant Rules Engine (Foundation Placeholder)</CardTitle>
              <CardDescription>
                Phase 1 foundation is active. Rule list, creation, and priority sorting will be implemented in Phase 9.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">
              Merchant Rules Awaiting Phase 9 Implementation
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              This screen will interact with <code className="text-slate-300">GET /api/v1/rules</code> and{' '}
              <code className="text-slate-300">POST /api/v1/rules</code>, displaying rules ordered by priority.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-purple-400">
              <span>Foundation Verified</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
