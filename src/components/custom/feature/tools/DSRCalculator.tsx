// src\components\custom\feature\tools\DSRCalculator.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  ArrowRightLeft,
  Settings2,
  RefreshCw,
  TrendingUp,
  
} from 'lucide-react';

// --- Types ---
type CalculatorMode = 'MY' | 'SG';

type DSRState = {
  basicSalary: number;
  fixedAllowance: number;
  variableIncome: number;
  variableRecognition: number;
  fixedLoans: number;
  ccBalance: number;
  newLoanInstallment: number;
};

// --- API CONFIGURATION ---
// Replace this URL with your specific API if needed.
// This is a free, public endpoint that returns live SGD rates.
const API_URL = 'https://open.er-api.com/v6/latest/SGD';

// --- Helper: Format Currency ---
const formatCurrency = (val: number, currency: string) =>
  new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(val);

export default function DsrCalculatorLive() {
  const [mode, setMode] = useState<CalculatorMode>('MY');
  const [activeTab, setActiveTab] = useState<'income' | 'debt'>('income');
  
  // State for Dynamic Exchange Rate
  const [exchangeRate, setExchangeRate] = useState<number>(3.55); // Fallback
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [values, setValues] = useState<DSRState>({
    basicSalary: 5000,
    fixedAllowance: 0,
    variableIncome: 2000,
    variableRecognition: 80,
    fixedLoans: 1500,
    ccBalance: 3000,
    newLoanInstallment: 2500,
  });

  // --- 1. Fetch Live Rate ---
  const fetchLiveRate = async () => {
    setIsLoadingRate(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      
      // Assuming structure: { rates: { MYR: 3.55, ... } }
      if (data && data.rates && data.rates.MYR) {
        setExchangeRate(data.rates.MYR);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Failed to fetch rate, using fallback.", error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchLiveRate();
  }, []);

  // --- 2. Calculations ---
  const results = useMemo(() => {
    const isSG = mode === 'SG';
    const rate = isSG ? exchangeRate : 1;

    // Income
    const recognizedVariable = values.variableIncome * (values.variableRecognition / 100);
    const totalIncomeNative = values.basicSalary + values.fixedAllowance + recognizedVariable;
    const totalIncomeMYR = totalIncomeNative * rate;

    // Debt
    const ccCommitmentNative = values.ccBalance * 0.05;
    const totalExistingDebtsNative = values.fixedLoans + ccCommitmentNative;
    const totalExistingDebtsMYR = totalExistingDebtsNative * rate;

    // Total (New Loan is always MYR)
    const totalCommitmentsMYR = totalExistingDebtsMYR + values.newLoanInstallment;

    // DSR
    let dsr = 0;
    if (totalIncomeMYR > 0) {
      dsr = (totalCommitmentsMYR / totalIncomeMYR) * 100;
    }

    // Max Loan (Reverse Eng: 35 Years @ 4.25%)
    const maxAllowedCommitment = totalIncomeMYR * 0.70;
    const availableForLoan = Math.max(0, maxAllowedCommitment - totalExistingDebtsMYR);
    const r = 0.0425 / 12; 
    const n = 35 * 12;     
    const maxLoan = availableForLoan * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));

    // Status
    let status: 'Safe' | 'Moderate' | 'Risky' = 'Safe';
    if (dsr > 70) status = 'Risky';
    else if (dsr > 60) status = 'Moderate';

    return {
      totalIncomeMYR,
      ccCommitmentNative,
      totalCommitmentsMYR,
      dsr,
      maxLoan,
      status
    };
  }, [values, mode, exchangeRate]);

  const updateVal = (key: keyof DSRState, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const currentCurrency = mode === 'SG' ? 'SGD' : 'MYR';

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 bg-zinc-950 text-zinc-100 font-sans min-h-[600px] rounded-3xl shadow-2xl border border-zinc-800">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Loan Eligibility</h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-zinc-400 text-sm">
               {mode === 'SG' ? 'Cross-Border Calculation' : 'Standard Calculation'}
             </p>
             {mode === 'SG' && (
               <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-900/20 border border-blue-900/30 rounded text-xs text-blue-300">
                  <span>Rate: {exchangeRate.toFixed(4)}</span>
                  <button onClick={fetchLiveRate} disabled={isLoadingRate} className="hover:text-white transition-colors">
                     <RefreshCw className={`w-3 h-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Country Toggle */}
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex items-center relative">
          <motion.div 
            className="absolute top-1 bottom-1 w-[120px] bg-zinc-800 rounded-lg shadow-sm"
            initial={false}
            animate={{ x: mode === 'MY' ? 4 : 128 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button 
            onClick={() => setMode('MY')}
            className={`relative z-10 w-[124px] py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'MY' ? 'text-white' : 'text-zinc-500'}`}
          >
            🇲🇾 Malaysia
          </button>
          <button 
             onClick={() => setMode('SG')}
             className={`relative z-10 w-[124px] py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'SG' ? 'text-white' : 'text-zinc-500'}`}
          >
            🇸🇬 Singapore
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800 md:hidden w-full mb-6">
          <button onClick={() => setActiveTab('income')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'income' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Income</button>
          <button onClick={() => setActiveTab('debt')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'debt' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Debt</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* --- LEFT: Inputs --- */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className={`${activeTab === 'income' ? 'block' : 'hidden md:block'}`}>
             <SectionHeader icon={Wallet} title={`Monthly Income (${currentCurrency})`} />
             <div className="space-y-6 mt-6">
                <CustomSlider 
                  label="Basic Salary" 
                  value={values.basicSalary} 
                  max={20000} 
                  currency={currentCurrency}
                  exchangeRate={mode === 'SG' ? exchangeRate : undefined}
                  onChange={(v) => updateVal('basicSalary', v)} 
                />
                <CustomSlider 
                  label="Fixed Allowance" 
                  value={values.fixedAllowance} 
                  max={5000} 
                  currency={currentCurrency}
                  exchangeRate={mode === 'SG' ? exchangeRate : undefined}
                  onChange={(v) => updateVal('fixedAllowance', v)} 
                />
                
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">Commission / OT</label>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      Recognized @ {values.variableRecognition}%
                    </span>
                  </div>
                  <CustomSlider 
                    label="" 
                    value={values.variableIncome} 
                    max={15000} 
                    currency={currentCurrency}
                    exchangeRate={mode === 'SG' ? exchangeRate : undefined}
                    onChange={(v) => updateVal('variableIncome', v)} 
                    hideLabel
                  />
                  <div className="flex gap-2 mt-4">
                     {[50, 80, 100].map((pct) => (
                       <button
                         key={pct}
                         onClick={() => updateVal('variableRecognition', pct)}
                         className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                           values.variableRecognition === pct 
                             ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-lg shadow-blue-900/20' 
                             : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                         }`}
                       >
                         {pct}%
                       </button>
                     ))}
                  </div>
                </div>
             </div>
          </div>

          <div className={`${activeTab === 'debt' ? 'block' : 'hidden md:block'}`}>
            <SectionHeader icon={CreditCard} title={`Existing Commitments (${currentCurrency})`} />
            <div className="space-y-6 mt-6">
              <CustomSlider 
                  label="Fixed Loans (Car, Personal)" 
                  value={values.fixedLoans} 
                  max={10000} 
                  currency={currentCurrency}
                  exchangeRate={mode === 'SG' ? exchangeRate : undefined}
                  onChange={(v) => updateVal('fixedLoans', v)} 
              />
              
              <div className="bg-red-900/10 p-4 rounded-xl border border-red-900/20 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                 <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-medium text-red-200">CC Outstanding Balance</label>
                    <div className="text-right">
                       <span className="text-[10px] text-red-400 block uppercase tracking-wider">Commitment (5%)</span>
                       <span className="text-sm font-bold text-red-100">
                         {formatCurrency(results.ccCommitmentNative, currentCurrency)}
                       </span>
                    </div>
                 </div>
                 <CustomSlider 
                    label="" 
                    value={values.ccBalance} 
                    max={50000} 
                    onChange={(v) => updateVal('ccBalance', v)} 
                    currency={currentCurrency}
                    hideLabel
                    trackColor="bg-red-900/40"
                    thumbColor="bg-red-500"
                  />
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-900/30 rounded border border-emerald-900/50">
                        <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm text-emerald-400 font-medium">New Property (Always MYR)</span>
                </div>
                <CustomSlider 
                    label="Estimated Installment" 
                    value={values.newLoanInstallment} 
                    max={15000} 
                    currency="MYR"
                    onChange={(v) => updateVal('newLoanInstallment', v)} 
                />
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT: Results --- */}
        <div className="lg:col-span-5">
           <div className="sticky top-6 space-y-6">
              
              {/* Score Card */}
              <div className={`
                relative overflow-hidden rounded-3xl p-8 border transition-colors duration-500
                ${results.status === 'Safe' ? 'bg-zinc-900 border-emerald-900/50' : 
                  results.status === 'Moderate' ? 'bg-zinc-900 border-amber-900/50' : 
                  'bg-zinc-900 border-red-900/50'}
              `}>
                  {/* Glow */}
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br opacity-20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none transition-colors duration-500
                    ${results.status === 'Safe' ? 'from-emerald-500' : 
                      results.status === 'Moderate' ? 'from-amber-500' : 
                      'from-red-500'}
                  `}/>

                  <div className="relative z-10 text-center space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Debt Service Ratio</p>
                    <div className={`text-7xl font-bold tracking-tighter transition-colors duration-300
                        ${results.status === 'Safe' ? 'text-emerald-400' : 
                          results.status === 'Moderate' ? 'text-amber-400' : 
                          'text-red-400'}
                      `}
                    >
                      {results.dsr.toFixed(1)}<span className="text-3xl align-top opacity-50">%</span>
                    </div>
                    
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                        ${results.status === 'Safe' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' : 
                          results.status === 'Moderate' ? 'bg-amber-950/50 border-amber-900 text-amber-400' : 
                          'bg-red-950/50 border-red-900 text-red-400'}
                      `}>
                         {results.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-8 relative h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-white/20 z-10" />
                    <motion.div 
                      className={`h-full rounded-full ${
                        results.status === 'Safe' ? 'bg-emerald-500' : 
                        results.status === 'Moderate' ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(results.dsr, 100)}%` }}
                    />
                  </div>
              </div>

              {/* Max Loan */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                 <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Max Loan Eligibility</p>
                    <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {formatCurrency(results.maxLoan, 'MYR')}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">Based on 35 Years @ 4.25%</p>
                 </div>
                 <div className="bg-zinc-950 p-4 rounded-full border border-zinc-800">
                    <TrendingUp className="w-6 h-6 text-zinc-400" />
                 </div>
              </div>

              {/* Summary */}
              <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 space-y-4">
                <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Calculation Breakdown
                </h4>
                
                {mode === 'SG' && (
                    <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-900/30 text-xs text-blue-200 flex justify-between items-center">
                        <span>Rate: 1 SGD = {exchangeRate.toFixed(4)} MYR</span>
                        <span className="opacity-50 text-[10px]">{lastUpdated}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <Row label="Total Net Income" value={results.totalIncomeMYR} />
                    <Row label="Total Commitments" value={results.totalCommitmentsMYR} isMinus />
                    <div className="h-px bg-zinc-800 my-2" />
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-zinc-400">Net Disposable</span>
                       <span className="text-white">
                           {formatCurrency(results.totalIncomeMYR - results.totalCommitmentsMYR, 'MYR')}
                       </span>
                    </div>
                </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}

// --- Sub-Components ---

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
    <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
      <Icon className="w-5 h-5 text-zinc-400" />
    </div>
    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
  </div>
);

const Row = ({ label, value, isMinus }: { label: string, value: number, isMinus?: boolean }) => (
  <div className="flex justify-between text-sm items-center">
    <span className="text-zinc-500">{label}</span>
    <span className={`font-mono ${isMinus ? 'text-red-400' : 'text-zinc-300'}`}>
      {isMinus ? '-' : ''} {formatCurrency(value, 'MYR')}
    </span>
  </div>
);

interface CustomSliderProps {
  label: string;
  value: number;
  max: number;
  currency: string;
  onChange: (val: number) => void;
  hideLabel?: boolean;
  trackColor?: string;
  thumbColor?: string;
  exchangeRate?: number; 
}

const CustomSlider = ({ 
    label, value, max, currency, onChange, 
    hideLabel, trackColor = "bg-zinc-800", thumbColor = "bg-zinc-200", exchangeRate 
}: CustomSliderProps) => {
    
  const convertedValue = exchangeRate ? value * exchangeRate : null;

  return (
    <div className="space-y-3 group/slider">
      {!hideLabel && (
        <div className="flex justify-between items-end">
          <label className="text-sm font-medium text-zinc-400 group-hover/slider:text-zinc-200 transition-colors">{label}</label>
          <div className="text-right">
             <div className="font-mono text-sm text-white font-bold">
                {formatCurrency(value, currency)}
             </div>
             {convertedValue && (
                 <div className="text-[10px] text-zinc-500 font-mono">
                    ≈ {formatCurrency(convertedValue, 'MYR')}
                 </div>
             )}
          </div>
        </div>
      )}
      
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={0}
          max={max}
          step={50}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        />
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${trackColor} z-10`}>
           <div 
             className={`h-full ${thumbColor} group-hover/slider:bg-blue-500 transition-colors duration-300`} 
             style={{ width: `${(value / max) * 100}%` }} 
           />
        </div>
        <div 
          className={`absolute h-4 w-4 rounded-full shadow-lg z-10 pointer-events-none transition-transform duration-100 ${thumbColor} group-hover/slider:scale-125`}
          style={{ left: `calc(${(value / max) * 100}% - 8px)` }}
        />
      </div>
    </div>
  );
};