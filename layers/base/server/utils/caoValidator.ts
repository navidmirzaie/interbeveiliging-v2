export type CaoViolation = {
  rule: string
  article: string
  message: string
  severity: 'error' | 'warning'
}

type TimeStr = string  // 'HH:MM'
type DateStr = string  // 'YYYY-MM-DD'

type ShiftInput = {
  date: DateStr
  startTime: TimeStr
  endTime: TimeStr
}

const MAX_DAILY_HOURS = 9
const MAX_NIGHT_HOURS = 8
const MAX_WEEKLY_HOURS = 48
const MIN_REST_BETWEEN_SHIFTS_HOURS = 11
const MAX_CONSECUTIVE_DAYS = 6
const MAX_SHIFTS_PER_WEEK = 5
const MAX_NIGHT_SHIFTS_CONSECUTIVE = 3
const MIN_SHIFT_DURATION_MINUTES = 120
const MAX_OVERTIME_HOURS_PER_PERIOD = 40

function toMinutes(time: TimeStr): number {
  const parts = time.split(':')
  return Number(parts[0]) * 60 + Number(parts[1] ?? 0)
}

function durationMinutes(start: TimeStr, end: TimeStr): number {
  return ((toMinutes(end) - toMinutes(start)) + 1440) % 1440
}

function isNightShift(start: TimeStr): boolean {
  const h = Number(start.split(':')[0])
  return h >= 22 || h < 6
}

function addDays(date: DateStr, n: number): DateStr {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function dayDiff(a: DateStr, b: DateStr): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000
}

// R-01: Max 9h daily (day shift)
export function validateMaxDailyHours(shift: ShiftInput): CaoViolation | null {
  const mins = durationMinutes(shift.startTime, shift.endTime)
  if (!isNightShift(shift.startTime) && mins > MAX_DAILY_HOURS * 60) {
    return {
      rule: 'R-01',
      article: 'art. 4.2',
      message: `Dienst duurt ${(mins / 60).toFixed(1)}u — maximaal ${MAX_DAILY_HOURS}u per dagdienst (CAO art. 4.2)`,
      severity: 'warning',
    }
  }
  return null
}

// R-02: Max 8h night shift
export function validateMaxNightHours(shift: ShiftInput): CaoViolation | null {
  const mins = durationMinutes(shift.startTime, shift.endTime)
  if (isNightShift(shift.startTime) && mins > MAX_NIGHT_HOURS * 60) {
    return {
      rule: 'R-02',
      article: 'art. 4.3',
      message: `Nachtdienst duurt ${(mins / 60).toFixed(1)}u — maximaal ${MAX_NIGHT_HOURS}u per nachtdienst (CAO art. 4.3)`,
      severity: 'warning',
    }
  }
  return null
}

// R-03: Min 11h rest between shifts
export function validateMinRestBetween(prev: ShiftInput, next: ShiftInput): CaoViolation | null {
  const prevEndDate = prev.endTime < prev.startTime ? addDays(prev.date, 1) : prev.date
  const prevEndMinutes = toMinutes(prev.endTime) + (prev.endTime < prev.startTime ? 1440 : 0)
  const nextStartMinutes = toMinutes(next.startTime) + dayDiff(prev.date, next.date) * 1440
  const restMinutes = nextStartMinutes - prevEndMinutes

  if (restMinutes < MIN_REST_BETWEEN_SHIFTS_HOURS * 60) {
    const restH = (restMinutes / 60).toFixed(1)
    return {
      rule: 'R-03',
      article: 'art. 5.1',
      message: `Rust tussen diensten is ${restH}u — minimaal ${MIN_REST_BETWEEN_SHIFTS_HOURS}u vereist (CAO art. 5.1)`,
      severity: 'error',
    }
  }
  return null
}

// R-04: Max 48h per week
export function validateMaxWeeklyHours(shifts: ShiftInput[]): CaoViolation | null {
  const total = shifts.reduce((sum, s) => sum + durationMinutes(s.startTime, s.endTime), 0)
  if (total > MAX_WEEKLY_HOURS * 60) {
    return {
      rule: 'R-04',
      article: 'art. 4.1',
      message: `Totaal ${(total / 60).toFixed(1)}u deze week — maximaal ${MAX_WEEKLY_HOURS}u (CAO art. 4.1)`,
      severity: 'error',
    }
  }
  return null
}

// R-05: Max 6 consecutive working days
export function validateMaxConsecutiveDays(shifts: ShiftInput[]): CaoViolation | null {
  if (!shifts.length) return null
  const dates = [...new Set(shifts.map(s => s.date))].sort()
  let streak = 1
  let max = 1
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1]!, dates[i]!) === 1) {
      streak++
      max = Math.max(max, streak)
    } else {
      streak = 1
    }
  }
  if (max > MAX_CONSECUTIVE_DAYS) {
    return {
      rule: 'R-05',
      article: 'art. 5.3',
      message: `Medewerker werkt ${max} aaneengesloten dagen — maximaal ${MAX_CONSECUTIVE_DAYS} (CAO art. 5.3)`,
      severity: 'error',
    }
  }
  return null
}

// R-06: Max 5 shifts per week
export function validateMaxShiftsPerWeek(shifts: ShiftInput[]): CaoViolation | null {
  if (shifts.length > MAX_SHIFTS_PER_WEEK) {
    return {
      rule: 'R-06',
      article: 'art. 4.4',
      message: `${shifts.length} diensten deze week — maximaal ${MAX_SHIFTS_PER_WEEK} (CAO art. 4.4)`,
      severity: 'warning',
    }
  }
  return null
}

// R-07: Max 3 consecutive night shifts
export function validateMaxConsecutiveNightShifts(shifts: ShiftInput[]): CaoViolation | null {
  const nights = shifts.filter(s => isNightShift(s.startTime)).sort((a, b) => a.date < b.date ? -1 : 1)
  let streak = 1
  let max = 1
  for (let i = 1; i < nights.length; i++) {
    if (dayDiff(nights[i - 1]!.date, nights[i]!.date) === 1) {
      streak++
      max = Math.max(max, streak)
    } else {
      streak = 1
    }
  }
  if (max > MAX_NIGHT_SHIFTS_CONSECUTIVE) {
    return {
      rule: 'R-07',
      article: 'art. 4.5',
      message: `${max} aaneengesloten nachtdiensten — maximaal ${MAX_NIGHT_SHIFTS_CONSECUTIVE} (CAO art. 4.5)`,
      severity: 'error',
    }
  }
  return null
}

// R-08: Min 2h shift duration
export function validateMinShiftDuration(shift: ShiftInput): CaoViolation | null {
  const mins = durationMinutes(shift.startTime, shift.endTime)
  if (mins < MIN_SHIFT_DURATION_MINUTES) {
    return {
      rule: 'R-08',
      article: 'art. 4.6',
      message: `Dienst duurt ${mins}m — minimaal ${MIN_SHIFT_DURATION_MINUTES}m vereist (CAO art. 4.6)`,
      severity: 'error',
    }
  }
  return null
}

// R-09: Weekend rest — at least 1 free weekend per 2 weeks
export function validateWeekendRest(
  currentWeekShifts: ShiftInput[],
  previousWeekShifts: ShiftInput[],
): CaoViolation | null {
  function hasWeekendShift(shifts: ShiftInput[]): boolean {
    return shifts.some(s => {
      const day = new Date(s.date).getDay()
      return day === 0 || day === 6
    })
  }
  if (hasWeekendShift(currentWeekShifts) && hasWeekendShift(previousWeekShifts)) {
    return {
      rule: 'R-09',
      article: 'art. 5.4',
      message: 'Medewerker heeft geen vrij weekend gehad in 2 weken — minimaal 1 weekend vrij per 2 weken (CAO art. 5.4)',
      severity: 'warning',
    }
  }
  return null
}

// R-10: No split shifts (same day, gap > 1h)
export function validateNoSplitShifts(shiftsOnDay: ShiftInput[]): CaoViolation | null {
  if (shiftsOnDay.length < 2) return null
  const sorted = [...shiftsOnDay].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
  for (let i = 1; i < sorted.length; i++) {
    const gapMinutes = toMinutes(sorted[i]!.startTime) - toMinutes(sorted[i - 1]!.endTime)
    if (gapMinutes > 60) {
      return {
        rule: 'R-10',
        article: 'art. 4.7',
        message: `Gesplitste dienst — maximale pauze 1 uur (CAO art. 4.7)`,
        severity: 'warning',
      }
    }
  }
  return null
}

// R-11: Night shift must not start before previous night shift ended + 14h
export function validateNightShiftRecovery(prev: ShiftInput, next: ShiftInput): CaoViolation | null {
  if (!isNightShift(prev.startTime) || !isNightShift(next.startTime)) return null
  const restMins = (toMinutes(next.startTime) + dayDiff(prev.date, next.date) * 1440) - toMinutes(prev.endTime)
  if (restMins < 14 * 60) {
    return {
      rule: 'R-11',
      article: 'art. 5.2',
      message: `Te weinig herstel na nachtdienst: ${(restMins / 60).toFixed(1)}u — minimaal 14u (CAO art. 5.2)`,
      severity: 'error',
    }
  }
  return null
}

// R-12: Overtime cap per 4-week period
export function validateOvertimePeriod(shifts: ShiftInput[], contractHoursPerPeriod: number): CaoViolation | null {
  const total = shifts.reduce((sum, s) => sum + durationMinutes(s.startTime, s.endTime), 0)
  const overtime = total / 60 - contractHoursPerPeriod
  if (overtime > MAX_OVERTIME_HOURS_PER_PERIOD) {
    return {
      rule: 'R-12',
      article: 'art. 6.1',
      message: `Overwerk ${overtime.toFixed(1)}u deze periode — maximaal ${MAX_OVERTIME_HOURS_PER_PERIOD}u (CAO art. 6.1)`,
      severity: 'warning',
    }
  }
  return null
}

// R-13: Public holiday premium not factored — flag if shift on public holiday
const DUTCH_PUBLIC_HOLIDAYS_APPROX = ['01-01', '04-18', '04-21', '04-26', '04-27', '05-05', '05-29', '06-08', '06-09', '12-25', '12-26']
export function validatePublicHoliday(shift: ShiftInput): CaoViolation | null {
  const mmdd = shift.date.slice(5)
  if (DUTCH_PUBLIC_HOLIDAYS_APPROX.includes(mmdd)) {
    return {
      rule: 'R-13',
      article: 'art. 7.2',
      message: `Dienst op feestdag — controleer toeslag (CAO art. 7.2)`,
      severity: 'warning',
    }
  }
  return null
}

// R-14: Sundays premium — flag Sunday shifts
export function validateSundayPremium(shift: ShiftInput): CaoViolation | null {
  if (new Date(shift.date).getDay() === 0) {
    return {
      rule: 'R-14',
      article: 'art. 7.1',
      message: `Zondagsdienst — controleer zondagstoeslag (CAO art. 7.1)`,
      severity: 'warning',
    }
  }
  return null
}

// R-15: Break entitlement — shift > 5.5h must include break
export function validateBreakEntitlement(shift: ShiftInput): CaoViolation | null {
  const mins = durationMinutes(shift.startTime, shift.endTime)
  if (mins > 5.5 * 60) {
    return {
      rule: 'R-15',
      article: 'art. 5.5',
      message: `Dienst duurt meer dan 5,5u — zorg voor pauze van minimaal 30 minuten (CAO art. 5.5)`,
      severity: 'warning',
    }
  }
  return null
}

// R-16: Shift end > midnight triggers next-day date check
export function validateOvernightDate(shift: ShiftInput): CaoViolation | null {
  if (shift.endTime < shift.startTime) {
    return {
      rule: 'R-16',
      article: 'art. 4.8',
      message: `Dienst eindigt na middernacht — registreer eindtijd correct op de volgende dag (CAO art. 4.8)`,
      severity: 'warning',
    }
  }
  return null
}

// R-17: 18+ only for night shifts
export function validateNightShiftAge(shift: ShiftInput, birthDate: string | null): CaoViolation | null {
  if (!isNightShift(shift.startTime)) return null
  if (!birthDate) return null
  const age = (new Date(shift.date).getTime() - new Date(birthDate).getTime()) / (365.25 * 86400000)
  if (age < 18) {
    return {
      rule: 'R-17',
      article: 'art. 9.1',
      message: `Medewerker is jonger dan 18 jaar — nachtdiensten niet toegestaan (CAO art. 9.1)`,
      severity: 'error',
    }
  }
  return null
}

// R-18: Contract hours not exceeded for part-time employees in a week
export function validatePartTimeContract(
  weeklyShifts: ShiftInput[],
  contractHoursPerPeriod: number,
): CaoViolation | null {
  const weeklyMax = contractHoursPerPeriod / 4
  const total = weeklyShifts.reduce((sum, s) => sum + durationMinutes(s.startTime, s.endTime), 0) / 60
  if (total > weeklyMax * 1.25) {
    return {
      rule: 'R-18',
      article: 'art. 6.2',
      message: `Geplande uren ${total.toFixed(1)}u overschrijden contracturen ${weeklyMax.toFixed(1)}u/week met meer dan 25% (CAO art. 6.2)`,
      severity: 'warning',
    }
  }
  return null
}

// Convenience: validate a single new shift against existing week shifts
export function validateShift(
  newShift: ShiftInput,
  existingShifts: ShiftInput[],
  contractHoursPerPeriod = 144,
): CaoViolation[] {
  const violations: CaoViolation[] = []
  const v = (r: CaoViolation | null) => r && violations.push(r)

  v(validateMaxDailyHours(newShift))
  v(validateMaxNightHours(newShift))
  v(validateMinShiftDuration(newShift))
  v(validateBreakEntitlement(newShift))
  v(validateOvernightDate(newShift))
  v(validatePublicHoliday(newShift))
  v(validateSundayPremium(newShift))

  const allShifts = [...existingShifts, newShift]
  v(validateMaxWeeklyHours(allShifts))
  v(validateMaxShiftsPerWeek(allShifts))
  v(validateMaxConsecutiveDays(allShifts))
  v(validateMaxConsecutiveNightShifts(allShifts))
  v(validatePartTimeContract(allShifts, contractHoursPerPeriod))

  const sorted = [...existingShifts].sort((a, b) => a.date < b.date ? -1 : 1)
  for (const s of sorted) {
    v(validateMinRestBetween(s, newShift))
    v(validateNightShiftRecovery(s, newShift))
  }

  const sameDayShifts = existingShifts.filter(s => s.date === newShift.date)
  v(validateNoSplitShifts([...sameDayShifts, newShift]))

  return violations
}
