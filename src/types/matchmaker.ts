// src/types/matchmaker.ts

export type PropertyType = 'Landed' | 'Apartment' | 'Condo' | 'SoHo' | 'Open';

// Phase 2: User Inputs
export interface MatchmakerState {
  // Q1 Core
  minBudget: number;
  maxBudget: number;
  propertyTypePreference: PropertyType; // 'Open' if they don't care

  // Q2 Purpose
  purchasePurpose: 'Own Stay' | 'Investment' | 'Both' | null;

  // Path A: Own Stay
  householdSize?: number; // 1-2, 3-4, 5+
  needsBalcony?: boolean;
  idealBathrooms?: number;

  // Path B: Investment
  targetTenant?: 'Student/Single' | 'Family';
  investmentGoal?: 'Yield' | 'Appreciation';

  // Path C: Both
  priority?: 'Resale Value' | 'Daily Comfort';
  balconyPreference?: 'Must-have' | 'Okay without';
}

export interface LayoutScoreDetail {
  baseScore: number;
  featureScore: number;
  purposeBonus: number;
  totalScore: number;
  breakdown: string[]; // Explanations: "Fits budget (+20)", "Has balcony (+20)"
}

export interface LayoutData {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  propertyType: PropertyType; // Use the specific type
  price: number;
  bedrooms: number;
  bathrooms: number;
  hasBalcony: boolean;
  builtUpSqft: number;
  rentalYieldScore: number;
  comfortScore: number;
  projectImage?: string;
}

export interface PropertyMatch extends LayoutData {
  // Calculated
  matchScore: number;
  matchDetails: LayoutScoreDetail;
  floorPlanUrl?: string; // Optional extension
  layoutName: string; // Map name to layoutName for consistency
  sqft: number; // Map builtUpSqft to sqft
}
