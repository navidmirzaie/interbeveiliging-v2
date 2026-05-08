export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type CaoViolation = {
  rule: string
  article: string
  message: string
  severity: 'warning' | 'error'
}

export type CreateShiftPayload = {
  profileId: string
  date: string
  startTime: string
  endTime: string
  locationLabel?: string | null
}

export type ShiftSuggestion = {
  employeeId: string
  date: string
  startTime: string
  endTime: string
  locationLabel?: string | null
}

export type UnfillableSlot = {
  date: string
  reason: string
}

export type DayAvailability = {
  dayOfWeek: number
  maxHours: number
}
