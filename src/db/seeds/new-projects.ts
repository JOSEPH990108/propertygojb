// src\db\seeds\new-projects.ts
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';

// 1. Load Environment
const projectDir = process.cwd();
loadEnvConfig(projectDir);

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set.');
}

// 2. Setup DB
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

// --- Helpers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureLookup(tx: any, table: any, data: any[], conflictTarget: any) {
    const map = new Map<string, string>();
    for (const item of data) {
        const [res] = await tx.insert(table).values(item)
            .onConflictDoUpdate({ target: conflictTarget, set: { name: item.name } })
            .returning();
        // Prefer slug, fallback to code, fallback to id
        const key = item.slug || item.code || res.id;
        map.set(key, res.id);
    }
    return map;
}

async function seedNewProjects() {
    console.log('🌱 Seeding New Projects (KSL, Sunway, Ponderosa, MBW)...');

    await db.transaction(async (tx) => {
        // 1. Ensure Categories & Types exist (using existing seed logic references)
        const cats = await tx.query.propertyCategories.findMany();
        // propertyCategories uses `lookupFields` (code + name). Use `code` as key.
        const catMap = new Map(cats.map(c => [c.code, c.id]));
        cats.forEach(c => catMap.set(c.code, c.id));

        const types = await tx.query.propertyTypes.findMany();
        const typeMap = new Map(types.map(t => [t.slug, t.id]));

        const statuses = await tx.query.projectStatuses.findMany();
        const statusMap = new Map(statuses.map(s => [s.code, s.id]));

        const tenures = await tx.query.tenureTypes.findMany();
        const tenureMap = new Map(tenures.map(t => [t.code, t.id]));

        // 2. Ensure New Locations
        const johorState = await tx.query.states.findFirst({
            where: (t, { eq }) => eq(t.slug, 'johor')
        });
        if (!johorState) throw new Error("State 'Johor' not found. Run base seed first.");

        const regions = await tx.query.regions.findMany({
            where: (t, { eq }) => eq(t.stateId, johorState.id)
        });
        const regionMap = new Map(regions.map(r => [r.slug, r.id]));

        const tebrauRegionId = regionMap.get('tebrau-corridor');
        const iskandarRegionId = regionMap.get('iskandar-puteri');
        const jbCityRegionId = regionMap.get('jb-city-centre');

        if (!tebrauRegionId || !iskandarRegionId || !jbCityRegionId) {
             throw new Error("Required regions (Tebrau, Iskandar, JB City) not found.");
        }

        // New Areas to Insert - FIXED Typo for taman-molek
        const newAreas = [
            { name: 'Taman Ponderosa', slug: 'taman-ponderosa', regionId: tebrauRegionId },
            { name: 'Taman Molek', slug: 'taman-molek', regionId: tebrauRegionId },
            { name: 'Wawari', slug: 'wawari', regionId: iskandarRegionId },
            { name: 'Danga Bay', slug: 'danga-bay', regionId: jbCityRegionId }
        ];

        const areaMap = await ensureLookup(tx, schema.areas, newAreas, schema.areas.slug);

        // Ensure we have IDs for all areas, even existing ones
        const allAreas = await tx.query.areas.findMany();
        allAreas.forEach(a => areaMap.set(a.slug, a.id));


        // 3. Ensure Developers
        const newDevelopers = [
            { slug: 'prinsip-alpha', name: 'Prinsip Alpha Sdn. Bhd.', countryCode: '+60' },
            { slug: 'ksl-realty', name: 'KSL Realty', countryCode: '+60' },
            { slug: 'sunway-city-jb', name: 'Sunway City (JB) Sdn Bhd', countryCode: '+60' },
            { slug: 'mb-world-properties', name: 'MB World Properties Sdn Bhd', countryCode: '+60' }
        ];
        const devMap = await ensureLookup(tx, schema.developers, newDevelopers, schema.developers.slug);

        // 4. Ensure Amenities (Common ones)
        const commonAmenities = [
            { slug: 'swimming-pool', name: 'Swimming Pool', icon: 'pool' },
            { slug: 'gymnasium', name: 'Gymnasium', icon: 'dumbbell' },
            { slug: 'playground', name: 'Playground', icon: 'seesaw' },
            { slug: 'clubhouse', name: 'Clubhouse', icon: 'house' },
            { slug: '24-hour-security', name: '24-Hour Security', icon: 'shield' },
            { slug: 'bbq-area', name: 'BBQ Area', icon: 'fire' },
            { slug: 'jogging-track', name: 'Jogging Track', icon: 'run' },
            { slug: 'multipurpose-hall', name: 'Multipurpose Hall', icon: 'building' }
        ];
        const amenityMap = await ensureLookup(tx, schema.amenities, commonAmenities, schema.amenities.slug);

        // --- Helper: Link Amenities ---
        const linkAmenities = async (projectId: string, slugs: string[]) => {
            const values = slugs.map(slug => {
                const amenityId = amenityMap.get(slug);
                if (!amenityId) console.warn(`⚠️ Amenity '${slug}' not found for project linking.`);
                return amenityId ? { projectId, amenityId } : null;
            }).filter(Boolean); // Remove nulls

            if (values.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await tx.insert(schema.projectAmenities).values(values as any)
                    .onConflictDoNothing();
            }
        };

        // --- PROJECTS ---

        const getDev = (s: string) => devMap.get(s);
        const getArea = (s: string) => areaMap.get(s);
        const getStatus = (c: string) => statusMap.get(c);
        const getFreehold = () => tenureMap.get('FREEHOLD');
        const getHighRise = () => catMap.get('high-rise') || catMap.get('HIGH_RISE');
        const getLanded = () => catMap.get('landed') || catMap.get('LANDED');
        const getServicedApt = () => typeMap.get('serviced-apartment');
        const getTerrace = () => typeMap.get('terrace-house');

        // A. Ponderosa Regency
        console.log('... Ponderosa Regency');
        const [ponderosa] = await tx.insert(schema.projects).values({
            slug: 'ponderosa-regency',
            name: 'Ponderosa Regency',
            developerId: getDev('prinsip-alpha')!,
            propertyCategoryId: getHighRise(),
            propertyTypeId: getServicedApt(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('UNDER_CONSTRUCTION'),
            areaId: getArea('taman-ponderosa'),
            regionId: tebrauRegionId,
            address: 'Taman Ponderosa, Johor Bahru',
            totalUnits: 1132,
            isPublished: true,
            launchYear: 2024,
            bookingFee: '1000.00',
            maintenanceFeePerSqft: '0.35' // Estimated
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { name: 'Ponderosa Regency' } }).returning();

        await tx.insert(schema.projectLayouts).values([
            { projectId: ponderosa.id, code: 'Type A', name: 'Studio', builtUpSqft: '532', bedrooms: 0, bathrooms: 1 },
            { projectId: ponderosa.id, code: 'Type A1', name: '1-Bedroom', builtUpSqft: '598', bedrooms: 1, bathrooms: 1 },
            { projectId: ponderosa.id, code: 'Type B', name: '2-Bedroom', builtUpSqft: '681', bedrooms: 2, bathrooms: 2 },
            { projectId: ponderosa.id, code: 'Type C', name: '2-Bedroom Large', builtUpSqft: '971', bedrooms: 2, bathrooms: 2 },
            { projectId: ponderosa.id, code: 'Type D', name: '2-Bedroom Corner', builtUpSqft: '1064', bedrooms: 2, bathrooms: 2 },
        ]).onConflictDoNothing();

        await linkAmenities(ponderosa.id, ['swimming-pool', 'gymnasium', 'playground', 'bbq-area', '24-hour-security', 'multipurpose-hall']);


        // B. Sunway Lakehills
        console.log('... Sunway Lakehills');
        const [sunway] = await tx.insert(schema.projects).values({
            slug: 'sunway-lakehills',
            name: 'Sunway Lakehills',
            developerId: getDev('sunway-city-jb')!,
            propertyCategoryId: getHighRise(),
            propertyTypeId: getServicedApt(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('NEW_LAUNCH'),
            areaId: getArea('taman-ponderosa'), // Closest area match
            regionId: tebrauRegionId,
            address: 'Persiaran Lenang Utama, Sunway Bukit Lenang',
            totalUnits: 1200,
            isPublished: true,
            launchYear: 2025
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { name: 'Sunway Lakehills' } }).returning();

        await tx.insert(schema.projectLayouts).values([
            { projectId: sunway.id, code: 'Type A', name: '2-Bedroom', builtUpSqft: '694', bedrooms: 2, bathrooms: 2 },
            { projectId: sunway.id, code: 'Type B', name: '3-Bedroom', builtUpSqft: '892', bedrooms: 3, bathrooms: 2 },
            { projectId: sunway.id, code: 'Type D', name: '4-Bedroom', builtUpSqft: '1182', bedrooms: 4, bathrooms: 2 },
        ]).onConflictDoNothing();

        await linkAmenities(sunway.id, ['swimming-pool', 'gymnasium', 'playground', 'clubhouse', '24-hour-security', 'jogging-track']);


        // C. KSL Riveria Garden
        console.log('... KSL Riveria Garden');
        const [riveria] = await tx.insert(schema.projects).values({
            slug: 'ksl-riveria-garden',
            name: 'KSL Riveria Garden @ Wawari',
            developerId: getDev('ksl-realty')!,
            propertyCategoryId: getLanded(),
            propertyTypeId: getTerrace(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('NEW_LAUNCH'),
            areaId: getArea('wawari'),
            regionId: iskandarRegionId,
            address: 'Wawari, Gelang Patah',
            isPublished: true,
            launchYear: 2024
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { name: 'KSL Riveria Garden @ Wawari' } }).returning();

        await tx.insert(schema.projectLayouts).values([
            { projectId: riveria.id, code: 'Type A', name: '2-Storey Terrace', builtUpSqft: '2000', bedrooms: 4, bathrooms: 4 },
        ]).onConflictDoNothing();

        await linkAmenities(riveria.id, ['clubhouse', 'playground', '24-hour-security', 'jogging-track']);


        // D. KSL Riverhaus
        console.log('... KSL Riverhaus');
        const [riverhaus] = await tx.insert(schema.projects).values({
            slug: 'ksl-riverhaus',
            name: 'KSL Riverhaus',
            developerId: getDev('ksl-realty')!,
            propertyCategoryId: getHighRise(),
            propertyTypeId: getServicedApt(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('UPCOMING'),
            areaId: getArea('wawari'),
            regionId: iskandarRegionId,
            address: 'Wawari, Gelang Patah',
            isPublished: true,
            launchYear: 2025
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { name: 'KSL Riverhaus' } }).returning();

        await tx.insert(schema.projectLayouts).values([
            { projectId: riverhaus.id, code: 'Type A', name: 'Studio (Est.)', builtUpSqft: '500', bedrooms: 1, bathrooms: 1 },
            { projectId: riverhaus.id, code: 'Type B', name: '2-Bedroom (Est.)', builtUpSqft: '800', bedrooms: 2, bathrooms: 2 },
        ]).onConflictDoNothing();

        await linkAmenities(riverhaus.id, ['swimming-pool', 'gymnasium', '24-hour-security']);


        // E. KSL Lakeview
        console.log('... KSL Lakeview');
        const [lakeview] = await tx.insert(schema.projects).values({
            slug: 'ksl-lakeview',
            name: 'KSL Lakeview (Ponderosa)',
            developerId: getDev('ksl-realty')!,
            propertyCategoryId: getHighRise(),
            propertyTypeId: getServicedApt(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('NEW_LAUNCH'),
            areaId: getArea('taman-molek'),
            regionId: tebrauRegionId,
            address: 'Taman Molek / Ponderosa Area',
            isPublished: true,
            maintenanceFeePerSqft: '0.11'
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { name: 'KSL Lakeview (Ponderosa)' } }).returning();

        await tx.insert(schema.projectLayouts).values([
            { projectId: lakeview.id, code: 'Type 1-Bed', name: '1-Bedroom', builtUpSqft: '450', bedrooms: 1, bathrooms: 1 },
            { projectId: lakeview.id, code: 'Type 2-Bed', name: '2-Bedroom', builtUpSqft: '600', bedrooms: 2, bathrooms: 2 },
            { projectId: lakeview.id, code: 'Type 3-Bed', name: '3-Bedroom', builtUpSqft: '800', bedrooms: 3, bathrooms: 2 },
        ]).onConflictDoNothing();

        await linkAmenities(lakeview.id, ['swimming-pool', 'gymnasium', 'playground', '24-hour-security']);


        // F. MBW Bay (Florian) - Update/Enrich
        console.log('... MBW Bay (Enrichment)');
        const [mbwBay] = await tx.insert(schema.projects).values({
            slug: 'mbw-bay-florian',
            name: 'MBW Bay (Florian Residences)',
            developerId: getDev('mb-world-properties')!,
            propertyCategoryId: getHighRise(),
            propertyTypeId: getServicedApt(),
            tenureTypeId: getFreehold()!,
            projectStatusId: getStatus('UNDER_CONSTRUCTION'),
            areaId: getArea('danga-bay'),
            regionId: jbCityRegionId,
            address: 'Persiaran Abu Bakar Sultan, Johor Bahru',
            totalUnits: 2003,
            isPublished: true
        }).onConflictDoUpdate({ target: schema.projects.slug, set: { totalUnits: 2003 } }).returning();

        if (mbwBay) {
             await tx.insert(schema.projectLayouts).values([
                { projectId: mbwBay.id, code: 'Type A (T7/8)', name: '1-Bedroom', builtUpSqft: '496', bedrooms: 1, bathrooms: 1 },
                { projectId: mbwBay.id, code: 'Type A6 (T4-6)', name: '1-Bedroom Large', builtUpSqft: '639', bedrooms: 1, bathrooms: 1 },
                { projectId: mbwBay.id, code: 'Type B1 (T7/8)', name: '2-Bedroom', builtUpSqft: '826', bedrooms: 2, bathrooms: 2 },
                { projectId: mbwBay.id, code: 'Type B14 (T4-6)', name: '2+1 Bedroom', builtUpSqft: '1029', bedrooms: 3, bathrooms: 2 },
                { projectId: mbwBay.id, code: 'Type C1 (T7/8)', name: '2+1 Bedroom Corner', builtUpSqft: '925', bedrooms: 3, bathrooms: 2 },
                { projectId: mbwBay.id, code: 'Type D1 (T7/8)', name: '2+1 Bedroom Deluxe', builtUpSqft: '1071', bedrooms: 3, bathrooms: 2 },
            ]).onConflictDoNothing();

            await linkAmenities(mbwBay.id, ['swimming-pool', 'gymnasium', 'playground', 'bbq-area', '24-hour-security']);
        }

        console.log('✅ New Projects Seed Complete!');
    });
}

seedNewProjects()
  .then(async () => { await queryClient.end(); process.exit(0); })
  .catch(async (err) => { console.error('❌ Seed Failed:', err); await queryClient.end(); process.exit(1); });
