// src\hooks\usePropertyMatcher.ts
import { useQuizStore, QuizState } from '@/stores/quiz-store';
import { MOCK_PROJECTS, Project } from '@/lib/data/mocks/properties';

export type MatchedProject = Project & {
  score: number;
  matchReasons: string[];
};

// Helper to determine step sequence dynamically
export const getStepSequence = (goal: QuizState['goal']): string[] => {
  const baseSteps = ['type', 'budget', 'goal', 'rooms'];
  const investmentSteps = ['tenant', 'location'];
  const endSteps = ['balcony', 'vibe'];

  if (goal === 'Investment') {
    return [...baseSteps, ...investmentSteps, ...endSteps];
  }
  return [...baseSteps, ...endSteps];
};

export const usePropertyMatcher = () => {
  const { 
    step, 
    answers, 
    status, 
    setAnswer, 
    nextStep, 
    prevStep, 
    setStatus, 
    resetQuiz 
  } = useQuizStore();

  const currentStepSequence = getStepSequence(answers.goal);

  // The Core Algorithm
  const calculateMatches = (): MatchedProject[] => {
    return MOCK_PROJECTS
      .map((p) => {
        let score = 0;
        let reasons: string[] = [];

        // 1. HARD FILTERS (Deal Breakers)
        if (p.minPrice > answers.budget) return null;
        if (answers.type && answers.type !== 'Any' && p.category !== answers.type) return null;
        if (answers.rooms && !p.bedrooms.some((r) => r >= answers.rooms!)) return null;
        if (answers.balcony && !p.hasBalcony) return null;
        if (answers.goal === 'Investment' && answers.location === 'RTS/CIQ' && !p.nearRTS) return null;

        // 2. GOAL SCORING
        const goalScore = answers.goal === 'Investment' ? p.scores.investment : p.scores.ownStay;
        score += goalScore * 4;
        
        if (goalScore >= 8) {
          reasons.push(answers.goal === 'Investment' ? "High Rental Yield" : "Top Living Comfort");
        }

        // 3. TENANT PREFERENCE (Investment Only)
        if (answers.goal === 'Investment' && answers.tenant) {
          if (answers.tenant === 'Short Term') {
            // Short term favors shopping/tourism areas
            score += p.scores.shopping * 2;
            if (p.scores.shopping >= 8) reasons.push("Great for Short Stay");
          } else {
            // Long term favors own stay score (livability) even for investors
            score += p.scores.ownStay * 2;
            if (p.scores.ownStay >= 8) reasons.push("Stable Long Term Choice");
          }
        }

        // 4. VIBE SCORING
        if (answers.vibe) {
          let vibeScore = 0;
          if (answers.vibe === 'Nature') vibeScore = p.scores.nature;
          else if (['Shopping', 'City'].includes(answers.vibe)) vibeScore = p.scores.shopping;
          else vibeScore = 5; // Neutral for 'Quiet' unless specifically tagged

          score += vibeScore * 3;

          if (vibeScore >= 8) {
              reasons.push(answers.vibe === 'Nature' ? "Greenery Focus" : "Urban Lifestyle");
          }
        }

        // 5. BUDGET BONUS
        if (p.minPrice < answers.budget * 0.8) {
            score += 10;
            reasons.push("Great Value");
        }

        return { 
          ...p, 
          score: Math.min(Math.round(score), 100), 
          matchReasons: reasons 
        };
      })
      .filter((p): p is MatchedProject => p !== null) // Type guard to remove nulls
      .sort((a, b) => b.score - a.score);
  };

  // Logic Wrapper to handle async search simulation
  const submitQuiz = () => {
    setStatus('searching');
    setTimeout(() => {
      setStatus('completed');
    }, 1500);
  };

  return {
    // State
    step,
    currentStepId: currentStepSequence[step],
    totalSteps: currentStepSequence.length,
    answers,
    status,
    results: status === 'completed' ? calculateMatches() : [],
    
    // Actions
    setAnswer,
    goToNext: () => {
        if (step === currentStepSequence.length - 1) submitQuiz();
        else nextStep(currentStepSequence.length);
    },
    goToPrev: prevStep,
    restart: resetQuiz
  };
};