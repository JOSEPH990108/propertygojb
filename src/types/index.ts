// src\types\index.ts
import { LucideIcon } from "lucide-react";
import React from "react";

// --- Navigation & Dropdowns ---

export interface DropdownOption {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

// --- Interactive Components Data Structures ---

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface DeckItem {
  id: string | number;
  /** The content to show in the Stack (Left side) - Image, Video, Card component */
  cardContent: React.ReactNode;
  /** The content to show in the Info area (Right side) - Title, Description, etc. */
  infoContent: React.ReactNode;
}

// --- Property & Real Estate Specifics ---

export interface PropertySpecs {
  area: string;      // e.g. "2,500 sqft"
  rooms: string | number;     // e.g. "4 Beds" or 4
  bathrooms?: string | number; // e.g. "3 Baths" or 3
  color?: string;    // e.g. "White", "Beige"
  [key: string]: string | number | undefined; // Allow flexible specs for different property types
}

export interface PropertyItem {
  id: string;
  title: string;
  description: string;
  image: string;
  specs: PropertySpecs;
  actions?: {
    primary?: string;
    secondary?: string;
  };
}
