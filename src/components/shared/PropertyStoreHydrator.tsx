// src\components\shared\PropertyStoreHydrator.tsx
"use client";

import { useRef } from 'react';
import { usePropertyStore } from '@/stores/property-store';
import { PropertyData } from '@/app/actions/property-actions';

export function PropertyStoreHydrator({ data }: { data: PropertyData | null }) {
  const initialized = useRef(false);

  // We use usePropertyStore.setState directly to update the store.
  // We want this to happen as early as possible.
  if (!initialized.current && data) {
    usePropertyStore.setState({
      data,
      isLoading: false,
      lastFetched: Date.now(),
    });
    initialized.current = true;
  }

  return null;
}
