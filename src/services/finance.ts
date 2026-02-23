// src\services\finance.ts
'use server';

import { DEFAULT_SG_EXCHANGE_RATE } from '@/lib/dsr-logic';

const API_URL = 'https://open.er-api.com/v6/latest/SGD';

interface ExchangeRateResponse {
  result: string;
  rates: {
    MYR: number;
    [key: string]: number;
  };
}

export async function getSgExchangeRate(): Promise<number> {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 3600 } }); // Cache for 1 hour

    if (!res.ok) {
        throw new Error('Failed to fetch exchange rates');
    }

    const data: ExchangeRateResponse = await res.json();

    if (data.rates && data.rates.MYR) {
        return data.rates.MYR;
    }

    return DEFAULT_SG_EXCHANGE_RATE;
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return DEFAULT_SG_EXCHANGE_RATE;
  }
}
