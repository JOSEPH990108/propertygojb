// src\components\custom\ui\StaggeredDropdown.tsx
'use client';

import { 
  useState, 
  useEffect, 
  useRef, 
  Dispatch, 
  SetStateAction 
} from 'react';
import { motion, Variants } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; 
import Image from 'next/image';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

interface StaggeredDropDownProps {
  label: string; // Initials for profile or Button Text for action
  userImage?: string; 
  options: DropdownOption[];
  className?: string;
  variant?: 'profile' | 'action'; // Added variant prop
  icon?: LucideIcon; // Main icon for 'action' variant
}

const StaggeredDropDown = ({
  label,
  userImage,
  options,
  className,
  variant = 'profile',
  icon: MainIcon,
}: StaggeredDropDownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <motion.div ref={containerRef} animate={open ? 'open' : 'closed'} className="relative">
        
        {/* --- DYNAMIC TRIGGER --- */}
        <button
          onClick={() => setOpen((pv) => !pv)}
          className={cn(
            "relative flex items-center justify-center transition-all focus:outline-none",
            // Profile Variant: Circle
            variant === 'profile' && "h-10 w-10 rounded-full bg-primary border border-border overflow-hidden hover:scale-105",
            // Action Variant: Rectangular Button
            variant === 'action' && "gap-2 px-4 py-2.5 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 shadow-md ring-1 ring-border"
          )}
          type="button"
        >
          {variant === 'profile' ? (
            <>
              {userImage ? (
                <Image src={userImage} alt="Profile" fill className="object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary-foreground uppercase">{label}</span>
              )}
            </>
          ) : (
            <>
              {MainIcon && <MainIcon className="w-4 h-4 text-accent" />}
              <span className="font-semibold text-sm tracking-wide text-primary-foreground">{label}</span>
              <motion.span variants={iconVariants}>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.span>
            </>
          )}
        </button>

        {/* --- DROPDOWN MENU --- */}
        <motion.ul
          initial="closed"
          animate={open ? 'open' : 'closed'}
          variants={wrapperVariants}
          style={{ originY: 'top', originX: 1 }} 
          className="flex flex-col gap-1 p-2 rounded-xl bg-popover border border-border shadow-xl absolute top-[130%] right-0 w-max min-w-[220px] overflow-hidden z-50"
        >
          {options.map((option) => (
            <Option key={option.id} setOpen={setOpen} {...option} />
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
};

const Option = ({
  label,
  icon: Icon,
  setOpen,
  onClick,
}: DropdownOption & { setOpen: Dispatch<SetStateAction<boolean>> }) => {
  return (
    <motion.li
      variants={itemVariants}
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-foreground/80 hover:text-primary hover:bg-accent/10 transition-colors cursor-pointer"
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </motion.li>
  );
};

export default StaggeredDropDown;

const wrapperVariants: Variants = {
  open: {
    scale: 1,
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.05, duration: 0.2, ease: 'easeOut' },
  },
  closed: {
    scale: 0.9,
    opacity: 0,
    transition: { when: 'afterChildren', staggerChildren: 0.05, duration: 0.15, ease: 'easeIn' },
  },
};

const iconVariants: Variants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants: Variants = {
  open: { opacity: 1, y: 0 },
  closed: { opacity: 0, y: -5 },
};