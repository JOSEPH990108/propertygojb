// src\db\seed.ts
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// removed unused 'eq' import
import * as schema from './schema';

// 1. Dynamically load environment
const projectDir = process.cwd();
loadEnvConfig(projectDir);

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set.');
}

// 2. Setup
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

// 3. Data: Core Lookup Definitions
const LOOKUPS = {
  // ROLES -> Uppercase
  roles: [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'System Owner' },
    { code: 'ADMIN', name: 'Admin', description: 'Manage System Info' },
    { code: 'AGENT', name: 'Agent', description: 'Verified Property Agent' },
    { code: 'CUSTOMER', name: 'Customer', description: 'Registered Customer' },
  ],
  // CATEGORIES -> Uppercase Code, Lowercase Slug
  propertyCategories: [
    { code: 'LANDED', slug: 'landed', name: 'Landed', icon: 'home', color: '#0EA5A4' },
    { code: 'HIGH_RISE', slug: 'high-rise', name: 'High-Rise', icon: 'building', color: '#2563EB' },
    { code: 'COMMERCIAL', slug: 'commercial', name: 'Commercial', icon: 'store', color: '#F97316' },
    { code: 'MIXED', slug: 'mixed', name: 'Mixed Development', icon: 'grid', color: '#7C3AED' },
  ],
  // TYPES -> Uppercase Code, Lowercase Slug
  propertyTypes: [
    { code: 'CONDO', slug: 'condominium', name: 'Condominium', categorySlug: 'high-rise' },
    { code: 'SERVICED_APT', slug: 'serviced-apartment', name: 'Serviced Apartment', categorySlug: 'high-rise' },
    { code: 'FLAT', slug: 'flat', name: 'Flat / Apartment', categorySlug: 'high-rise' },
    { code: 'BUNGALOW', slug: 'bungalow', name: 'Bungalow', categorySlug: 'landed' },
    { code: 'SEMI_D', slug: 'semi-detached', name: 'Semi-D', categorySlug: 'landed' },
    { code: 'TERRACE', slug: 'terrace-house', name: 'Terrace House', categorySlug: 'landed' },
    { code: 'TOWNHOUSE', slug: 'townhouse', name: 'Townhouse', categorySlug: 'landed' },
    { code: 'SHOP_LOT', slug: 'shop-lot', name: 'Shop Lot', categorySlug: 'commercial' },
    { code: 'RETAIL', slug: 'retail-lot', name: 'Retail Lot', categorySlug: 'commercial' },
  ],
  // ENUMS (Use 'code') -> Uppercase
  projectStatuses: [
    { code: 'NEW_LAUNCH', name: 'New Launch' },
    { code: 'UNDER_CONSTRUCTION', name: 'Under Construction' },
    { code: 'COMPLETED', name: 'Completed' },
    { code: 'UPCOMING', name: 'Upcoming' },
    { code: 'SUBSALE', name: 'Subsale' },
    { code: 'FULLY_SOLD', name: 'Fully Sold' },
  ],
  bookingStatuses: [
    { code: 'AVAILABLE', name: 'Available', color: 'green' },
    { code: 'RESERVED', name: 'Reserved', color: 'yellow' },
    { code: 'SOLD', name: 'Sold', color: 'red' },
    { code: 'CANCELLED', name: 'Cancelled', color: 'gray' },
  ],
  mediaTypes: [
    { code: 'IMAGE', name: 'Image' }, 
    { code: 'VIDEO', name: 'Video' }, 
    { code: 'DOCUMENT', name: 'Document' }
  ],
  tenureTypes: [
    { code: 'FREEHOLD', name: 'Freehold' }, 
    { code: 'LEASEHOLD_99', name: 'Leasehold' }, 
    { code: 'LEASEHOLD_60', name: 'Leasehold 60' }
  ],
  lotTypes: [
    { code: 'BUMIPUTERA', name: 'Bumiputera' }, 
    { code: 'NON_BUMIPUTERA', name: 'Non-Bumiputera' }, 
    { code: 'INTERNATIONAL', name: 'International' },
    { code: 'MIXED', name: 'Mixed' }
  ],
  buyerTypes: [
    { code: 'MALAYSIAN_CITIZEN', name: 'Citizen' }, 
    { code: 'FOREIGNER', name: 'Foreigner' }, 
    { code: 'COMPANY_MALAYSIAN', name: 'Company' }
  ],
  promotionTypes: [
    { code: 'EARLY_BIRD_DISCOUNT', name: 'Early Bird' }, 
    { code: 'ZERO_DOWNPAYMENT', name: 'Zero Downpayment' },
    { code: 'FREE_LEGAL_FEE', name: 'Free Legal Fee' }, 
    { code: 'FREE_STAMP_DUTY', name: 'Free Stamp Duty' }
  ],
  appointmentStatuses: [
    { code: 'PENDING', name: 'Pending', slug: 'pending', description: 'User requested appointment' },
    { code: 'CONFIRMED', name: 'Confirmed', slug: 'confirmed', description: 'Agent confirmed appointment' },
    { code: 'COMPLETED', name: 'Completed', slug: 'completed', description: 'Visit verified via QR scan' },
    { code: 'NO_SHOW', name: 'No Show', slug: 'no-show', description: 'User failed to attend' },
    { code: 'CANCELLED', name: 'Cancelled', slug: 'cancelled', description: 'Cancelled by user' },
    { code: 'REJECTED', name: 'Rejected', slug: 'rejected', description: 'Rejected by agent' },
  ],
  // Amenities & Tags (Use 'slug') -> Slugs remain lowercase
  amenities: [
    { slug: 'swimming-pool', name: 'Swimming Pool' },
    { slug: 'gymnasium', name: 'Gymnasium' },
    { slug: '24-7-security', name: '24/7 Security' },
    { slug: 'playground', name: 'Playground' },
    { slug: 'bbq-area', name: 'BBQ Area' }
  ],
  tags: [
    { slug: 'near-ciq', name: 'Near CIQ' },
    { slug: 'near-rts', name: 'Near RTS' },
    { slug: 'freehold', name: 'Freehold' },
    { slug: 'sea-view', name: 'Sea View' }
  ]
};

// 4. Data: Johor Locations
const LOCATIONS_DATA = [
  {
    state: 'Johor',
    slug: 'johor',
    country: 'Malaysia',
    regions: [
      {
        name: 'Johor Bahru City Centre',
        slug: 'jb-city-centre',
        areas: [
          { name: 'JB Sentral', slug: 'jb-sentral' },
          { name: 'Bukit Chagar', slug: 'bukit-chagar' }, 
          { name: 'Komtar / JBCC', slug: 'komtar-jbcc' },
          { name: 'Danga Bay', slug: 'danga-bay' }, 
          { name: 'Stulang', slug: 'stulang' },
          { name: 'Jalan Wong Ah Fook', slug: 'jalan-wong-ah-fook' },
          { name: 'Jalan Abdul Samad', slug: 'jalan-abdul-samad' }, 
          { name: 'Kolam Ayer', slug: 'kolam-ayer' }, 
          { name: 'Taman Abad', slug: 'taman-abad' }
        ]
      },
      {
        name: 'Iskandar Puteri',
        slug: 'iskandar-puteri',
        areas: [
          { name: 'Medini', slug: 'medini' },
          { name: 'Puteri Harbour', slug: 'puteri-harbour' },
          { name: 'Bukit Indah', slug: 'bukit-indah' },
          { name: 'Eco Botanic', slug: 'eco-botanic' },
          { name: 'East Ledang', slug: 'east-ledang' },
          { name: 'Gelang Patah', slug: 'gelang-patah' }
        ]
      },
      {
        name: 'Tebrau Corridor',
        slug: 'tebrau-corridor',
        areas: [
          { name: 'Mount Austin', slug: 'mount-austin' },
          { name: 'Austin Heights', slug: 'austin-heights' },
          { name: 'Desa Tebrau', slug: 'desa-tebrau' },
          { name: 'Setia Indah', slug: 'setia-indah' },
          { name: 'Taman Daya', slug: 'taman-daya' },
          { name: 'Larkin', slug: 'larkin' }
        ]
      },
      {
        name: 'Skudai & North JB',
        slug: 'skudai-north-jb',
        areas: [
          { name: 'Skudai Town', slug: 'skudai-town' },
          { name: 'Taman Universiti', slug: 'taman-universiti' },
          { name: 'Sutera Utama', slug: 'sutera-utama' },
          { name: 'Tampoi', slug: 'tampoi' },
          { name: 'Kempas', slug: 'kempas' },
          { name: 'Mukim Pulai', slug: 'mukim-pulai' }, 
          { name: 'Kangkar Pulai', slug: 'kangkar-pulai' }
        ]
      },
      {
        name: 'Pasir Gudang Corridor',
        slug: 'pasir-gudang-corridor',
        areas: [
          { name: 'Permas Jaya', slug: 'permas-jaya' },
          { name: 'Masai', slug: 'masai' },
          { name: 'Bandar Seri Alam', slug: 'bandar-seri-alam' }
        ]
      },
      {
        name: 'Kulai & Senai',
        slug: 'kulai-senai',
        areas: [
          { name: 'Kulai', slug: 'kulai' },
          { name: 'Senai', slug: 'senai' },
          { name: 'Indahpura', slug: 'indahpura' }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('🌱 Starting Robust Seed (Standardized Uppercase Codes)...');

  await db.transaction(async (tx) => {
    // --- Helper: Robust Seed Simple ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function seedSimple(table: any, data: any[]) {
        const map = new Map();
        
        const targetCol = table.slug ? table.slug : table.code;
        if (!targetCol) throw new Error(`Table ${table._?.name} has neither slug nor code.`);

        const hasSlug = !!table.slug;
        const hasCode = !!table.code;

        for (const d of data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = { ...d };
            if (!hasSlug) delete payload.slug;
            if (!hasCode) delete payload.code;

            const [res] = await tx.insert(table).values(payload)
                .onConflictDoUpdate({ 
                    target: targetCol, 
                    set: { name: d.name } 
                })
                .returning();
            
            if (d.slug) map.set(d.slug, res.id);
            if (d.code) map.set(d.code, res.id);
        }
        return map;
    }

    // --- A. Roles & Lookups ---
    await seedSimple(schema.roles, LOOKUPS.roles);
    const statusMap = await seedSimple(schema.projectStatuses, LOOKUPS.projectStatuses);
    await seedSimple(schema.bookingStatuses, LOOKUPS.bookingStatuses);
    await seedSimple(schema.tenureTypes, LOOKUPS.tenureTypes);
    await seedSimple(schema.mediaTypes, LOOKUPS.mediaTypes);
    await seedSimple(schema.buyerTypes, LOOKUPS.buyerTypes);
    await seedSimple(schema.lotTypes, LOOKUPS.lotTypes);
    await seedSimple(schema.promotionTypes, LOOKUPS.promotionTypes);
    await seedSimple(schema.appointmentStatuses, LOOKUPS.appointmentStatuses);
    
    await seedSimple(schema.amenities, LOOKUPS.amenities);
    await seedSimple(schema.tags, LOOKUPS.tags);

    // --- B. Categories & Types ---
    console.log('... Seeding Categories & Types');
    const catMap = await seedSimple(schema.propertyCategories, LOOKUPS.propertyCategories);
    
    const typeMap = new Map();
    for (const t of LOOKUPS.propertyTypes) {
      const catId = catMap.get(t.categorySlug);
      if (catId) {
        const payload = { 
            slug: t.slug, 
            code: t.code,
            name: t.name, 
            categoryId: catId 
        };
        const [res] = await tx.insert(schema.propertyTypes).values(payload)
            .onConflictDoUpdate({ target: schema.propertyTypes.slug, set: { name: t.name } }).returning();
        typeMap.set(t.slug, res.id);
      }
    }

    // --- C. Locations ---
    console.log('... Seeding Locations');
    const areaMap = new Map<string, string>();
    const regionMap = new Map<string, string>();

    for (const s of LOCATIONS_DATA) {
      const [state] = await tx.insert(schema.states).values({ name: s.state, slug: s.slug, country: s.country })
          .onConflictDoUpdate({ target: schema.states.slug, set: { name: s.state } }).returning();
      const stateId = state.id;

      for (const r of s.regions) {
        const [region] = await tx.insert(schema.regions).values({ name: r.name, slug: r.slug, stateId })
            .onConflictDoUpdate({ target: schema.regions.slug, set: { name: r.name } }).returning();
        regionMap.set(r.slug, region.id);
        
        for (const a of r.areas) {
            const [area] = await tx.insert(schema.areas).values({ name: a.name, slug: a.slug, regionId: region.id })
              .onConflictDoUpdate({ target: schema.areas.slug, set: { name: a.name } }).returning();
            areaMap.set(a.slug, area.id);
        }
      }
    }

    // --- D. Developers ---
    console.log('... Seeding Developers');
    const developers = [
        { slug: 'mb-world-properties', name: 'MB World Properties Sdn Bhd', countryCode: '+60', isFeatured: true },
        { slug: 'sunway-developer', name: 'Sunway Developer', countryCode: '+60', isFeatured: true },
        { slug: 'ctc-development', name: 'CTC Development Malaysia Sdn Bhd', countryCode: '+60' },
        { slug: 'paragon-urban', name: 'Paragon Urban Sdn Bhd', countryCode: '+60' },
        { slug: 'city-centre-transformation', name: 'City Centre Transformation (JB) Sdn Bhd', countryCode: '+60' }
    ];

    const devMap = new Map();
    for (const d of developers) {
        const [res] = await tx.insert(schema.developers).values(d)
            .onConflictDoUpdate({ target: schema.developers.slug, set: { name: d.name } }).returning();
        devMap.set(d.slug, res.id);
    }

    // --- E. Projects ---
    console.log('... Seeding Projects');

    // --- F. Referral Tiers ---
    console.log('... Seeding Referral Tiers');
    await tx.insert(schema.referralTiers).values([
        { name: 'Bronze', minReferrals: 0, rewardAmount: '10.00', description: 'Standard Reward' },
        { name: 'Silver', minReferrals: 3, rewardAmount: '20.00', description: 'Boost after 3 referrals' },
        { name: 'Gold', minReferrals: 6, rewardAmount: '50.00', description: 'Super boost after 6 referrals' },
    ]).onConflictDoNothing();
    
    // Helper accessors
    const getDev = (slug: string) => devMap.get(slug);
    const getCat = (slug: string) => catMap.get(slug); 
    const getType = (slug: string) => typeMap.get(slug); 
    // UPDATED: Now uses Uppercase codes
    const getStatus = (code: string) => statusMap.get(code); 

    // Retrieve Tenure IDs safely - UPDATED to check Uppercase
    const tenureFreeholdId = (await tx.query.tenureTypes.findFirst({ where: (t, { eq }) => eq(t.code, 'FREEHOLD') }))?.id;
    const tenureLeaseholdId = (await tx.query.tenureTypes.findFirst({ where: (t, { eq }) => eq(t.code, 'LEASEHOLD_99') }))?.id;

    // 1. MBW BAY
    const [mbwBay] = await tx.insert(schema.projects).values({
      slug: 'mbw-bay-florian',
      name: 'MBW Bay (Florian Residences)',
      developerId: getDev('mb-world-properties'),
      propertyCategoryId: getCat('high-rise') || getCat('high_rise'),
      propertyTypeId: getType('serviced-apartment'),
      tenureTypeId: tenureFreeholdId!,
      // UPDATED: Use Uppercase code
      projectStatusId: getStatus('UNDER_CONSTRUCTION'),
      regionId: regionMap.get('jb-city-centre')!,
      areaId: areaMap.get('danga-bay')!, 
      address: 'Persiaran Abu Bakar Sultan, Johor Bahru',
      totalUnits: 2003,
      isPublished: true
    }).onConflictDoNothing().returning();

    if (mbwBay) {
      const [phF1A] = await tx.insert(schema.projectPhases).values({
        projectId: mbwBay.id, 
        name: 'Parcel F1A', 
        phaseCode: 'F1A', 
        completionDate: '2024-12-31'
      }).onConflictDoNothing().returning();

      if(phF1A) await tx.insert(schema.projectTowers).values([
          // Fixed: towerNumber 7 -> "7" (String)
          { projectId: mbwBay.id, phaseId: phF1A.id, towerNumber: "7", name: 'Tower 7', floorCount: 46 },
          { projectId: mbwBay.id, phaseId: phF1A.id, towerNumber: "8", name: 'Tower 8', floorCount: 42 }
      ]).onConflictDoNothing();
      
      const [phF1B] = await tx.insert(schema.projectPhases).values({
        projectId: mbwBay.id, 
        name: 'Parcel F1B', 
        phaseCode: 'F1B', 
        completionDate: '2026-06-30' // Fixed
      }).onConflictDoNothing().returning();

      if(phF1B) await tx.insert(schema.projectTowers).values([
          { projectId: mbwBay.id, phaseId: phF1B.id, towerNumber: "4", name: 'Tower 4', floorCount: 49 },
          { projectId: mbwBay.id, phaseId: phF1B.id, towerNumber: "5", name: 'Tower 5', floorCount: 51 }
      ]).onConflictDoNothing();
    }

    // 2. CTC SKY ONE
    const [ctcSkyOne] = await tx.insert(schema.projects).values({
      slug: 'ctc-sky-one',
      name: 'CTC Sky One',
      developerId: getDev('ctc-development'),
      propertyCategoryId: getCat('high-rise') || getCat('high_rise'),
      propertyTypeId: getType('serviced-apartment'),
      tenureTypeId: tenureFreeholdId!,
      // UPDATED: Use Uppercase code
      projectStatusId: getStatus('NEW_LAUNCH'),
      regionId: regionMap.get('jb-city-centre')!,
      areaId: areaMap.get('bukit-chagar')!,
      address: 'Jalan Bukit Chagar, Johor Bahru',
      totalUnits: 1605,
      isPublished: true
    }).onConflictDoNothing().returning();

    if (ctcSkyOne) {
        const [phMain] = await tx.insert(schema.projectPhases).values({
            projectId: ctcSkyOne.id, name: 'Main Phase', completionDate: '2029-12-31'
        }).onConflictDoNothing().returning();
        if(phMain) await tx.insert(schema.projectTowers).values([
            { projectId: ctcSkyOne.id, phaseId: phMain.id, towerNumber: "1", name: 'Tower A', floorCount: 57 },
            { projectId: ctcSkyOne.id, phaseId: phMain.id, towerNumber: "2", name: 'Tower B', floorCount: 56 }
        ]).onConflictDoNothing();
    }

    // 3. MBW BOULEVARD
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_mbwBlvd] = await tx.insert(schema.projects).values({
        slug: 'mbw-boulevard-senna',
        name: 'MBW Boulevard (Senna Residence)',
        developerId: getDev('city-centre-transformation'),
        propertyCategoryId: getCat('high-rise') || getCat('high_rise'),
        propertyTypeId: getType('serviced-apartment'),
        tenureTypeId: tenureLeaseholdId!,
        // UPDATED: Use Uppercase code
        projectStatusId: getStatus('UNDER_CONSTRUCTION'),
        regionId: regionMap.get('skudai-north-jb')!,
        areaId: areaMap.get('mukim-pulai')!,
        address: 'Mukim Pulai, JB',
        totalUnits: 945,
        isPublished: true
    }).onConflictDoNothing().returning();
    
    // 4. SUNWAY MAJESTIC
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_sunway] = await tx.insert(schema.projects).values({
        slug: 'sunway-majestic',
        name: 'Sunway Majestic',
        developerId: getDev('sunway-developer'),
        propertyCategoryId: getCat('high-rise') || getCat('high_rise'),
        propertyTypeId: getType('serviced-apartment'),
        tenureTypeId: tenureFreeholdId!,
        // UPDATED: Use Uppercase code
        projectStatusId: getStatus('NEW_LAUNCH'),
        regionId: regionMap.get('jb-city-centre')!,
        areaId: areaMap.get('kolam-ayer')!,
        address: 'Jalan Yahya Awal, Kolam Ayer',
        totalUnits: 1012,
        isPublished: true
    }).onConflictDoNothing().returning();

    // 5. PARAGON
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_paragon] = await tx.insert(schema.projects).values({
        slug: 'paragon-signature-suites',
        name: 'Paragon Signature Suites',
        developerId: getDev('paragon-urban'),
        propertyCategoryId: getCat('high-rise') || getCat('high_rise'),
        propertyTypeId: getType('serviced-apartment'),
        tenureTypeId: tenureFreeholdId!,
        // UPDATED: Use Uppercase code
        projectStatusId: getStatus('NEW_LAUNCH'),
        regionId: regionMap.get('jb-city-centre')!,
        areaId: areaMap.get('jalan-abdul-samad')!,
        address: 'Jalan Abdul Samad, JB',
        totalUnits: 484,
        isPublished: true
    }).onConflictDoNothing().returning();

    console.log('✅ Seed Complete!');
  });
}

seed()
  .then(async () => { await queryClient.end(); process.exit(0); })
  .catch(async (err) => { console.error('❌ Seed Failed:', err); await queryClient.end(); process.exit(1); });