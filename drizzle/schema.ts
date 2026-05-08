import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  boolean,
  integer,
  decimal,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'planner', 'employee'])

export const organisations = pgTable('organisations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  name:             text('name').notNull(),
  kvkNumber:        text('kvk_number').unique().notNull(),
  primaryColour:    text('primary_colour').default('#1E3A5F'),
  logoUrl:          text('logo_url'),
  dashboardTitle:   text('dashboard_title'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const profiles = pgTable('profiles', {
  id:                     uuid('id').primaryKey(),
  organisationId:         uuid('organisation_id').notNull().references(() => organisations.id),
  firstName:              text('first_name').notNull(),
  lastName:               text('last_name').notNull(),
  email:                  text('email').notNull(),
  phone:                  text('phone'),
  employeeNumber:         text('employee_number'),
  role:                   roleEnum('role').notNull().default('employee'),
  contractHoursPerPeriod: integer('contract_hours_per_period').default(144),
  mustChangePassword:     boolean('must_change_password').default(false),
  deletedAt:              timestamp('deleted_at', { withTimezone: true }),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const roleTypes = pgTable('role_types', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  name:           text('name').notNull(),
}, (t) => [unique().on(t.organisationId, t.name)])

export const grants = pgTable('grants', {
  id:          uuid('id').primaryKey().defaultRandom(),
  profileId:   uuid('profile_id').notNull().references(() => profiles.id),
  roleTypeId:  uuid('role_type_id').notNull().references(() => roleTypes.id),
  startsAt:    date('starts_at'),
  expiresAt:   date('expires_at'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const organisationSettings = pgTable('organisation_settings', {
  organisationId: uuid('organisation_id').primaryKey().references(() => organisations.id),
  emailSendTime:  time('email_send_time').default('08:00'),
  emailSendDay:   integer('email_send_day').default(1),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const employeeAvailability = pgTable('employee_availability', {
  id:         uuid('id').primaryKey().defaultRandom(),
  profileId:  uuid('profile_id').notNull().references(() => profiles.id),
  dayOfWeek:  integer('day_of_week').notNull(),
  maxHours:   decimal('max_hours', { precision: 4, scale: 2 }).default('8.00'),
}, (t) => [unique().on(t.profileId, t.dayOfWeek)])

export const shifts = pgTable('shifts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  profileId:      uuid('profile_id').notNull().references(() => profiles.id),
  date:           date('date').notNull(),
  startTime:      time('start_time').notNull(),
  endTime:        time('end_time').notNull(),
  locationLabel:  text('location_label'),
  weekPublished:  boolean('week_published').default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Organisation = typeof organisations.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type RoleType = typeof roleTypes.$inferSelect
export type Grant = typeof grants.$inferSelect
export type Shift = typeof shifts.$inferSelect
export type EmployeeAvailability = typeof employeeAvailability.$inferSelect
export type OrganisationSettings = typeof organisationSettings.$inferSelect

export type NewShift = typeof shifts.$inferInsert
export type NewProfile = typeof profiles.$inferInsert
