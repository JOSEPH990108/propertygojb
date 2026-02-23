// src\components\custom\feature\tools\CashRequired.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react"; // If using icons, make sure lucide-react is in your deps!
import { formatCurrency } from "@/lib/utils";
import { useLoanCalculation } from "@/hooks/useLoanCalculation";

/**
 * CashRequired (LoanSummary)
 * --------------------------
 * Shows the up-front cash breakdown when buying a property.
 * Collapsible panel. Data comes from the loan calculator hook.
 */
export default function CashRequired() {
  // Grab loan/cash breakdown data from your Zustand hook
  const {
    downPaymentAmount,
    spaLegalFee,
    loanLegalFee,
    spaStampDuty,
    loanStampDuty,
    cashRequired,
  } = useLoanCalculation();

  // Show/hide the breakdown
  const [expandCash, setExpandCash] = useState(false);

  // Breakdown config (easy to extend)
  const cashBreakdown = [
    { label: "Down Payment", value: downPaymentAmount, icon: "💸" },
    { label: "SPA Legal Fee", value: spaLegalFee, icon: "📄" },
    { label: "SPA Stamp Duty", value: spaStampDuty, icon: "🧾" },
    { label: "Loan Legal Fee", value: loanLegalFee, icon: "📁" },
    { label: "Loan Stamp Duty", value: loanStampDuty, icon: "🏛️" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow text-sm text-zinc-800 dark:text-zinc-200 flex flex-col h-full">
      {/* Panel header */}
      <div
        onClick={() => setExpandCash((x) => !x)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💵</span>
          <h2 className="text-lg sm:text-xl font-bold text-primary">
            Cash Required on Purchase
          </h2>
        </div>
        {expandCash ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </div>

      {/* Collapsible breakdown */}
      {expandCash && (
        <div className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          {cashBreakdown.map(({ label, value, icon }) => (
            <div key={label} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}:</span>
              </div>
              <span className="font-semibold">{formatCurrency(value)}</span>
            </div>
          ))}
          <hr className="my-2 border-zinc-300 dark:border-zinc-700" />
          <div className="flex justify-between items-center font-bold text-base">
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>Total Cash Required:</span>
            </div>
            <span className="text-primary">{formatCurrency(cashRequired)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
