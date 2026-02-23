// src/hooks/logic/matchmaker-logic.ts
import { MatchmakerState, PropertyMatch, LayoutScoreDetail } from '@/types/matchmaker';

// Mock Input Type to represent DB row
export interface LayoutData {
  id: string;
  projectId: string;
  projectName: string;
  name: string; // e.g., "Type A"
  propertyType: string; // 'Condo', 'Landed', etc.
  price: number;
  bedrooms: number;
  bathrooms: number;
  hasBalcony: boolean;
  builtUpSqft: number;
  rentalYieldScore: number; // 1-10
  comfortScore: number; // 1-10
  floorPlanUrl?: string;
  projectImage?: string;
}

/**
 * Main function to find top 3 matches
 */
export function findTopMatches(state: MatchmakerState, allLayouts: LayoutData[]): PropertyMatch[] {
  // 1. Hard Filter (Budget & Type)
  const filtered = allLayouts.filter(layout => {
    // Budget Buffer +10%
    const maxBudgetWithBuffer = state.maxBudget * 1.10;
    // Min Budget Buffer -10% (more lenient) or strict? Let's use exact min.
    // If layout price is lower than user's min budget, it's "too cheap" (maybe bad quality?).
    // But usually "budget" means "affordability".
    // "Range" implies "I am looking for properties between X and Y".
    // So we should filter out properties below minBudget.
    if (layout.price > maxBudgetWithBuffer) return false;
    if (layout.price < state.minBudget) return false;

    // Property Type
    if (state.propertyTypePreference !== 'Open') {
       // Simple string check, assuming DB stores 'Condo', 'Landed' etc.
       // In real app, might need mapping ID to Name
       if (layout.propertyType !== state.propertyTypePreference) return false;
    }

    // Path A: Own Stay - Bedroom Hard Filter
    if (state.purchasePurpose === 'Own Stay' && state.householdSize && state.householdSize >= 4) {
       if (layout.bedrooms < 3) return false;
    }

    // Path C: Both - Balcony "Must-have"
    if (state.purchasePurpose === 'Both' && state.balconyPreference === 'Must-have') {
        if (!layout.hasBalcony) return false;
    }

    return true;
  });

  // 2. Score remaining layouts
  const scored = filtered.map(layout => {
    const details = calculateScore(state, layout);
    return {
      // Spread layout properties
      ...layout,
      // Map renamed fields
      layoutId: layout.id,
      layoutName: layout.name,
      sqft: layout.builtUpSqft,
      // Add scores
      matchScore: details.totalScore,
      matchDetails: details,
    } as PropertyMatch;
  });

  // 3. Sort by Score DESC
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // 4. Return Top 3
  return scored.slice(0, 3);
}

function calculateScore(state: MatchmakerState, layout: LayoutData): LayoutScoreDetail {
  let baseScore = 0;
  let featureScore = 0;
  let purposeBonus = 0;
  const breakdown: string[] = [];

  // --- 1. Base Score (Budget Fit) ---
  // If we have a range, maybe we score based on where it falls in the range?
  // Or just proximity to max?
  // Let's keep logic simple: if it's within range, it's good.
  // If it's closer to minBudget (cheaper), maybe better value?
  const priceRatio = layout.price / state.maxBudget;
  if (priceRatio <= 0.9) {
    baseScore += 20;
    breakdown.push("Great Value: Under 90% of max budget (+20)");
  } else if (priceRatio <= 1.0) {
    baseScore += 10;
    breakdown.push("Good Fit: Within budget (+10)");
  }

  // --- 2. Feature Score ---

  // Bedrooms
  // Logic: "Exact match" hard to define without explicit "I want 2 beds".
  // Mapping inferred from Purpose answers:
  let desiredBeds = 0;

  if (state.purchasePurpose === 'Own Stay') {
     if (state.householdSize && state.householdSize <= 2) desiredBeds = 2; // 1-2 usually fit in 1-2 beds
     else if (state.householdSize && state.householdSize >= 4) desiredBeds = 3;

     if (desiredBeds > 0 && layout.bedrooms === desiredBeds) {
         featureScore += 30;
         breakdown.push(`Perfect Size: Fits your household size (+30)`);
     }
  }
  else if (state.purchasePurpose === 'Investment') {
      if (state.targetTenant === 'Student/Single') {
          // Prioritize Studio (1) or 2 bed
          if (layout.bedrooms <= 2) {
             featureScore += 30;
             breakdown.push("High Yield Potential: Ideal for Students/Singles (+30)");
          }
      } else if (state.targetTenant === 'Family') {
          if (layout.bedrooms >= 3) {
             featureScore += 30;
             breakdown.push("Family Friendly: Good for Family tenants (+30)");
          }
      }

      // Capital Appreciation vs Yield
      if (state.investmentGoal === 'Yield' && layout.builtUpSqft < 800) {
           featureScore += 10;
           breakdown.push("Lower Quantum: Good for Yield (+10)");
      } else if (state.investmentGoal === 'Appreciation' && (layout.propertyType === 'Landed' || layout.builtUpSqft > 1000)) {
           featureScore += 10;
           breakdown.push("Scarcity/Size: Good for Appreciation (+10)");
      }
  }
  else if (state.purchasePurpose === 'Both') {
      // "Don't Know" Logic
      // If fits budget best (+20) - already handled in Base Score partially, but we can boost.
      // Prioritize layout with highest projected Rental Yield if "Don't Know"
      if (layout.rentalYieldScore >= 8) {
          featureScore += 20;
          breakdown.push("Smart Pick: High Rental Potential (+20)");
      }

      // Balcony Preference
      if (state.balconyPreference === 'Must-have' && layout.hasBalcony) {
          featureScore += 20;
          breakdown.push("Has Balcony (+20)");
      } else if (state.balconyPreference === 'Okay without') {
          if (!layout.hasBalcony && layout.builtUpSqft > 900) {
              featureScore += 20; // Highlight larger internal space
              breakdown.push("Spacious Interior: Maximized indoor space (+20)");
          }
      }
  }

  // Explicit Balcony check for Own Stay
  if (state.purchasePurpose === 'Own Stay') {
      if (state.needsBalcony && layout.hasBalcony) {
          featureScore += 30;
          breakdown.push("Lifestyle Match: Has Balcony (+30)");
      }
  }

  // Property Type Preference
  if (state.propertyTypePreference !== 'Open' && layout.propertyType === state.propertyTypePreference) {
      featureScore += 30;
      breakdown.push("Preferred Type (+30)");
  }


  // --- 3. Purpose Multiplier ---
  if (state.purchasePurpose === 'Own Stay') {
      const bonus = layout.comfortScore * 2;
      purposeBonus += bonus;
      breakdown.push(`Comfort Bonus: ${layout.comfortScore}/10 x 2 (+${bonus})`);
  }
  else if (state.purchasePurpose === 'Investment') {
      const bonus = layout.rentalYieldScore * 2;
      purposeBonus += bonus;
      breakdown.push(`Yield Bonus: ${layout.rentalYieldScore}/10 x 2 (+${bonus})`);
  }
  else if (state.purchasePurpose === 'Both') {
      if (state.priority === 'Resale Value') {
          // Weight 70% towards Investment
          // Let's approximate: 1.5x Yield, 0.5x Comfort
          const yieldBonus = Math.round(layout.rentalYieldScore * 1.5);
          const comfortBonus = Math.round(layout.comfortScore * 0.5);
          purposeBonus += yieldBonus + comfortBonus;
          breakdown.push(`Hybrid Bonus (Resale Focus): Yield (+${yieldBonus}) + Comfort (+${comfortBonus})`);
      } else {
           // Comfort Focus
          const yieldBonus = Math.round(layout.rentalYieldScore * 0.5);
          const comfortBonus = Math.round(layout.comfortScore * 1.5);
          purposeBonus += yieldBonus + comfortBonus;
          breakdown.push(`Hybrid Bonus (Comfort Focus): Comfort (+${comfortBonus}) + Yield (+${yieldBonus})`);
      }
  }

  return {
    baseScore,
    featureScore,
    purposeBonus,
    totalScore: baseScore + featureScore + purposeBonus,
    breakdown
  };
}
