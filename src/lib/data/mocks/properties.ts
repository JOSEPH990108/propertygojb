// src\lib\data\mocks\properties.ts
import { LayoutData } from '@/types/matchmaker';

export const MOCK_LAYOUTS: LayoutData[] = [
  // --- Project A: The Astaka (Luxury High-Rise) ---
  {
    id: 'astaka-a',
    projectId: 'astaka',
    projectName: 'The Astaka',
    name: 'Type A',
    propertyType: 'Condo',
    price: 1200000,
    bedrooms: 3,
    bathrooms: 3,
    hasBalcony: true, // Luxury typically has private lift lobby/balcony
    builtUpSqft: 2207,
    rentalYieldScore: 4, // High price, lower yield %
    comfortScore: 10, // Extreme luxury
    projectImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80',
  },
  {
    id: 'astaka-b',
    projectId: 'astaka',
    projectName: 'The Astaka',
    name: 'Type B (Duplex)',
    propertyType: 'Condo',
    price: 2500000,
    bedrooms: 4,
    bathrooms: 5,
    hasBalcony: true,
    builtUpSqft: 2659,
    rentalYieldScore: 3,
    comfortScore: 10,
    projectImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
  },

  // --- Project B: R&F Princess Cove (Investment/Connectivity) ---
  {
    id: 'rnf-studio',
    projectId: 'rnf',
    projectName: 'R&F Princess Cove',
    name: 'Studio',
    propertyType: 'Apartment',
    price: 450000,
    bedrooms: 1, // Studio treated as 1 for simplicity or 0
    bathrooms: 1,
    hasBalcony: false,
    builtUpSqft: 468,
    rentalYieldScore: 9, // High demand near causeway
    comfortScore: 6, // Small
    projectImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80',
  },
  {
    id: 'rnf-2bed',
    projectId: 'rnf',
    projectName: 'R&F Princess Cove',
    name: '2-Bedroom',
    propertyType: 'Apartment',
    price: 650000,
    bedrooms: 2,
    bathrooms: 1,
    hasBalcony: true,
    builtUpSqft: 870,
    rentalYieldScore: 8,
    comfortScore: 7,
    projectImage: 'https://images.unsplash.com/photo-1460317442991-0ec2aaefcb88?auto=format&fit=crop&q=80',
  },

  // --- Project C: Eco Botanic (Landed Family) ---
  {
    id: 'eco-cluster',
    projectId: 'eco',
    projectName: 'Eco Botanic',
    name: 'Cluster Home',
    propertyType: 'Landed',
    price: 1100000,
    bedrooms: 4,
    bathrooms: 4,
    hasBalcony: true,
    builtUpSqft: 2400,
    rentalYieldScore: 5, // Family rental market is slower
    comfortScore: 9, // Great environment
    projectImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80',
  },
  {
    id: 'eco-semi-d',
    projectId: 'eco',
    projectName: 'Eco Botanic',
    name: 'Semi-D',
    propertyType: 'Landed',
    price: 1600000,
    bedrooms: 5,
    bathrooms: 5,
    hasBalcony: true,
    builtUpSqft: 3200,
    rentalYieldScore: 4,
    comfortScore: 10,
    projectImage: 'https://images.unsplash.com/photo-1600596542815-e32870110274?auto=format&fit=crop&q=80',
  },

  // --- Project D: Austin Regency (Mid-Range Family) ---
  {
    id: 'austin-2bed',
    projectId: 'austin',
    projectName: 'Austin Regency',
    name: 'Type A (2 Bed)',
    propertyType: 'Apartment',
    price: 420000,
    bedrooms: 2,
    bathrooms: 2,
    hasBalcony: true,
    builtUpSqft: 990,
    rentalYieldScore: 7,
    comfortScore: 8, // Good size for small family
    projectImage: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80',
  },
  {
    id: 'austin-3bed',
    projectId: 'austin',
    projectName: 'Austin Regency',
    name: 'Type B (3 Bed)',
    propertyType: 'Apartment',
    price: 550000,
    bedrooms: 3,
    bathrooms: 2,
    hasBalcony: true,
    builtUpSqft: 1200,
    rentalYieldScore: 6,
    comfortScore: 9, // Spacious
    projectImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80',
  }
];

// src/data/mockProjects.ts

export type Project = {
  id: string;
  name: string;
  category: 'Landed' | 'High Rise';
  minPrice: number;
  bedrooms: number[];
  hasBalcony: boolean;
  nearRTS: boolean;
  tags: string[];
  scores: {
    investment: number;
    ownStay: number;
    nature: number;
    shopping: number;
  };
  image: string;
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'The Astaka',
    category: 'High Rise',
    minPrice: 900000,
    bedrooms: [3, 4, 5],
    hasBalcony: true,
    nearRTS: false,
    tags: ['Luxury', 'City View', 'Concierge'],
    scores: { investment: 8, ownStay: 10, nature: 3, shopping: 9 },
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80',
  },
  {
    id: 'p2',
    name: 'Eco Botanic',
    category: 'Landed',
    minPrice: 1200000,
    bedrooms: [4, 5],
    hasBalcony: true,
    nearRTS: false,
    tags: ['Gated', 'Greenery', 'Family'],
    scores: { investment: 7, ownStay: 10, nature: 10, shopping: 5 },
    image: 'https://images.unsplash.com/photo-1600596542815-e328701102b9?auto=format&fit=crop&q=80',
  },
  {
    id: 'p3',
    name: 'R&F Princess Cove',
    category: 'High Rise',
    minPrice: 600000,
    bedrooms: [1, 2, 3, 4],
    hasBalcony: true,
    nearRTS: true,
    tags: ['CIQ Link', 'Sea View', 'Mall Access'],
    scores: { investment: 10, ownStay: 7, nature: 4, shopping: 10 },
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
  },
];