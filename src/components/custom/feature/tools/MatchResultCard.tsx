// src\components\custom\feature\tools\MatchResultCard.tsx

import { motion } from 'framer-motion';
import Image from "next/image";
import { Check } from 'lucide-react';

interface MatchResultCardProps {
  id: string | number;
  image: string;
  score: number;
  name: string;
  matchReasons: string[];
  index: number;
}

export const MatchResultCard = ({ image, score, name, matchReasons, index }: MatchResultCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border rounded-xl overflow-hidden flex bg-card hover:shadow-luxury transition-all duration-300"
    >
      <div className="w-32 relative shrink-0">
        <Image src={image} fill className="object-cover" alt={name} />
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded font-bold shadow-sm z-10">
          {score}%
        </div>
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-bold text-lg text-foreground">{name}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {matchReasons.map(r => (
            <span key={r} className="text-xs bg-accent/15 text-foreground px-2 py-1 rounded font-medium flex items-center gap-1 border border-transparent">
              <Check className="w-3 h-3 text-primary" /> {r}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
  }
