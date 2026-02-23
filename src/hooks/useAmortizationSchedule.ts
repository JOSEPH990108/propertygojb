// src\hooks\useAmortizationSchedule.ts
import { useLoanCalculation } from "./useLoanCalculation";
import { useMemo } from "react"; // Enhanced

export type AmortizationRow = {
  year: number;
  month: number;
  principal: number;
  interest: number;
  total: number;
  balance: number;
};

export function useAmortizationSchedule(): AmortizationRow[] {
  const { loanAmount, interestRate, tenureYears } = useLoanCalculation();

  return useMemo(() => {
    // Enhanced
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = tenureYears * 12;

    const monthlyInstallment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    let balance = loanAmount;
    const rows: AmortizationRow[] = [];

    for (let m = 1; m <= totalMonths; m++) {
      const interest = balance * monthlyRate;
      const principal = monthlyInstallment - interest;
      balance -= principal;

      rows.push({
        year: Math.floor((m - 1) / 12) + 1,
        month: ((m - 1) % 12) + 1,
        principal: parseFloat(principal.toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
        total: parseFloat(monthlyInstallment.toFixed(2)),
        balance: parseFloat(balance > 0 ? balance.toFixed(2) : "0"),
      });
    }
    return rows;
  }, [loanAmount, interestRate, tenureYears]); // Enhanced
}
