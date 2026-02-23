// src\app\actions\property-actions.ts
'use server';

import { db } from '@/db';
import {
  projects,
  propertyCategories,
  propertyTypes,
  states,
  amenities,
  tags,
  areas,
  regions,
  projectLayouts,
  files,
  projectAmenities,
  projectTags
} from '@/db/schema';
import { eq, and, asc, inArray, desc, sql } from 'drizzle-orm';
// --- Types ---

export interface PropertyLookups {
  categories: typeof propertyCategories.$inferSelect[];
  types: typeof propertyTypes.$inferSelect[];
  states: typeof states.$inferSelect[];
  regions: typeof regions.$inferSelect[];
  areas: typeof areas.$inferSelect[];
  amenities: typeof amenities.$inferSelect[];
  tags: typeof tags.$inferSelect[];
}

export interface PublicProject {
  id: string;
  slug: string;
  name: string;
  displayName: string | null;
  tagline: string | null;
  description: string | null;
  address: string | null;
  state: string | null;
  developer: {
    name: string;
    logo: string | null;
  };
  category: string;
  type: string;
  status: string;
  price: {
    min: number | null;
    max: number | null;
  };
  specs: {
    minBedrooms: number | null;
    maxBedrooms: number | null;
    minBathrooms: number | null;
    maxBathrooms: number | null;
    minSqft: number | null;
    maxSqft: number | null;
    totalUnits: number | null;
    tenure: string | null;
  };
  images: {
    featured: string | null;
    gallery: string[];
  };
  amenities: string[];
  tags: string[];
  location: {
    lat: string | null;
    lng: string | null;
    area: string;
    region: string;
    state: string;
  };
  isHotDeal: boolean;
  launchYear: number | null;
}

export interface PropertyData {
  lookups: PropertyLookups;
  projects: PublicProject[];
}

export interface GetPropertiesParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  typeId?: string;
  stateId?: string;
  regionId?: string;
  areaId?: string;
  minPrice?: number;
  maxPrice?: number;
  isHotDeal?: boolean;
}

export interface GetPropertiesResult {
  data: PublicProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Helper Functions ---

async function resolveFiles(fileIds: Set<string>) {
  if (fileIds.size === 0) return new Map<string, typeof files.$inferSelect>();
  const allFiles = await db.query.files.findMany({
    where: inArray(files.id, Array.from(fileIds))
  });
  return new Map(allFiles.map(f => [f.id, f]));
}

async function resolveLocations() {
    const [statesData, regionsData, areasData] = await Promise.all([
        db.query.states.findMany(),
        db.query.regions.findMany(),
        db.query.areas.findMany(),
    ]);

    const stateMap = new Map(statesData.map(s => [s.id, s.name]));
    const regionMap = new Map(regionsData.map(r => [r.id, { name: r.name, stateId: r.stateId }]));
    const areaMap = new Map(areasData.map(a => [a.id, { name: a.name, regionId: a.regionId }]));

    return { stateMap, regionMap, areaMap };
}

export async function getGlobalLookups(): Promise<PropertyLookups> {
  const [
    categories,
    types,
    statesData,
    regionsData,
    areasData,
    amenitiesData,
    tagsData
  ] = await Promise.all([
    db.query.propertyCategories.findMany({
      where: eq(propertyCategories.isActive, true),
      orderBy: asc(propertyCategories.sortOrder)
    }),
    db.query.propertyTypes.findMany({
      where: eq(propertyTypes.isActive, true),
      orderBy: asc(propertyTypes.sortOrder)
    }),
    db.query.states.findMany(),
    db.query.regions.findMany(),
    db.query.areas.findMany(),
    db.query.amenities.findMany({
      where: eq(amenities.isActive, true),
      orderBy: asc(amenities.name)
    }),
    db.query.tags.findMany({
      where: eq(tags.isActive, true),
      orderBy: asc(tags.name)
    }),
  ]);

  return {
    categories,
    types,
    states: statesData,
    regions: regionsData,
    areas: areasData,
    amenities: amenitiesData,
    tags: tagsData
  };
}

// --- Actions ---

export async function getProperties({
  page = 1,
  limit = 9,
  categoryId,
  typeId,
  stateId,
  regionId,
  areaId,
  isHotDeal
}: GetPropertiesParams = {}): Promise<GetPropertiesResult> {
  try {
    const offset = (page - 1) * limit;

    const conditions: any[] = [
      eq(projects.isPublished, true),
    ];

    if (categoryId) conditions.push(eq(projects.propertyCategoryId, categoryId));
    if (typeId) conditions.push(eq(projects.propertyTypeId, typeId));
    if (regionId) conditions.push(eq(projects.regionId, regionId));
    if (areaId) conditions.push(eq(projects.areaId, areaId));

    // If caller requested state-level filtering, expand regions
    if (stateId && !regionId && !areaId) {
       const regionsInState = await db.query.regions.findMany({
           where: eq(regions.stateId, stateId),
           columns: { id: true }
       });
       const regionIds = regionsInState.map(r => r.id);
       if (regionIds.length > 0) {
           conditions.push(inArray(projects.regionId, regionIds));
       } else {
           return { data: [], total: 0, page, limit, totalPages: 0 };
       }
    }

    const whereClause = and(...conditions);

    const totalRes = await db.select({ count: sql<number>`count(*)` }).from(projects).where(whereClause);
    const total = Number(totalRes[0].count);

    const projectsData = await db.query.projects.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(projects.createdAt)],
      with: {
        developer: true,
        category: true,
        type: true,
        status: true,
      }
    });

    if (projectsData.length === 0) {
        return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const projectIds = projectsData.map(p => p.id);
    // Load join rows for amenities and tags instead of relying on relation inference
    const projectAmenityRows = projectIds.length
      ? await db.query.projectAmenities.findMany({ where: inArray(projectAmenities.projectId, projectIds) })
      : [];
    const projectTagRows = projectIds.length
      ? await db.query.projectTags.findMany({ where: inArray(projectTags.projectId, projectIds) })
      : [];
    const layoutsData = await db.query.projectLayouts.findMany({
        where: inArray(projectLayouts.projectId, projectIds)
    });

    const layoutsMap = new Map<string, typeof projectLayouts.$inferSelect[]>();
    layoutsData.forEach(l => {
      const list = layoutsMap.get(l.projectId) || [];
      list.push(l);
      layoutsMap.set(l.projectId, list);
    });

    const fileIds = new Set<string>();
    projectsData.forEach(p => {
      if (p.featuredFileId) fileIds.add(p.featuredFileId);
      if (p.developer?.logoFileId) fileIds.add(p.developer.logoFileId);
    });
    const fileMap = await resolveFiles(fileIds);
    const { areaMap, regionMap, stateMap } = await resolveLocations();

    const allAmenities = await db.query.amenities.findMany();
    const amenityMap = new Map(allAmenities.map(a => [a.id, a.name]));
    const allTags = await db.query.tags.findMany();
    const tagMap = new Map(allTags.map(t => [t.id, t.name]));

    const getUrl = (id: string | null) => id ? fileMap.get(id)?.url ?? null : null;

    const publicProjects: PublicProject[] = projectsData.map(p => {
      const layouts = layoutsMap.get(p.id) || [];
      const bedrooms = layouts.map(l => l.bedrooms);
      const bathrooms = layouts.map(l => l.bathrooms);
      const builtUps = layouts.map(l => Number(l.builtUpSqft));

      const area = areaMap.get(p.areaId ?? '') || { name: "", regionId: "" };
      const region = regionMap.get(p.regionId ?? '') || { name: "", stateId: "" };
      const stateName = stateMap.get(region.stateId || "") || "";

      const projectAmenityNames = projectAmenityRows
        .filter(r => r.projectId === p.id)
        .map(r => amenityMap.get(r.amenityId))
        .filter((name): name is string => !!name);

      const projectTagNames = projectTagRows
        .filter(r => r.projectId === p.id)
        .map(r => tagMap.get(r.tagId))
        .filter((name): name is string => !!name);

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        displayName: p.displayName,
        tagline: p.description,
        description: p.description,
        address: p.address,
        state: stateName,
        developer: {
          name: p.developer?.name || "",
          logo: getUrl(p.developer?.logoFileId || null),
        },
        category: p.category?.name || "",
        type: p.type?.name || "",
        status: p.status?.name || "",
        price: {
          min: null,
          max: null,
        },
        specs: {
          minBedrooms: bedrooms.length ? Math.min(...bedrooms) : null,
          maxBedrooms: bedrooms.length ? Math.max(...bedrooms) : null,
          minBathrooms: bathrooms.length ? Math.min(...bathrooms) : null,
          maxBathrooms: bathrooms.length ? Math.max(...bathrooms) : null,
          minSqft: builtUps.length ? Math.min(...builtUps) : null,
          maxSqft: builtUps.length ? Math.max(...builtUps) : null,
          totalUnits: p.totalUnits,
          tenure: p.tenureTypeId ? "Freehold" : "Leasehold",
        },
        images: {
          featured: getUrl(p.featuredFileId || null),
          gallery: [],
        },
        amenities: projectAmenityNames,
        tags: projectTagNames,
        location: {
          lat: p.latitude?.toString() ?? null,
          lng: p.longitude?.toString() ?? null,
          area: area.name,
          region: region.name,
          state: stateName,
        },
        isHotDeal: !!p.isPublished,
        launchYear: p.launchYear,
      };
    });

    return {
      data: publicProjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
   } catch (e) {
       console.error("Failed to fetch properties:", e);
       return { data: [], total: 0, page, limit, totalPages: 0 };
   }

}

export async function getPropertyBySlug(slug: string): Promise<PublicProject | null> {
    try {
        const project = await db.query.projects.findFirst({
          where: eq(projects.slug, slug),
          with: {
            developer: true,
            category: true,
            type: true,
            status: true,
          }
        });

        if (!project) return null;

        const layouts = await db.query.projectLayouts.findMany({
            where: eq(projectLayouts.projectId, project.id)
        });

        const fileIds = new Set<string>();
        if (project.featuredFileId) fileIds.add(project.featuredFileId);
        if (project.developer?.logoFileId) fileIds.add(project.developer.logoFileId);

        const fileMap = await resolveFiles(fileIds);
        const { areaMap, regionMap, stateMap } = await resolveLocations();

        const amenityRows = await db.query.projectAmenities.findMany({ where: eq(projectAmenities.projectId, project.id) });
        const tagRows = await db.query.projectTags.findMany({ where: eq(projectTags.projectId, project.id) });

        const amenityIds = amenityRows.map(r => r.amenityId);
        const tagIds = tagRows.map(r => r.tagId);

        const [amenitiesData, tagsData] = await Promise.all([
          amenityIds.length ? db.query.amenities.findMany({ where: inArray(amenities.id, amenityIds) }) : [],
          tagIds.length ? db.query.tags.findMany({ where: inArray(tags.id, tagIds) }) : []
        ]);

        const getUrl = (id: string | null) => id ? fileMap.get(id)?.url ?? null : null;

        const area = areaMap.get(project.areaId ?? '') || { name: "", regionId: "" };
        const region = regionMap.get(project.regionId ?? '') || { name: "", stateId: "" };
        const stateName = stateMap.get(region.stateId || "") || "";

        const bedrooms = layouts.map(l => l.bedrooms);
        const bathrooms = layouts.map(l => l.bathrooms);
        const builtUps = layouts.map(l => Number(l.builtUpSqft));

        return {
          id: project.id,
          slug: project.slug,
          name: project.name,
          displayName: project.displayName,
          tagline: project.description,
          description: project.description,
          address: project.address,
          state: stateName,
          developer: {
            name: project.developer.name,
            logo: getUrl(project.developer.logoFileId),
          },
          category: project.category?.name || "",
          type: project.type?.name || "",
          status: project.status?.name || "",
          price: { min: null, max: null },
          specs: {
            minBedrooms: bedrooms.length ? Math.min(...bedrooms) : null,
            maxBedrooms: bedrooms.length ? Math.max(...bedrooms) : null,
            minBathrooms: bathrooms.length ? Math.min(...bathrooms) : null,
            maxBathrooms: bathrooms.length ? Math.max(...bathrooms) : null,
            minSqft: builtUps.length ? Math.min(...builtUps) : null,
            maxSqft: builtUps.length ? Math.max(...builtUps) : null,
            totalUnits: project.totalUnits,
            tenure: null,
          },
          images: {
            featured: getUrl(project.featuredFileId),
            gallery: [],
          },
          amenities: amenitiesData.map(a => a.name),
          tags: tagsData.map(t => t.name),
          location: {
            lat: project.latitude?.toString() ?? null,
            lng: project.longitude?.toString() ?? null,
            area: area.name,
            region: region.name,
            state: stateName,
          },
          isHotDeal: !!project.isPublished,
          launchYear: project.launchYear,
        };
    } catch (e) {
        console.error("Failed to fetch property by slug:", e);
        return null;
    }
}

export async function getInitialPropertyData(): Promise<PropertyData> {
    const lookups = await getGlobalLookups();
    return {
        lookups,
        projects: []
    };
}
