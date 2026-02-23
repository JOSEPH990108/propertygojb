// src\components\custom\feature\tools\LoanStatistic.tsx
"use client";

import { useAmortizationSchedule } from "@/hooks/useAmortizationSchedule";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function LoanStatistic() {
  const amortization = useAmortizationSchedule();
  const firstMonth = amortization[0];

  const principalPct = (firstMonth.principal / firstMonth.total) * 100;
  const interestPct = 100 - principalPct;

  const interestAngle = (interestPct / 100) * 360;

  const [tooltip, setTooltip] = useState({
    content: "",
    x: 0,
    y: 0,
    visible: false,
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col items-center justify-center">
      <div className="relative w-40 h-40 select-none">
        <svg
          viewBox="0 0 36 36"
          className="w-full h-full"
          aria-label="Loan split pie chart"
        >
          <path
            d={describeArc(18, 18, 15.9155, 0, interestAngle)}
            fill="none"
            stroke="#ca0b4a"
            strokeWidth="3"
            tabIndex={0}
            aria-label="Interest portion"
            onMouseMove={(e) =>
              setTooltip({
                content: `Interest: ${formatCurrency(firstMonth.interest)}`,
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
                visible: true,
              })
            }
            onMouseLeave={() =>
              setTooltip((prev) => ({ ...prev, visible: false }))
            }
            onFocus={() =>
              setTooltip({
                content: `Interest: ${formatCurrency(firstMonth.interest)}`,
                x: 80,
                y: 16,
                visible: true,
              })
            }
            onBlur={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          />
          <path
            d={describeArc(18, 18, 15.9155, interestAngle, 360)}
            fill="none"
            stroke="#00a6ed"
            strokeWidth="3"
            tabIndex={0}
            aria-label="Principal portion"
            onMouseMove={(e) =>
              setTooltip({
                content: `Principal: ${formatCurrency(firstMonth.principal)}`,
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
                visible: true,
              })
            }
            onMouseLeave={() =>
              setTooltip((prev) => ({ ...prev, visible: false }))
            }
            onFocus={() =>
              setTooltip({
                content: `Principal: ${formatCurrency(firstMonth.principal)}`,
                x: 110,
                y: 90,
                visible: true,
              })
            }
            onBlur={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          />
        </svg>

        {tooltip.visible && (
          <div
            className="absolute text-xs px-2 py-1 bg-zinc-900 text-white rounded shadow z-20"
            style={{
              top: tooltip.y,
              left: tooltip.x,
              transform: "translate(-50%, -120%)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tooltip.content}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-xs text-zinc-500">1st Month</div>
          <div className="text-lg font-bold text-primary">
            {formatCurrency(firstMonth.total)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-center space-y-1">
        <div className="flex items-center justify-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#00a6ed]" /> Principal:{" "}
          {principalPct.toFixed(1)}%
        </div>
        <div className="flex items-center justify-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#ca0b4a]" /> Interest:{" "}
          {interestPct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
  