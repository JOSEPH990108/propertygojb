// src\components\custom\feature\tools\MortgageCalculator.tsx
"use client";

import {
    Calculator,
    DollarSign,
    Settings2,
    RotateCcw,
    Calendar,
} from "lucide-react";
import { Slider } from "@/components/ui/slider"; 
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

// --- Internal Imports (Ensure these match your file structure) ---
import { useLoanCalculatorStore } from "@/stores/loan-calculator-store";
import { useLoanCalculation } from "@/hooks/useLoanCalculation";
import { formatCurrency } from "@/lib/utils";
import LoanAmortizationTable from "./LoanAmortizationTable"; 

// --- SVG Math for Pie Chart (From LoanStatistic.tsx) ---
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function ProMortgageCalculator() {
  const store = useLoanCalculatorStore();
  const results = useLoanCalculation();
  const sinkingFee = store.sqft * store.sinkRate;

  // --- Chart Logic ---
  // Calculate Interest % for the Pie Chart
  const principalPct = (results.loanAmount / results.totalPayment) * 100;
  const interestPct = 100 - principalPct;
  const interestAngle = (interestPct / 100) * 360;

  const handleReset = () => {
    store.setSpaPrice(500000);
    store.setDownPaymentRate(10);
    store.setInterestRate(4.5);
    store.setTenureYears(30);
    store.setRebate(0);
    store.setSqft(1000);
    store.setSinkRate(0.35);
    store.setDeveloperDiscounts({
       spaLegalFee: false, spaStampDuty: false, loanLegalFee: false, loanStampDuty: false, rebate: false
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 font-sans text-zinc-900 dark:text-zinc-100 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pro Mortgage Calculator</h1>
                <p className="text-sm text-zinc-500">Integrated Analysis & Amortization</p>
            </div>
        </div>
        <button 
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        >
            <RotateCcw className="w-3 h-3" /> Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="xl:col-span-4 space-y-6">
            
            {/* 1. Core Inputs */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Loan Parameters
                </h3>
                
                {/* Price */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Property Price</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">RM</span>
                        <input 
                            type="number" 
                            value={store.spaPrice} 
                            onChange={(e) => store.setSpaPrice(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <Slider 
                        min={100000} max={3000000} step={10000} 
                        value={[store.spaPrice]} 
                        onValueChange={([v]) => store.setSpaPrice(v)}
                        className="py-2"
                    />
                </div>

                {/* Downpayment */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Down Payment</label>
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                            {formatCurrency(results.downPaymentAmount)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Slider 
                            min={0} max={40} step={1} 
                            value={[store.downPaymentRate]} 
                            onValueChange={([v]) => store.setDownPaymentRate(v)}
                            className="flex-1"
                        />
                        <div className="relative w-20">
                            <input 
                                type="number" 
                                value={store.downPaymentRate} 
                                onChange={(e) => store.setDownPaymentRate(Number(e.target.value))}
                                className="w-full pl-2 pr-6 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg text-center font-bold text-sm"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">%</span>
                        </div>
                    </div>
                </div>

                {/* Rate & Tenure */}
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Interest Rate" suffix="%" value={store.interestRate} onChange={store.setInterestRate} step={0.05} />
                    <InputGroup label="Tenure" suffix="Yrs" value={store.tenureYears} onChange={store.setTenureYears} max={35} />
                </div>
            </div>

            {/* 2. Advanced Details (Sinking Fund & Rebates) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Advanced Costs
                </h3>

                {/* Sinking Fund Inputs */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                         <label className="text-xs font-bold text-zinc-400 uppercase">Sinking Fund / Maintenance</label>
                         <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatCurrency(sinkingFee)}/mo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500">Size (sqft)</label>
                            <input type="number" value={store.sqft} onChange={(e) => store.setSqft(Number(e.target.value))} className="w-full px-2 py-1 text-sm rounded border bg-white dark:bg-zinc-800" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500">Rate (RM)</label>
                            <input type="number" step={0.01} value={store.sinkRate} onChange={(e) => store.setSinkRate(Number(e.target.value))} className="w-full px-2 py-1 text-sm rounded border bg-white dark:bg-zinc-800" />
                         </div>
                    </div>
                </div>

                {/* Developer Packages */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Developer Package</label>
                    <ToggleRow label="Free SPA Legal" checked={store.developerDiscounts.spaLegalFee} onChange={(v) => store.setDeveloperDiscounts({ spaLegalFee: v })} />
                    <ToggleRow label="Free MOT (Stamp)" checked={store.developerDiscounts.spaStampDuty} onChange={(v) => store.setDeveloperDiscounts({ spaStampDuty: v })} />
                    <ToggleRow label="Free Loan Legal" checked={store.developerDiscounts.loanLegalFee} onChange={(v) => store.setDeveloperDiscounts({ loanLegalFee: v })} />
                    <ToggleRow label="Free Loan Stamp" checked={store.developerDiscounts.loanStampDuty} onChange={(v) => store.setDeveloperDiscounts({ loanStampDuty: v })} />
                    
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                        <ToggleRow 
                            label="Cash Rebate" 
                            checked={store.developerDiscounts.rebate} 
                            onChange={(v) => {
                                store.setDeveloperDiscounts({ rebate: v });
                                if(!v) store.setRebate(0);
                            }} 
                        />
                        {store.developerDiscounts.rebate && (
                            <motion.input 
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                type="number" 
                                value={store.rebateAmount} 
                                onChange={(e) => store.setRebate(Number(e.target.value))}
                                className="w-full mt-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg text-green-700 dark:text-green-400 font-bold focus:outline-none placeholder-green-700/50"
                                placeholder="Enter Rebate RM"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: ANALYTICS & RESULTS --- */}
        <div className="xl:col-span-8 space-y-6">
           
           {/* 1. Dashboard Row: Repayment + Pie Chart */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card A: Monthly Payment & Dates */}
              <div className="bg-gradient-to-br from-indigo-900 to-zinc-900 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                   {/* Background Decor */}
                   <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                   
                   <div>
                       <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Estimated Monthly</p>
                       <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white">
                           {formatCurrency(results.monthlyInstallment)}
                       </h2>
                   </div>

                   <div className="mt-8 space-y-3">
                       <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                           <span className="text-indigo-200 flex items-center gap-2"><Calendar className="w-4 h-4"/> Last Payment</span>
                           <span className="font-mono font-bold">{results.lastPaymentDate ? results.lastPaymentDate.toLocaleDateString() : '-'}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                           <span className="text-indigo-200 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Total Interest</span>
                           <span className="font-mono font-bold">{formatCurrency(results.totalInterest)}</span>
                       </div>
                   </div>
              </div>

              {/* Card B: Visual Breakdown (Pie Chart from LoanStatistic) */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center relative">
                  <h4 className="absolute top-6 left-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment Split</h4>
                  
                  {/* The SVG Pie Chart */}
                  <div className="relative w-40 h-40 mt-4">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      {/* Interest Slice (Red/Rose) */}
                      <path
                        d={describeArc(18, 18, 15.9155, 0, interestAngle)}
                        fill="none" stroke="#e11d48" strokeWidth="3"
                      />
                      {/* Principal Slice (Blue/Indigo) */}
                      <path
                        d={describeArc(18, 18, 15.9155, interestAngle, 360)}
                        fill="none" stroke="#4f46e5" strokeWidth="3"
                      />
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-zinc-400 uppercase">Total</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{(results.totalPayment/1000).toFixed(0)}k</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span className="text-zinc-600 dark:text-zinc-400">Principal ({principalPct.toFixed(0)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                          <span className="text-zinc-600 dark:text-zinc-400">Interest ({interestPct.toFixed(0)}%)</span>
                      </div>
                  </div>
              </div>
           </div>

           {/* 2. Cash Required Breakdown (Collapsible or Full) */}
           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
               <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                   <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                       <DollarSign className="w-5 h-5 text-green-600" /> Upfront Cash Required
                   </h3>
                   <span className="text-xl font-bold text-zinc-900 dark:text-white">{formatCurrency(results.cashRequired)}</span>
               </div>
               <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                   {/* Left Col Costs */}
                   <div className="space-y-3">
                       <CostRow label="Down Payment" value={results.downPaymentAmount} highlight />
                       <CostRow label="SPA Legal Fee" value={results.spaLegalFee} />
                       <CostRow label="Loan Legal Fee" value={results.loanLegalFee} />
                   </div>
                   {/* Right Col Costs */}
                   <div className="space-y-3">
                       <CostRow label="SPA Stamp Duty (MOT)" value={results.spaStampDuty} />
                       <CostRow label="Loan Stamp Duty" value={results.loanStampDuty} />
                       <CostRow label="Est. Disbursements" value={results.estDisbursement} note="(Misc)" />
                   </div>
                   
                   {/* Rebate Row */}
                   {store.rebateAmount > 0 && (
                       <div className="md:col-span-2 mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-green-600 dark:text-green-400 font-bold">
                           <span>Less: Developer Rebate</span>
                           <span>- {formatCurrency(store.rebateAmount)}</span>
                       </div>
                   )}
               </div>
           </div>

           {/* 3. Amortization Table (Imported Component) */}
           {/* This component handles its own CSV export and collapsible rows */}
           <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-1">
                <LoanAmortizationTable />
           </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

const InputGroup = ({ label, suffix, value, onChange, step=1, max }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
        <div className="relative">
            <input 
                type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step={step} max={max}
                className="w-full pl-3 pr-8 py-2.5 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">{suffix}</span>
        </div>
    </div>
);

const ToggleRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-1.5">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} className="scale-75 data-[state=checked]:bg-indigo-600" />
    </div>
);

const CostRow = ({ label, value, highlight, note }: { label: string, value: number, highlight?: boolean, note?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1">
            <span className={`${highlight ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{label}</span>
            {note && <span className="text-[10px] text-zinc-400">{note}</span>}
        </div>
        <span className={`font-mono ${highlight ? 'font-bold text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
            {value === 0 ? <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded uppercase">Waived</span> : formatCurrency(value)}
        </span>
    </div>
);