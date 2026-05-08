export type UserRole = 'admin' | 'planner' | 'employee'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  organisationId: string
  mustChangePassword: boolean
}

export type Organisation = {
  id: string
  name: string
  kvkNumber: string
  primaryColour: string
  logoUrl: string | null
  dashboardTitle: string | null
}

export type Session = {
  user: AuthUser
  organisation: Organisation
}
