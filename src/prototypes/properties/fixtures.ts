export const propertyTypes = [
  "Condominium",
  "Townhouse",
  "Detached home",
] as const;
export const propertyAreas = [
  "Iskandar Puteri",
  "Johor Bahru",
  "Kulai",
  "Pasir Gudang",
] as const;

export type PropertyType = (typeof propertyTypes)[number];
export type PropertyArea = (typeof propertyAreas)[number];

export interface SyntheticProperty {
  readonly slug: string;
  readonly name: string;
  readonly type: PropertyType;
  readonly area: PropertyArea;
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly floorAreaSqFt: number;
  readonly featuredOrder: number;
  readonly palette: "sage" | "clay" | "sand" | "slate" | "olive";
  readonly introduction: string;
  readonly highlights: readonly string[];
  readonly locationDescription: string;
  readonly fictional: true;
}

export const prototypeNotice =
  "Fictional demonstration only. Names, specifications and illustrations are invented, not real listings. No prices, availability, developer claims or exact addresses are provided.";

export const properties = [
  {
    slug: "canopy-court",
    name: "Canopy Court",
    type: "Condominium",
    area: "Iskandar Puteri",
    bedrooms: 3,
    bathrooms: 2,
    floorAreaSqFt: 1420,
    featuredOrder: 1,
    palette: "sage",
    introduction:
      "A fictional courtyard residence imagined around open skies, generous balconies and a quieter rhythm of living.",
    highlights: [
      "An imagined courtyard at the heart of the composition",
      "A conceptual living space opening onto a deep balcony",
      "A study nook designed into the fictional layout",
    ],
    locationDescription:
      "This concept takes broad inspiration from Iskandar Puteri in western Johor. It has no actual site, map pin or verified proximity to amenities.",
    fictional: true,
  },
  {
    slug: "terracotta-mews",
    name: "Terracotta Mews",
    type: "Townhouse",
    area: "Johor Bahru",
    bedrooms: 4,
    bathrooms: 3,
    floorAreaSqFt: 2180,
    featuredOrder: 2,
    palette: "clay",
    introduction:
      "A fictional collection of low-rise homes, exploring warm materials, shaded thresholds and room for everyday rituals.",
    highlights: [
      "A conceptual two-level arrangement",
      "An imagined sheltered entrance and private terrace",
      "A flexible room for reading, work or quiet time",
    ],
    locationDescription:
      "The Johor Bahru area is a broad reference for this invented urban-home study. No real development, street or transport connection is represented.",
    fictional: true,
  },
  {
    slug: "serein-house",
    name: "Serein House",
    type: "Detached home",
    area: "Kulai",
    bedrooms: 4,
    bathrooms: 4,
    floorAreaSqFt: 2860,
    featuredOrder: 3,
    palette: "sand",
    introduction:
      "An invented garden home where a simple architectural frame makes space for light, shade and unhurried afternoons.",
    highlights: [
      "A fictional single-home garden setting",
      "A conceptual covered outdoor living area",
      "An imagined separation of shared and quiet spaces",
    ],
    locationDescription:
      "Kulai provides only a regional point of reference for this fictional garden-home concept. Site conditions and distances are intentionally unspecified.",
    fictional: true,
  },
  {
    slug: "tideline-residences",
    name: "Tideline Residences",
    type: "Condominium",
    area: "Pasir Gudang",
    bedrooms: 2,
    bathrooms: 2,
    floorAreaSqFt: 980,
    featuredOrder: 4,
    palette: "slate",
    introduction:
      "A fictional compact residence studying a clean silhouette, practical proportions and a restrained material palette.",
    highlights: [
      "A conceptual open living and dining arrangement",
      "Two imagined bedrooms with distinct quiet zones",
      "An architectural study of recessed balcony frames",
    ],
    locationDescription:
      "This invented example uses Pasir Gudang as a broad Johor-area label only. The name does not imply a waterfront site, view or real location.",
    fictional: true,
  },
  {
    slug: "fernwalk-terraces",
    name: "Fernwalk Terraces",
    type: "Townhouse",
    area: "Iskandar Puteri",
    bedrooms: 3,
    bathrooms: 3,
    floorAreaSqFt: 1860,
    featuredOrder: 5,
    palette: "olive",
    introduction:
      "An invented terrace-home study shaped by intimate entrances, planted edges and a considered balance of shared and private space.",
    highlights: [
      "An imagined planted threshold between home and street",
      "A conceptual upstairs reading landing",
      "A fictional terrace for small daily gatherings",
    ],
    locationDescription:
      "Iskandar Puteri is the regional inspiration, not an actual address. This fictional scheme makes no claims about nearby facilities or travel times.",
    fictional: true,
  },
] as const satisfies readonly SyntheticProperty[];

export function findProperty(slug: string): SyntheticProperty | undefined {
  return properties.find((property) => property.slug === slug);
}

export function formatFloorArea(value: number): string {
  return `${new Intl.NumberFormat("en-MY").format(value)} sq ft`;
}
