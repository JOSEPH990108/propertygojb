export interface IncomeProfile {
  basicSalary: number;     // Gross Monthly
  fixedAllowance: number;  // Fixed monthly allowances
  nonFixedIncome: number;  // Commission, OT, Bonus (Annual / 12)
  location: 'Malaysia' | 'Singapore';
}

export interface Commitments {
  existingLoans: number;   // Car, Personal, PTPTN, House
  newLoanRepayment: number; // Estimated monthly for the new property
}

export interface DsrResult {
  grossIncome: number;
  netIncome: number;
  totalCommitments: number;
  dsrPercentage: number;
  maxAffordableRepayment: number; // Suggested max installment for healthy DSR (e.g. 70%)
  status: 'Healthy' | 'Moderate' | 'Risky';
  breakdown: {
    epf: number;
    socso: number;
    pcb: number; // Tax
    exchangeRateUsed?: number;
  };
}
