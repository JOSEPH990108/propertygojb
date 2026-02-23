// src\components\custom\feature\tools\LoanAmortizationTable.tsx
"use client";

import { useState, useMemo } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Maximize2, 
  Minimize2, 
  Table2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAmortizationSchedule } from "@/hooks/useAmortizationSchedule";
import { formatCurrency } from "@/lib/utils";

// Helper for CSV Download
const saveAs = typeof window !== "undefined" ? require("file-saver").saveAs : () => {};

export default function LoanAmortizationTable() {
  const schedule = useAmortizationSchedule();
  // Default expanded: Year 1
  const [expandedYears, setExpandedYears] = useState<number[]>([1]); 

  // 1. Group Data by Year
  const groupedData = useMemo(() => {
    return schedule.reduce<Record<number, typeof schedule>>((acc, row) => {
      acc[row.year] = acc[row.year] || [];
      acc[row.year].push(row);
      return acc;
    }, {});
  }, [schedule]);

  const years = Object.keys(groupedData).map(Number);

  // 2. Handlers
  const toggleYear = (year: number) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleAll = () => {
    if (expandedYears.length === years.length) {
      setExpandedYears([]);
    } else {
      setExpandedYears(years);
    }
  };

  const exportCSV = () => {
    const header = "Year,Month,Principal,Interest,Total Payment,Balance\n";
    const body = schedule
      .map((r) => `${r.year},${r.month},${r.principal},${r.interest},${r.total},${r.balance}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "amortization_schedule.csv");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg flex flex-col h-[600px]">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="p-5 border-b border-border bg-card/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent/10 rounded-lg border border-accent/20">
            <Table2 className="w-5 h-5 text-accent" />
          </div>
          <span className="font-serif text-lg font-bold text-foreground">Amortization Overview</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-xs font-medium text-muted-foreground rounded-lg transition-colors border border-border"
          >
            {expandedYears.length === years.length ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Expand All
              </>
            )}
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-xs font-bold text-primary-foreground rounded-lg transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT AREA --- */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar overscroll-contain"
        data-lenis-prevent
      >
        {years.map((year) => {
          const months = groupedData[year];
          const yearPrincipal = months.reduce((sum, r) => sum + r.principal, 0);
          const yearInterest = months.reduce((sum, r) => sum + r.interest, 0);
          const isOpen = expandedYears.includes(year);

          return (
            <div
              key={year}
              className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-300 hover:border-accent/40"
            >
              {/* Year Summary Row (Accordion Trigger) */}
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🗓️</span>
                    <span className="font-bold text-foreground font-serif">Year {year}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>Principal: <span className="text-foreground font-mono">{formatCurrency(yearPrincipal)}</span></span>
                    <span className="w-px h-3 bg-border"></span>
                    <span>Interest: <span className="text-accent font-mono">{formatCurrency(yearInterest)}</span></span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-accent" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>

              {/* Monthly Table (Collapsible Content) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm text-left border-t border-border">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-4 py-3 w-16 text-center">Mth</th>
                            <th className="px-4 py-3">Principal</th>
                            <th className="px-4 py-3">Interest</th>
                            <th className="px-4 py-3 hidden md:table-cell w-1/3 text-center">Split</th>
                            <th className="px-4 py-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {months.map((row) => {
                            const total = row.principal + row.interest;
                            const pPct = (row.principal / total) * 100;
                            const iPct = 100 - pPct;
                            
                            return (
                              <tr key={row.month} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 text-center font-mono text-muted-foreground">{row.month}</td>
                                <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(row.principal)}</td>
                                <td className="px-4 py-3 font-mono text-destructive">{formatCurrency(row.interest)}</td>
                                
                                {/* Visual Payment Bar */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-muted">
                                    <div 
                                      className="bg-blue-500 h-full" 
                                      style={{ width: `${pPct}%` }} 
                                      title={`Principal: ${pPct.toFixed(1)}%`}
                                    />
                                    <div 
                                      className="bg-destructive h-full" 
                                      style={{ width: `${iPct}%` }} 
                                      title={`Interest: ${iPct.toFixed(1)}%`}
                                    />
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                  {formatCurrency(row.balance)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}