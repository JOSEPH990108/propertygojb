import {
  propertyAreas,
  propertyTypes,
  type PropertyArea,
  type PropertyType,
  type SyntheticProperty,
} from "./fixtures";

export const sortOptions = [
  { value: "featured", label: "Editorial order" },
  { value: "name", label: "Name: A to Z" },
  { value: "size-asc", label: "Floor area: smaller first" },
  { value: "size-desc", label: "Floor area: larger first" },
] as const;

export type PropertySort = (typeof sortOptions)[number]["value"];
export interface DiscoveryFilters {
  type: PropertyType | "";
  area: PropertyArea | "";
  sort: PropertySort;
}
export type DiscoveryQuery = Record<string, string | string[] | undefined>;

function readOption<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
  label: string,
  issues: string[],
): T {
  if (value === undefined || value === "") return fallback;
  const match = allowed.find((option) => option === value);
  if (match !== undefined) return match;
  issues.push(`${label} was not recognized and has been reset.`);
  return fallback;
}

export function parseDiscoveryQuery(query: DiscoveryQuery): {
  filters: DiscoveryFilters;
  issues: string[];
} {
  const issues: string[] = [];
  return {
    filters: {
      type: readOption(
        query.type,
        ["", ...propertyTypes],
        "",
        "Property type",
        issues,
      ),
      area: readOption(query.area, ["", ...propertyAreas], "", "Area", issues),
      sort: readOption(
        query.sort,
        sortOptions.map((option) => option.value),
        "featured",
        "Sort order",
        issues,
      ),
    },
    issues,
  };
}

export function discoverProperties(
  source: readonly SyntheticProperty[],
  filters: DiscoveryFilters,
): SyntheticProperty[] {
  const matching = source.filter(
    (property) =>
      (!filters.type || property.type === filters.type) &&
      (!filters.area || property.area === filters.area),
  );
  return matching.sort((a, b) => {
    let comparison: number;
    switch (filters.sort) {
      case "name":
        comparison = a.name.localeCompare(b.name, "en-MY");
        break;
      case "size-asc":
        comparison = a.floorAreaSqFt - b.floorAreaSqFt;
        break;
      case "size-desc":
        comparison = b.floorAreaSqFt - a.floorAreaSqFt;
        break;
      default:
        comparison = a.featuredOrder - b.featuredOrder;
    }
    return comparison || a.slug.localeCompare(b.slug, "en-MY");
  });
}
