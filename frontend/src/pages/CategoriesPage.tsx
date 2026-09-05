import React from 'react';
import { Tags, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Category Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            System defaults and custom user spending categories with icon &amp; color customization
          </p>
        </div>
        <Badge variant="neutral" className="self-start sm:self-auto">
          Phase 8 — Scheduled
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Category Management (Foundation Placeholder)</CardTitle>
              <CardDescription>
                Phase 1 foundation is active. Category CRUD and system lock validations will be implemented in Phase 8.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">
              Category Directory Awaiting Phase 8 Implementation
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              This screen will interact with <code className="text-slate-300">GET /api/v1/categories</code> and allow custom category
              creation while respecting protected system defaults.
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
