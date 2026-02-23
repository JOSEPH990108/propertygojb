// src\hooks\useLoanCalculation.ts
import { useLoanCalculatorStore } from "@/stores/loan-calculator-store";

// Helper: Round to 2 decimals
const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// --- SRO 2023 Legal Fee Scale ---
function calcLegalFee(amount: number): number {
  let fee = 0;
  let remainder = amount;

  // First 500k @ 1.25%
  const tier1 = Math.min(remainder, 500_000);
  fee += tier1 * 0.0125;
  remainder = Math.max(0, remainder - 500_000);

  // Next 7M @ 1.0%
  const tier2 = Math.min(remainder, 7_000_000);
  fee += tier2 * 0.01;
  remainder = Math.max(0, remainder - 7_000_000);
  
  // Excess @ 0.9% (rare, but correct formula)
  fee += remainder * 0.009;

  return Math.max(round(fee), 500); // Min fee RM500
}

// --- Stamp Duty SPA (MOT) - Budget 2024/25 Tier ---
function calcStampDutySPA(price: number): number {
  let duty = 0;
  let remainder = price;

  // First 100k @ 1%
  const t1 = Math.min(remainder, 100_000);
  duty += t1 * 0.01;
  remainder = Math.max(0, remainder - 100_000);

  // Next 400k @ 2%
  const t2 = Math.min(remainder, 400_000);
  duty += t2 * 0.02;
  remainder = Math.max(0, remainder - 400_000);

  // Next 500k @ 3%
  const t3 = Math.min(remainder, 500_000);
  duty += t3 * 0.03;
  remainder = Math.max(0, remainder - 500_000);

  // Excess > 1M @ 4%
  duty += remainder * 0.04;

  return round(duty);
}

// --- Stamp Duty Loan (Flat 0.5%) ---
function calcStampDutyLoan(loan: number): number {
  return round(loan * 0.005);
}

export function useLoanCalculation() {
  const state = useLoanCalculatorStore();

  // 1. Core Values
  const downPaymentAmount = (state.downPaymentRate / 100) * state.spaPrice;
  const loanAmount = state.spaPrice - downPaymentAmount;
  const monthlyRate = state.interestRate / 100 / 12;
  const totalMonths = state.tenureYears * 12;

  // 2. Installment (PMT)
  let monthlyInstallment = 0;
  if (monthlyRate > 0) {
    monthlyInstallment =
      (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalMonths));
  } else {
    monthlyInstallment = loanAmount / totalMonths;
  }

  const totalPayment = monthlyInstallment * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  // 3. Fees
  const spaLegalFeeRaw = calcLegalFee(state.spaPrice);
  const loanLegalFeeRaw = calcLegalFee(loanAmount);
  const spaStampDutyRaw = calcStampDutySPA(state.spaPrice);
  const loanStampDutyRaw = calcStampDutyLoan(loanAmount);

  // 4. Exemptions
  const spaLegalFee = state.developerDiscounts.spaLegalFee ? 0 : spaLegalFeeRaw;
  const loanLegalFee = state.developerDiscounts.loanLegalFee ? 0 : loanLegalFeeRaw;
  const spaStampDuty = state.developerDiscounts.spaStampDuty ? 0 : spaStampDutyRaw;
  const loanStampDuty = state.developerDiscounts.loanStampDuty ? 0 : loanStampDutyRaw;

  // 5. Cash Required
  const estDisbursement = 2500; 
  
  const cashRequired =
    downPaymentAmount +
    spaLegalFee +
    loanLegalFee +
    spaStampDuty +
    loanStampDuty +
    estDisbursement - 
    state.rebateAmount;

  // 6. Dates (NEW LOGIC ADDED HERE)
  const today = new Date();
  const lastPaymentDate = new Date(today);
  lastPaymentDate.setFullYear(today.getFullYear() + state.tenureYears);

  return {
    ...state,
    loanAmount,
    downPaymentAmount,
    monthlyInstallment,
    totalPayment,
    totalInterest,
    spaLegalFee,
    loanLegalFee,
    spaStampDuty,
    loanStampDuty,
    estDisbursement,
    cashRequired,
    lastPaymentDate,
  };
}