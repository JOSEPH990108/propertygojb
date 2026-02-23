// src\app\(demo)\demo-loader\page.tsx
"use client";

import { useGlobalLoaderStore } from "@/stores/global-loader-store";
import { motion } from "framer-motion";
import { Timer, RefreshCw, CheckCircle2 } from "lucide-react";

export default function LoaderDemoPage() {
  // Using the correct method names from your store
  const { show, hide, update } = useGlobalLoaderStore();

  // Scenario 1: Simple Load
  const handleSimpleLoad = () => {
    show("Loading Properties", "Fetching the latest luxury listings...");
    setTimeout(() => {
      hide();
    }, 2000);
  };

  // Scenario 2: Dynamic Updates (Sequence)
  const handleDynamicLoad = () => {
    show("Initiating Request", "Connecting to secure server...");
    
    // Update 1
    setTimeout(() => {
      update("Verifying Credentials", "Please wait while we authenticate...");
    }, 1500);

    // Update 2
    setTimeout(() => {
      update("Finalizing", "Preparing your dashboard...");
    }, 3000);

    // Finish
    setTimeout(() => {
      hide();
    }, 4500);
  };

  // Scenario 3: Transaction
  const handleProcessLoad = () => {
    show("Processing Payment", "Do not close this window...");
    
    setTimeout(() => {
      update("Processing Payment", "Confirming with bank...");
    }, 2000);

    setTimeout(() => {
      update("Success", "Transaction completed successfully.");
    }, 4000);

    setTimeout(() => {
      hide();
    }, 5500);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-8 space-y-12 transition-colors duration-500">
      
      <div className="text-center space-y-4 max-w-xl">
        <h1 className="text-5xl font-serif font-bold text-foreground">
          Loader <span className="text-accent">Playground</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Test the behavior of your global loader. Observe the entrance animations, 
          smooth text transitions, and exit fades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <DemoCard
          icon={<Timer className="size-6" />}
          title="Quick Fetch"
          description="Simulates a standard 2-second API data fetch."
          buttonText="Test Quick Load"
          onClick={handleSimpleLoad}
        />

        <DemoCard
          icon={<RefreshCw className="size-6" />}
          title="Multi-Step Flow"
          description="Demonstrates text transitions: Connect -> Verify -> Finalize."
          buttonText="Test Sequence"
          onClick={handleDynamicLoad}
        />

        <DemoCard
          icon={<CheckCircle2 className="size-6" />}
          title="Transaction"
          description="Simulates a sensitive action like a payment processing."
          buttonText="Test Process"
          onClick={handleProcessLoad}
        />
      </div>
    </main>
  );
}

function DemoCard({ 
  icon, 
  title, 
  description, 
  buttonText, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  buttonText: string; 
  onClick: () => void; 
}) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-accent/50 transition-all duration-300 group">
      <div className="mb-4 p-3 rounded-full bg-secondary text-secondary-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 flex-grow">{description}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
      >
        {buttonText}
      </motion.button>
    </div>
  );
}