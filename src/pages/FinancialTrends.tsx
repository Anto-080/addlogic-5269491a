import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

/** Public Yahoo Finance proxy — same edge function used by the Investment Phase. */
function fnBase() {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-finance`;
}
function fnHeaders() {
  return { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
}

import { DeltaNeutralPanel, CompaniesPanel } from "@/components/InvestmentPanels";

export default function FinancialTrends() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" /> Financial Basics
          </h1>
          <p className="text-sm text-muted-foreground">
            Live market data — realized volatility, delta-neutral yield estimates and public company fundamentals.
          </p>
        </div>

        {/* ===== Delta-Neutral Plans (Collective Investment Pools) ===== */}
        <DeltaNeutralPanel onBack={() => {}} />

        <div className="h-4" />

        {/* ===== Sector-Based Investing ===== */}
        <CompaniesPanel onBack={() => {}} />
      </div>
    </AppLayout>
  );
}
