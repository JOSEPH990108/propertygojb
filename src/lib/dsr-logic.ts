// src\lib\dsr-logic.ts

import { IncomeProfile, Commitments, DsrResult } from '@/types/dsr';

// 2. Constants (Approximate for Calculator)
const EPF_RATE = 0.11; // Employee share
const SOCSO_CAP = 5000; // Salary cap for SOCSO calculation usually around 5k-6k
const SOCSO_RATE = 0.005; // Roughly 0.5%
const PCB_ESTIMATE_THRESHOLD = 4000; // Tax starts roughly here
const PCB_RATE_AVG = 0.05; // Simplified effective tax rate for mid-range

export const DEFAULT_SG_EXCHANGE_RATE = 3.5;
const LOAN_TENURE_YEARS = 35;
const INTEREST_RATE = 4.4; // 4.4% p.a.

export const SYSTEM_CONFIG_KEYS = {
  SG_INCOME_FACTOR: 'sg_income_factor', // e.g., 3.0 or 3.5
};

export const DEFAULT_CONFIGS = {
  [SYSTEM_CONFIG_KEYS.SG_INCOME_FACTOR]: 3.0,
};


// 3. Logic
export function calculateDSR(
  income: IncomeProfile,
  commitments: Commitments,
  sgFactor: number = DEFAULT_CONFIGS[SYSTEM_CONFIG_KEYS.SG_INCOME_FACTOR]
): DsrResult {

  let netIncome = 0;
  let breakdown = { epf: 0, socso: 0, pcb: 0, exchangeRateUsed: 1 };

  const totalGross = income.basicSalary + income.fixedAllowance + income.nonFixedIncome;

  if (income.location === 'Malaysia') {
    // Calculate Deductions
    // EPF
    const epf = totalGross * EPF_RATE;

    // SOCSO (Capped)
    const socsoWage = Math.min(totalGross, SOCSO_CAP);
    const socso = socsoWage * SOCSO_RATE; // Simplified

    // EIS (Simpified ~0.2%)
    const eis = socsoWage * 0.002;

    // PCB (Tax) - Highly variable, we use a simplified bracket estimation for "Calculator" purpose
    let pcb = 0;
    if (totalGross > PCB_ESTIMATE_THRESHOLD) {
        pcb = (totalGross - PCB_ESTIMATE_THRESHOLD) * PCB_RATE_AVG;
    }

    breakdown = { epf, socso: socso + eis, pcb, exchangeRateUsed: 1 };
    netIncome = totalGross - epf - (socso + eis) - pcb;

  } else {
    // Singapore
    // We treat the "Factor" as the multiplier to get MYR Net Equivalent directly.
    netIncome = totalGross * sgFactor;
    breakdown = { epf: 0, socso: 0, pcb: 0, exchangeRateUsed: sgFactor };
  }

  // Calculate DSR
  const totalCommitments = commitments.existingLoans + commitments.newLoanRepayment;
  let dsrPercentage = 0;
  if (netIncome > 0) {
      dsrPercentage = (totalCommitments / netIncome) * 100;
  }

  // Status
  let status: 'Healthy' | 'Moderate' | 'Risky' = 'Healthy';
  if (dsrPercentage > 70) status = 'Risky';
  else if (dsrPercentage > 60) status = 'Moderate';

  // Max Affordable Installment (Target DSR 70%)
  // Available Cash Flow for New Loan = (Net Income * 70%) - Existing Commitments
  const maxAffordableRepayment = Math.max(0, (netIncome * 0.7) - commitments.existingLoans);

  return {
    grossIncome: totalGross,
    netIncome,
    totalCommitments,
    dsrPercentage: parseFloat(dsrPercentage.toFixed(2)),
    maxAffordableRepayment: parseFloat(maxAffordableRepayment.toFixed(2)),
    status,
    breakdown
  };
}

/**
 * Calculates the Max Loan Eligibility based on Monthly Installment.
 * Uses Present Value (PV) formula: PV = PMT * (1 - (1 + r)^-n) / r
 * @param monthlyInstallment The max affordable monthly repayment (PMT)
 * @param tenureYears Default 35 years
 * @param interestRatePercent Default 4.4%
 */
export function calculateMaxLoan(
    monthlyInstallment: number,
    tenureYears: number = LOAN_TENURE_YEARS,
    interestRatePercent: number = INTEREST_RATE
): number {
    if (monthlyInstallment <= 0) return 0;

    const r = (interestRatePercent / 100) / 12; // Monthly interest rate
    const n = tenureYears * 12; // Total number of months

    // PV Formula
    const maxLoan = monthlyInstallment * ((1 - Math.pow(1 + r, -n)) / r);

    // Round to nearest 100
    return Math.floor(maxLoan / 100) * 100;
}
