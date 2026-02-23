// src\db\schema.ts
import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  date,
  jsonb,
  unique,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from "crypto";

// ============================================
// 1. BASE HELPERS
// ============================================
export const baseColumns = () => ({
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const lookupFields = () => ({
  ...baseColumns(),
  // FIXED: Removed .unique() here to prevent naming collisions
  code: varchar('code', { length: 50 }).notNull(), 
  name: varchar('name', { length: 100 }).notNull(), 
  description: text('description'),
  color: varchar('color', { length: 20 }), 
  icon: varchar('icon', { length: 50 }), 
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
});

export const slugFields = () => ({
  ...baseColumns(),
  // FIXED: Removed .unique() here to prevent naming collisions
  slug: varchar('slug', { length: 200 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
});

// ============================================
// 2. CORE LOOKUPS (Normalized)
// ============================================
// FIXED: Added unique constraint via callback
export const propertyCategories = pgTable('property_categories', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const propertyTypes = pgTable('property_types', { 
  ...lookupFields(),
  slug: varchar('slug', { length: 100 }).unique(), // Inline unique is safe
  categoryId: text('category_id').references(() => propertyCategories.id) 
}, (t) => ({
  uniqCode: unique().on(t.code)
}));

export const tenureTypes = pgTable('tenure_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const titleTypes = pgTable('title_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const lotTypes = pgTable('lot_types', { ...lookupFields(), eligibility: text('eligibility') }, (t) => ({
  uniqCode: unique().on(t.code)
}));

export const unitPositions = pgTable('unit_positions', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

// Status Workflows
export const projectStatuses = pgTable('project_statuses', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const constructionStatuses = pgTable('construction_statuses', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const bookingStatuses = pgTable('booking_statuses', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const appointmentStatuses = pgTable('appointment_statuses', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

// Commercial & Sales
export const financingTypes = pgTable('financing_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const buyerTypes = pgTable('buyer_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const promotionTypes = pgTable('promotion_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

// Amenities & Tags
export const amenities = pgTable('amenities', { ...slugFields(), icon: varchar('icon', { length: 50 }) }, (t) => ({
  uniqSlug: unique().on(t.slug)
}));

export const tags = pgTable('tags', slugFields(), (t) => ({
  uniqSlug: unique().on(t.slug)
}));

export const mediaTypes = pgTable('media_types', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

// ============================================
// 3. PROFESSIONAL PANELS
// ============================================
export const panelLawyers = pgTable('panel_lawyers', {
  ...baseColumns(),
  name: varchar('name', { length: 200 }).notNull(),
  firmName: varchar('firm_name', { length: 200 }),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  isActive: boolean('is_active').default(true),
});

export const panelBankers = pgTable('panel_bankers', {
  ...baseColumns(),
  bankName: varchar('bank_name', { length: 100 }).notNull(),
  bankerName: varchar('banker_name', { length: 100 }).notNull(),
  branch: varchar('branch', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 100 }),
  isActive: boolean('is_active').default(true),
});

// ============================================
// 4. LOCATIONS & FILES
// ============================================
export const states = pgTable('states', {
  ...baseColumns(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // Inline is fine
  country: varchar('country', { length: 100 }).default('Malaysia'),
});

export const regions = pgTable('regions', { ...slugFields(), stateId: text('state_id').references(() => states.id) }, (t) => ({
  uniqSlug: unique().on(t.slug)
}));

export const areas = pgTable('areas', { ...slugFields(), regionId: text('region_id').references(() => regions.id) }, (t) => ({
  uniqSlug: unique().on(t.slug)
}));

export const files = pgTable('files', {
  ...baseColumns(),
  provider: varchar('provider', { length: 50 }),
  key: varchar('key', { length: 1000 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
});

// ============================================
// 5. PROJECTS HIERARCHY
// ============================================
export const developers = pgTable('developers', {
  ...slugFields(),
  legalName: varchar('legal_name', { length: 200 }),
  logoFileId: text('logo_file_id').references(() => files.id),
}, (t) => ({
  uniqSlug: unique().on(t.slug)
}));

export const projects = pgTable('projects', {
  ...slugFields(),
  displayName: varchar('display_name', { length: 200 }),
  legalName: varchar('legal_name', { length: 200 }),
  developerId: text('developer_id').references(() => developers.id).notNull(),
  
  propertyCategoryId: text('property_category_id').references(() => propertyCategories.id),
  propertyTypeId: text('property_type_id').references(() => propertyTypes.id),
  projectStatusId: text('project_status_id').references(() => projectStatuses.id),
  
  tenureTypeId: text('tenure_type_id').references(() => tenureTypes.id).notNull(),
  titleTypeId: text('title_type_id').references(() => titleTypes.id),
  tenureExpiryDate: date('tenure_expiry_date'),
  
  regionId: text('region_id').references(() => regions.id),
  areaId: text('area_id').references(() => areas.id),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  bookingFee: decimal('booking_fee', { precision: 10, scale: 2 }).default('1000.00'),
  maintenanceFeePerSqft: decimal('maintenance_fee_per_sqft', { precision: 10, scale: 2 }),
  isForeignerEligible: boolean('is_foreigner_eligible').default(true),
  foreignerEligibility: jsonb('foreigner_eligibility'),
  
  totalUnits: integer('total_units').default(0),
  launchYear: integer('launch_year'),
  featuredFileId: text('featured_file_id').references(() => files.id),
  isPublished: boolean('is_published').default(false),
}, (t) => ({
  uniqSlug: unique().on(t.slug),
  isPublishedIdx: index('is_published_idx').on(t.isPublished),
  categoryIdIdx: index('category_id_idx').on(t.propertyCategoryId),
  typeIdIdx: index('type_id_idx').on(t.propertyTypeId),
  statusIdIdx: index('status_id_idx').on(t.projectStatusId),
  regionIdIdx: index('region_id_idx').on(t.regionId),
  areaIdIdx: index('area_id_idx').on(t.areaId),
}));

export const projectPhases = pgTable('project_phases', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phaseCode: varchar('phase_code', { length: 50 }),
  completionDate: date('completion_date'),
  constructionStatusId: text('construction_status_id').references(() => constructionStatuses.id),
});

export const projectTowers = pgTable('project_towers', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  phaseId: text('phase_id').references(() => projectPhases.id),
  towerNumber: varchar('tower_number', { length: 50 }),
  name: varchar('name', { length: 100 }),
  floorCount: integer('floor_count'),
});

export const projectLayouts = pgTable('project_layouts', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }),
  builtUpSqft: decimal('built_up_sqft', { precision: 10, scale: 2 }).notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  studyRooms: integer('study_rooms').default(0),
  hasBalcony: boolean('has_balcony').default(false),
  hasYard: boolean('has_yard').default(false),
  floorPlanFileId: text('floor_plan_file_id').references(() => files.id),
  virtualTourUrl: varchar('virtual_tour_url', { length: 1000 }),
});

// ============================================
// 6. THE UNIVERSAL UNIT TABLE
// ============================================
export const units = pgTable('units', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  layoutId: text('layout_id').references(() => projectLayouts.id),
  towerId: text('tower_id').references(() => projectTowers.id),
  phaseId: text('phase_id').references(() => projectPhases.id),
  
  unitNo: varchar('unit_no', { length: 50 }).notNull(),
  floor: integer('floor'),
  streetName: varchar('street_name', { length: 100 }),
  
  builtUpSqft: decimal('built_up_sqft', { precision: 10, scale: 2 }),
  landAreaSqft: decimal('land_area_sqft', { precision: 10, scale: 2 }),
  dimensionText: varchar('dimension_text', { length: 50 }),
  
  facing: varchar('facing', { length: 100 }),
  positionTypeId: text('position_type_id').references(() => unitPositions.id),
  
  carparkCount: integer('carpark_count').default(1),
  carparkLotNo: varchar('carpark_lot_no', { length: 100 }),
  carparkType: varchar('carpark_type', { length: 50 }),

  lotTypeId: text('lot_type_id').references(() => lotTypes.id).notNull(),
  bookingStatusId: text('booking_status_id').references(() => bookingStatuses.id).notNull(),
  
  basePrice: decimal('base_price', { precision: 15, scale: 2 }).notNull(),
  finalPrice: decimal('final_price', { precision: 15, scale: 2 }),
  
  assignedLawyerId: text('assigned_lawyer_id').references(() => panelLawyers.id),
});

// ============================================
// 7. SALES & MARKETING (Rebates & Inventory)
// ============================================

export const inventoryItems = pgTable('inventory_items', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
});

export const salesPackages = pgTable('sales_packages', {
  ...baseColumns(),
  projectId: text('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  buyerTypeId: text('buyer_type_id').references(() => buyerTypes.id),
  
  rebatePercentage: decimal('rebate_percentage', { precision: 5, scale: 2 }),
  cashBackAmount: decimal('cash_back_amount', { precision: 15, scale: 2 }),
  
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  isActive: boolean('is_active').default(true),
});

export const packageInventory = pgTable('package_inventory', {
  packageId: text('package_id').references(() => salesPackages.id).notNull(),
  inventoryItemId: text('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').default(1),
}, (t) => ({ pk: primaryKey({ columns: [t.packageId, t.inventoryItemId] }) }));

export const referralTiers = pgTable('referral_tiers', {
  ...baseColumns(),
  name: varchar('name', { length: 100 }).notNull(),
  minReferrals: integer('min_referrals').default(0),
  rewardAmount: decimal('reward_amount', { precision: 10, scale: 2 }),
  description: text('description'),
});

// ============================================
// 8. USERS & AUTH
// ============================================
export const roles = pgTable('roles', lookupFields(), (t) => ({
  uniqCode: unique().on(t.code)
}));

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), 
  email: text("email").notNull().unique(), 
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  phoneNumber: text('phone_number').unique(), 
  phoneNumberVerified: boolean('phone_number_verified').default(false).notNull(),
  
  nationality: varchar('nationality', { length: 100 }),
  
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  
  roleId: text('role_id').references(() => roles.id),
  
  renNumber: varchar('ren_number', { length: 50 }),
  agencyName: varchar('agency_name', { length: 100 }),
  
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredByUserId: text('referred_by_user_id'),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), 
  value: text("value").notNull(), 
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ============================================
// 9. OPERATIONS
// ============================================
export const appointments = pgTable('appointments', {
  ...baseColumns(),
  userId: text('user_id').references(() => user.id).notNull(),
  agentId: text('agent_id').references(() => user.id),
  projectId: text('project_id').references(() => projects.id).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  statusId: text('status_id').references(() => appointmentStatuses.id).notNull(),
  notes: text('notes'),
  qrToken: varchar('qr_token', { length: 100 }).unique(),
  scannedAt: timestamp('scanned_at'),
  scannedById: text('scanned_by_id').references(() => user.id),
  referrerId: text('referrer_id').references(() => user.id),
});

export const referralRewards = pgTable('referral_rewards', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  referrerId: text('referrer_id').references(() => user.id).notNull(),
  refereeId: text('referee_id').references(() => user.id).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING'),
  rewardType: varchar('reward_type', { length: 50 }).default('CASH'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  triggerEvent: varchar('trigger_event', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const redemptions = pgTable('redemptions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').references(() => user.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  rewardItem: varchar('reward_item', { length: 100 }),
  status: varchar('status', { length: 50 }).default('PENDING'),
  code: varchar('code', { length: 100 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').references(() => user.id).primaryKey(),
  theme: varchar('theme', { length: 20 }).default('light'),
  language: varchar('language', { length: 10 }).default('en'),
  currency: varchar('currency', { length: 10 }).default('MYR'),
  notificationSettings: jsonb('notification_settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 10. RELATIONS
// ============================================
export const projectAmenities = pgTable('project_amenities', {
  projectId: text('project_id').references(() => projects.id).notNull(),
  amenityId: text('amenity_id').references(() => amenities.id).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.projectId, t.amenityId] }) }));

export const projectTags = pgTable('project_tags', {
  projectId: text('project_id').references(() => projects.id).notNull(),
  tagId: text('tag_id').references(() => tags.id).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.projectId, t.tagId] }) }));

export const projectBankers = pgTable('project_bankers', {
  projectId: text('project_id').references(() => projects.id).notNull(),
  bankerId: text('banker_id').references(() => panelBankers.id).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.projectId, t.bankerId] }) }));

// Relations for join tables so Drizzle can infer many-to-many joins
export const projectAmenitiesRelations = relations(projectAmenities, ({ one }) => ({
  project: one(projects, { fields: [projectAmenities.projectId], references: [projects.id], relationName: 'project_amenities' }),
  amenity: one(amenities, { fields: [projectAmenities.amenityId], references: [amenities.id], relationName: 'project_amenities' }),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, { fields: [projectTags.projectId], references: [projects.id], relationName: 'project_tags' }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id], relationName: 'project_tags' }),
}));

export const projectBankersRelations = relations(projectBankers, ({ one }) => ({
  project: one(projects, { fields: [projectBankers.projectId], references: [projects.id], relationName: 'project_bankers' }),
  banker: one(panelBankers, { fields: [projectBankers.bankerId], references: [panelBankers.id], relationName: 'project_bankers' }),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  developer: one(developers, { fields: [projects.developerId], references: [developers.id] }),
  category: one(propertyCategories, { fields: [projects.propertyCategoryId], references: [propertyCategories.id] }),
  type: one(propertyTypes, { fields: [projects.propertyTypeId], references: [propertyTypes.id] }),
  status: one(projectStatuses, { fields: [projects.projectStatusId], references: [projectStatuses.id] }),
  towers: many(projectTowers),
  phases: many(projectPhases),
  units: many(units),
  amenities: many(projectAmenities, { relationName: 'project_amenities' }),
  tags: many(projectTags, { relationName: 'project_tags' }),
  bankers: many(projectBankers, { relationName: 'project_bankers' }),
  salesPackages: many(salesPackages),
}));

export const unitRelations = relations(units, ({ one }) => ({
  project: one(projects, { fields: [units.projectId], references: [projects.id] }),
  layout: one(projectLayouts, { fields: [units.layoutId], references: [projectLayouts.id] }),
  tower: one(projectTowers, { fields: [units.towerId], references: [projectTowers.id] }),
  lotType: one(lotTypes, { fields: [units.lotTypeId], references: [lotTypes.id] }),
  bookingStatus: one(bookingStatuses, { fields: [units.bookingStatusId], references: [bookingStatuses.id] }),
  assignedLawyer: one(panelLawyers, { fields: [units.assignedLawyerId], references: [panelLawyers.id] }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  role: one(roles, { fields: [user.roleId], references: [roles.id] }),
  referrer: one(user, { fields: [user.referredByUserId], references: [user.id], relationName: 'referral' }),
  referrals: many(user, { relationName: 'referral' }),
  appointments: many(appointments, { relationName: 'customer_appointments' }),
  agentAppointments: many(appointments, { relationName: 'agent_appointments' }),
  rewardsReceived: many(referralRewards, { relationName: 'referrer_rewards' }),
  redemptions: many(redemptions),
  preferences: one(userPreferences),
}));

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  referrer: one(user, { fields: [referralRewards.referrerId], references: [user.id], relationName: 'referrer_rewards' }),
  referee: one(user, { fields: [referralRewards.refereeId], references: [user.id], relationName: 'referee_rewards' }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(user, { fields: [redemptions.userId], references: [user.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, { fields: [userPreferences.userId], references: [user.id] }),
}));

export const appointmentRelations = relations(appointments, ({ one }) => ({
  user: one(user, { fields: [appointments.userId], references: [user.id], relationName: 'customer_appointments' }),
  agent: one(user, { fields: [appointments.agentId], references: [user.id], relationName: 'agent_appointments' }),
  project: one(projects, { fields: [appointments.projectId], references: [projects.id] }),
  status: one(appointmentStatuses, { fields: [appointments.statusId], references: [appointmentStatuses.id] }),
}));
