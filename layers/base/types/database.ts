export type Employee = {
  id: string
  organisationId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  employeeNumber: string | null
  role: 'admin' | 'planner' | 'employee'
  contractHoursPerPeriod: number
  deletedAt: string | null
  createdAt: string
  grants?: GrantWithRoleType[]
  availability?: { dayOfWeek: number; maxHours: number }[]
}

export type RoleType = {
  id: string
  organisationId: string
  name: string
}

export type Grant = {
  id: string
  profileId: string
  roleTypeId: string
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
}

export type GrantWithRoleType = Grant & {
  roleTypeName: string
}

export type Shift = {
  id: string
  organisationId: string
  profileId: string
  date: string
  startTime: string
  endTime: string
  locationLabel: string | null
  weekPublished: boolean
  createdAt: string
}

export type EmployeeAvailability = {
  id: string
  profileId: string
  dayOfWeek: number
  maxHours: number
}

export type OrganisationSettings = {
  organisationId: string
  emailSendTime: string
  emailSendDay: number
  updatedAt: string
}

export type Guard = Pick<Employee, 'id' | 'firstName' | 'lastName' | 'contractHoursPerPeriod'> & {
  grants: GrantWithRoleType[]
  availability: { dayOfWeek: number; maxHours: number }[]
}
