// src\stores\loan-calculator-store.ts
import { create } from "zustand";

/**
 * DeveloperDiscounts
 * ------------------
 * Flags for which fees/discounts are absorbed by the developer.
 */
type DeveloperDiscounts = {
  spaLegalFee: boolean;
  spaStampDuty: boolean;
  loanLegalFee: boolean;
  loanStampDuty: boolean;
  rebate: boolean;
};

/**
 * LoanCalculatorState
 * -------------------
 * All state for loan calculator, plus setters.
 */
type LoanCalculatorState = {
  spaPrice: number; // Sale & Purchase Agreement price (RM)
  downPaymentRate: number; // Down payment rate (%)
  interestRate: number; // Annual interest rate (%)
  tenureYears: number; // Loan tenure (years)
  sinkRate: number; // Sinking fund rate (monthly)
  sqft: number; // Built-up area (sqft)
  rebateAmount: number; // Rebate (RM)
  developerDiscounts: DeveloperDiscounts;

  // Setters (for UI inputs)
  setSpaPrice: (value: number) => void;
  setDownPaymentRate: (value: number) => void;
  setInterestRate: (value: number) => void;
  setTenureYears: (value: number) => void;
  setSinkRate: (value: number) => void;
  setSqft: (value: number) => void;
  setRebate: (value: number) => void;
  setDeveloperDiscounts: (value: Partial<DeveloperDiscounts>) => void;
};

/**
 * useLoanCalculatorStore
 * ----------------------
 * Zustand store for all mortgage/loan state.
 * - Default values for new calculations
 * - Setters make updating state super easy from any component.
 */
export const useLoanCalculatorStore = create<LoanCalculatorState>(
  (set, get) => ({
    spaPrice: 500000,
    downPaymentRate: 10,
    interestRate: 4.5,
    tenureYears: 30,
    sinkRate: 0.33,
    sqft: 1000,
    rebateAmount: 0,
    developerDiscounts: {
      spaLegalFee: false,
      spaStampDuty: false,
      loanLegalFee: false,
      loanStampDuty: false,
      rebate: false,
    },

    setSpaPrice: (value) => set({ spaPrice: value }),
    setDownPaymentRate: (value) => set({ downPaymentRate: value }),
    setInterestRate: (value) => set({ interestRate: value }),
    setTenureYears: (value) => set({ tenureYears: value }),
    setSinkRate: (value) => set({ sinkRate: value }),
    setSqft: (value) => set({ sqft: value }),
    setRebate: (value) => set({ rebateAmount: value }),
    setDeveloperDiscounts: (value) => {
      set({
        developerDiscounts: {
          ...get().developerDiscounts,
          ...value,
        },
      });
    },
  })
);
