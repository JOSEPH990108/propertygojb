// src\components\custom\feature\tools\PropertyMatcher.tsx
'use client';


import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Building2, TrendingUp, Heart, 
  Armchair, Trees, Coffee, ShoppingBag, 
  Check, ChevronRight, RefreshCcw,
  Briefcase, MapPin, Globe, Clock
} from 'lucide-react';
import { usePropertyMatcher } from '@/hooks/usePropertyMatcher';
import { SelectionCard } from './SelectionCard';
import { MatchResultCard } from './MatchResultCard';
import { cn } from '@/lib/utils';

// Define step configs with IDs
const ALL_STEPS_CONFIG: Record<string, { title: string, subtitle: string }> = {
  type: { title: "Property Type", subtitle: "What are you eyeing?" },
  budget: { title: "Max Budget", subtitle: "Finding value for you." },
  goal: { title: "Primary Goal", subtitle: "Yield or Comfort?" },
  rooms: { title: "Bedrooms", subtitle: "Space requirements." },
  tenant: { title: "Tenant Strategy", subtitle: "Who are you targeting?" },
  location: { title: "Location Preference", subtitle: "Connectivity needs." },
  balcony: { title: "Balcony?", subtitle: "Outdoor space needs." },
  vibe: { title: "Lifestyle", subtitle: "Your weekend vibe." },
};

export default function PropertyMatcher() {
  const { 
    step, 
    currentStepId,
    totalSteps,
    answers, 
    status, 
    results, 
    setAnswer, 
    goToNext, 
    goToPrev, 
    restart 
  } = usePropertyMatcher();

  // --- RENDER HELPERS (Keep the main return clean) ---

  const renderContent = () => {
    switch (currentStepId) {
      case 'type':
        return (
          <div className="grid grid-cols-2 gap-4">
            <SelectionCard 
              active={answers.type === 'High Rise'} 
              onClick={() => setAnswer('type', 'High Rise')}
              icon={<Building2 />} title="High Rise" desc="Condos & Serviced"
            />
            <SelectionCard 
              active={answers.type === 'Landed'} 
              onClick={() => setAnswer('type', 'Landed')}
              icon={<Home />} title="Landed" desc="Terrace & Semi-D"
            />
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-8">
            <div className="text-center text-4xl font-bold text-foreground font-serif">
              RM {answers.budget.toLocaleString()}
            </div>
            <input
              type="range" min="300000" max="3000000" step="50000"
              value={answers.budget}
              onChange={(e) => setAnswer('budget', parseInt(e.target.value))}
              className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        );
      case 'goal':
        return (
          <div className="grid grid-cols-2 gap-4">
            <SelectionCard 
              active={answers.goal === 'Own Stay'} 
              onClick={() => setAnswer('goal', 'Own Stay')}
              icon={<Heart />} title="Own Stay" desc="Focus on comfort"
            />
            <SelectionCard 
              active={answers.goal === 'Investment'} 
              onClick={() => setAnswer('goal', 'Investment')}
              icon={<TrendingUp />} title="Investment" desc="Focus on ROI"
            />
          </div>
        );
      case 'rooms':
        return (
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setAnswer('rooms', num)}
                className={cn(
                  "w-16 h-16 rounded-2xl text-xl font-bold transition-all shadow-sm",
                  answers.rooms === num 
                    ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                    : 'bg-card border border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                {num}+
              </button>
            ))}
          </div>
        );
      case 'tenant': // New Step
        return (
          <div className="grid grid-cols-2 gap-4">
             <SelectionCard
               active={answers.tenant === 'Long Term'}
               onClick={() => setAnswer('tenant', 'Long Term')}
               icon={<Briefcase />} title="Long Term" desc="Stable, 1+ year leases"
             />
             <SelectionCard
               active={answers.tenant === 'Short Term'}
               onClick={() => setAnswer('tenant', 'Short Term')}
               icon={<Clock />} title="Short Term" desc="Airbnb / Homestay"
             />
          </div>
        );
      case 'location': // New Step
        return (
           <div className="grid grid-cols-2 gap-4">
             <SelectionCard
               active={answers.location === 'RTS/CIQ'}
               onClick={() => setAnswer('location', 'RTS/CIQ')}
               icon={<MapPin />} title="Near RTS/CIQ" desc="Walk to checkpoint"
             />
             <SelectionCard
               active={answers.location === 'Anywhere'}
               onClick={() => setAnswer('location', 'Anywhere')}
               icon={<Globe />} title="Anywhere" desc="Wider options"
             />
           </div>
        );
      case 'balcony':
        return (
          <div className="grid grid-cols-2 gap-4">
            <SelectionCard 
              active={answers.balcony === true}
              onClick={() => setAnswer('balcony', true)}
              icon={<Check />} title="Must Have" desc="Need outdoor space"
            />
            <SelectionCard 
              active={answers.balcony === false}
              onClick={() => setAnswer('balcony', false)}
              icon={<div className="font-bold">✕</div>} title="Not Critical" desc="More indoor space"
            />
          </div>
        );
      case 'vibe':
        return (
          <div className="grid grid-cols-2 gap-4">
            {[
               { val: 'Nature', icon: <Trees />, desc: 'Greenery' },
               { val: 'Shopping', icon: <ShoppingBag />, desc: 'Malls' },
               { val: 'Quiet', icon: <Armchair />, desc: 'Peaceful' },
               { val: 'City', icon: <Coffee />, desc: 'Urban' }
            ].map((v) => (
              <SelectionCard 
                key={v.val}
                active={answers.vibe === v.val}
                // @ts-ignore
                onClick={() => setAnswer('vibe', v.val)}
                icon={v.icon} title={v.val} desc={v.desc}
              />
            ))}
          </div>
        );
      default: return null;
    }
  };

  // --- LOGIC ---
  const currentConfig = ALL_STEPS_CONFIG[currentStepId] || { title: "", subtitle: "" };

  // Validation for "Continue" button
  const isAnswerSelected = () => {
    switch(currentStepId) {
      case 'type': return answers.type !== null;
      case 'budget': return true; // Slider always has value
      case 'goal': return answers.goal !== null;
      case 'rooms': return answers.rooms !== null;
      case 'tenant': return answers.tenant !== null;
      case 'location': return answers.location !== null;
      case 'balcony': return answers.balcony !== null;
      case 'vibe': return answers.vibe !== null;
      default: return false;
    }
  };

  // --- MAIN RENDER ---

  if (status === 'searching') {
    return (
       <div className="w-full h-[600px] flex flex-col items-center justify-center bg-background">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-muted border-t-primary rounded-full mb-6"
          />
          <h3 className="font-bold text-foreground">Analysing market data...</h3>
       </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="p-6 bg-background min-h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-2xl font-bold font-serif text-foreground">Your Matches</h2>
            <button onClick={restart} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCcw className="w-4 h-4" /> Reset
            </button>
        </div>
        <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
           {results.length > 0 ? results.map((p, i) => (
             <MatchResultCard
                key={p.id}
                index={i}
                {...p}
             />
           )) : (
             <div className="text-center py-10 text-muted-foreground">No strict matches found. Try relaxing your filters.</div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background flex flex-col h-[600px]">
      {/* Progress */}
      <div className="mb-8">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-4 text-sm text-muted-foreground">
           <span>Step {step + 1}</span>
           {step > 0 && <button onClick={goToPrev} className="hover:text-foreground transition-colors">Back</button>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
             <h2 className="text-3xl font-bold text-foreground font-serif mb-2">{currentConfig.title}</h2>
             <p className="text-muted-foreground mb-8 text-lg">{currentConfig.subtitle}</p>
             {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <button 
        onClick={goToNext}
        disabled={!isAnswerSelected()}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-sm",
          isAnswerSelected()
             ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
             : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {step === totalSteps - 1 ? 'Show Matches' : 'Continue'} <ChevronRight size={20} />
      </button>
    </div>
  );
}
