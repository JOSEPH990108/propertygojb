// src\hook\useDSR.ts
import { useState, useRef } from 'react';
import { calculateDSR, calculateMaxLoan } from '@/lib/dsr-logic';
import { DsrResult, IncomeProfile, Commitments } from '@/types/dsr';
import { getSgExchangeRate } from '@/services/finance';
import { useLenis } from '@/components/shared/SmoothScroll';

export function useDsrCalculator() {
  const [income, setIncome] = useState<IncomeProfile>({
    basicSalary: 5000,
    fixedAllowance: 0,
    nonFixedIncome: 0,
    location: 'Malaysia'
  });

  const [commitments, setCommitments] = useState<Commitments>({
    existingLoans: 1000,
    newLoanRepayment: 2000
  });

  const [sgFactor, setSgFactor] = useState(3.0);
  const [loadingRate, setLoadingRate] = useState(false);
  const [result, setResult] = useState<DsrResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [maxLoan, setMaxLoan] = useState(0);

  const resultRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  const handleCalculate = async () => {
     // If Singapore income selected, ensure rate is fresh-ish or just use current
     if (income.location === 'Singapore' && loadingRate) {
         // wait nicely or just proceed
     }

     const res = calculateDSR(income, commitments, sgFactor);
     setResult(res);

     // Calculate Max Loan Eligibility based on Affordable Installment
     const loanAmount = calculateMaxLoan(res.maxAffordableRepayment);
     setMaxLoan(loanAmount);

     setShowResult(true);

     // Wait for state update and render, then scroll
     setTimeout(() => {
        if (resultRef.current && lenis) {
            lenis.scrollTo(resultRef.current, { offset: -50, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
        } else if (resultRef.current) {
             resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
     }, 100);
  };

  const refreshRate = async () => {
      setLoadingRate(true);
      const rate = await getSgExchangeRate();
      setSgFactor(rate);
      setLoadingRate(false);
  };

  const handleLocationChange = async (loc: 'Malaysia' | 'Singapore') => {
      setIncome(prev => ({ ...prev, location: loc }));
      if (loc === 'Singapore') {
          refreshRate();
      }
  };

  return {
    income,
    setIncome,
    commitments,
    setCommitments,
    sgFactor,
    loadingRate,
    result,
    showResult,
    maxLoan,
    resultRef,
    handleCalculate,
    refreshRate,
    handleLocationChange
  };
}
