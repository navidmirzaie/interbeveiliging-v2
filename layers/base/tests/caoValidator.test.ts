import { describe, it, expect } from 'vitest'
import {
  validateMaxDailyHours,
  validateMaxNightHours,
  validateMinRestBetween,
  validateMaxWeeklyHours,
  validateMaxConsecutiveDays,
  validateMaxShiftsPerWeek,
  validateMaxConsecutiveNightShifts,
  validateMinShiftDuration,
  validateWeekendRest,
  validateNoSplitShifts,
  validateNightShiftRecovery,
  validateOvertimePeriod,
  validatePublicHoliday,
  validateSundayPremium,
  validateBreakEntitlement,
  validateOvernightDate,
  validateNightShiftAge,
  validatePartTimeContract,
} from '../server/utils/caoValidator'

const shift = (date: string, start: string, end: string) => ({ date, startTime: start, endTime: end })

describe('R-01: max daily hours (day shift)', () => {
  it('passes for 9h shift', () => {
    expect(validateMaxDailyHours(shift('2025-06-02', '07:00', '16:00'))).toBeNull()
  })
  it('fails for 10h day shift', () => {
    expect(validateMaxDailyHours(shift('2025-06-02', '07:00', '17:00'))?.rule).toBe('R-01')
  })
  it('ignores night shifts', () => {
    expect(validateMaxDailyHours(shift('2025-06-02', '22:00', '08:00'))).toBeNull()
  })
})

describe('R-02: max night shift hours', () => {
  it('passes for 8h night shift', () => {
    expect(validateMaxNightHours(shift('2025-06-02', '22:00', '06:00'))).toBeNull()
  })
  it('fails for 9h night shift', () => {
    expect(validateMaxNightHours(shift('2025-06-02', '22:00', '07:00'))?.rule).toBe('R-02')
  })
  it('ignores day shifts', () => {
    expect(validateMaxNightHours(shift('2025-06-02', '08:00', '18:00'))).toBeNull()
  })
})

describe('R-03: min 11h rest between shifts', () => {
  it('passes with 12h rest', () => {
    const prev = shift('2025-06-02', '07:00', '15:00')
    const next = shift('2025-06-02', '22:00', '06:00')
    expect(validateMinRestBetween(prev, next)).toBeNull()
  })
  it('fails with 8h rest', () => {
    const prev = shift('2025-06-02', '07:00', '15:00')
    const next = shift('2025-06-02', '23:00', '07:00')
    expect(validateMinRestBetween(prev, next)?.rule).toBe('R-03')
  })
})

describe('R-04: max 48h per week', () => {
  it('passes for 48h exactly', () => {
    const shifts = Array.from({ length: 6 }, (_, i) =>
      shift(`2025-06-0${i + 1}`, '08:00', '16:00'),
    )
    expect(validateMaxWeeklyHours(shifts)).toBeNull()
  })
  it('fails for 49h', () => {
    const shifts = [
      ...Array.from({ length: 6 }, (_, i) => shift(`2025-06-0${i + 1}`, '08:00', '16:00')),
      shift('2025-06-07', '08:00', '09:00'),
    ]
    expect(validateMaxWeeklyHours(shifts)?.rule).toBe('R-04')
  })
})

describe('R-05: max 6 consecutive days', () => {
  it('passes for 6 consecutive days', () => {
    const shifts = Array.from({ length: 6 }, (_, i) =>
      shift(`2025-06-0${i + 2}`, '08:00', '16:00'),
    )
    expect(validateMaxConsecutiveDays(shifts)).toBeNull()
  })
  it('fails for 7 consecutive days', () => {
    const shifts = Array.from({ length: 7 }, (_, i) =>
      shift(`2025-06-0${i + 1}`, '08:00', '16:00'),
    )
    expect(validateMaxConsecutiveDays(shifts)?.rule).toBe('R-05')
  })
})

describe('R-06: max 5 shifts per week', () => {
  it('passes for 5 shifts', () => {
    const shifts = Array.from({ length: 5 }, (_, i) =>
      shift(`2025-06-0${i + 2}`, '08:00', '16:00'),
    )
    expect(validateMaxShiftsPerWeek(shifts)).toBeNull()
  })
  it('fails for 6 shifts', () => {
    const shifts = Array.from({ length: 6 }, (_, i) =>
      shift(`2025-06-0${i + 2}`, '08:00', '16:00'),
    )
    expect(validateMaxShiftsPerWeek(shifts)?.rule).toBe('R-06')
  })
})

describe('R-07: max 3 consecutive night shifts', () => {
  it('passes for 3 night shifts', () => {
    const shifts = ['2025-06-02', '2025-06-03', '2025-06-04'].map(d => shift(d, '22:00', '06:00'))
    expect(validateMaxConsecutiveNightShifts(shifts)).toBeNull()
  })
  it('fails for 4 consecutive night shifts', () => {
    const shifts = ['2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05'].map(d => shift(d, '22:00', '06:00'))
    expect(validateMaxConsecutiveNightShifts(shifts)?.rule).toBe('R-07')
  })
})

describe('R-08: min 2h shift duration', () => {
  it('passes for 2h shift', () => {
    expect(validateMinShiftDuration(shift('2025-06-02', '08:00', '10:00'))).toBeNull()
  })
  it('fails for 1h shift', () => {
    expect(validateMinShiftDuration(shift('2025-06-02', '08:00', '09:00'))?.rule).toBe('R-08')
  })
})

describe('R-09: weekend rest', () => {
  it('passes when last week has no weekend', () => {
    const current = [shift('2025-06-07', '08:00', '16:00')]
    const previous: typeof current = []
    expect(validateWeekendRest(current, previous)).toBeNull()
  })
  it('fails when both weeks have weekend shifts', () => {
    const current = [shift('2025-06-07', '08:00', '16:00')]
    const previous = [shift('2025-05-31', '08:00', '16:00')]
    expect(validateWeekendRest(current, previous)?.rule).toBe('R-09')
  })
})

describe('R-10: no split shifts with >1h gap', () => {
  it('passes for two shifts with 45m gap', () => {
    expect(validateNoSplitShifts([
      shift('2025-06-02', '08:00', '12:00'),
      shift('2025-06-02', '12:45', '16:00'),
    ])).toBeNull()
  })
  it('fails for two shifts with 2h gap', () => {
    expect(validateNoSplitShifts([
      shift('2025-06-02', '08:00', '12:00'),
      shift('2025-06-02', '14:00', '18:00'),
    ])?.rule).toBe('R-10')
  })
})

describe('R-11: night shift recovery 14h', () => {
  it('passes with 16h between night shifts', () => {
    const prev = shift('2025-06-02', '22:00', '06:00')
    const next = shift('2025-06-03', '22:00', '06:00')
    expect(validateNightShiftRecovery(prev, next)).toBeNull()
  })
  it('fails when next night starts only 12h after prev ends', () => {
    const prev = shift('2025-06-02', '22:00', '06:00')
    const next = shift('2025-06-03', '20:00', '04:00')
    expect(validateNightShiftRecovery(prev, next)?.rule).toBe('R-11')
  })
})

describe('R-12: overtime period cap', () => {
  it('passes within 40h overtime', () => {
    const shifts = Array.from({ length: 18 }, (_, i) =>
      shift(`2025-06-${String(i + 1).padStart(2, '0')}`, '08:00', '16:00'),
    )
    expect(validateOvertimePeriod(shifts, 144)).toBeNull()
  })
  it('fails when overtime exceeds 40h', () => {
    const shifts = Array.from({ length: 28 }, (_, i) =>
      shift(`2025-06-${String(i + 1).padStart(2, '0')}`, '08:00', '16:00'),
    )
    expect(validateOvertimePeriod(shifts, 144)?.rule).toBe('R-12')
  })
})

describe('R-13: public holiday flag', () => {
  it('flags New Years day', () => {
    expect(validatePublicHoliday(shift('2025-01-01', '08:00', '16:00'))?.rule).toBe('R-13')
  })
  it('passes for a regular day', () => {
    expect(validatePublicHoliday(shift('2025-06-02', '08:00', '16:00'))).toBeNull()
  })
})

describe('R-14: Sunday premium flag', () => {
  it('flags a Sunday shift', () => {
    expect(validateSundayPremium(shift('2025-06-01', '08:00', '16:00'))?.rule).toBe('R-14')
  })
  it('passes for Monday', () => {
    expect(validateSundayPremium(shift('2025-06-02', '08:00', '16:00'))).toBeNull()
  })
})

describe('R-15: break entitlement > 5.5h', () => {
  it('flags shift over 5.5h', () => {
    expect(validateBreakEntitlement(shift('2025-06-02', '08:00', '14:00'))?.rule).toBe('R-15')
  })
  it('passes for 5h shift', () => {
    expect(validateBreakEntitlement(shift('2025-06-02', '08:00', '13:00'))).toBeNull()
  })
})

describe('R-16: overnight date flag', () => {
  it('flags shift ending after midnight', () => {
    expect(validateOvernightDate(shift('2025-06-02', '22:00', '06:00'))?.rule).toBe('R-16')
  })
  it('passes for same-day shift', () => {
    expect(validateOvernightDate(shift('2025-06-02', '08:00', '16:00'))).toBeNull()
  })
})

describe('R-17: 18+ for night shifts', () => {
  it('fails for under 18 on night shift', () => {
    const birth = '2010-01-01'
    expect(validateNightShiftAge(shift('2025-06-02', '22:00', '06:00'), birth)?.rule).toBe('R-17')
  })
  it('passes for adult', () => {
    const birth = '2000-01-01'
    expect(validateNightShiftAge(shift('2025-06-02', '22:00', '06:00'), birth)).toBeNull()
  })
  it('passes for day shift regardless of age', () => {
    const birth = '2010-01-01'
    expect(validateNightShiftAge(shift('2025-06-02', '08:00', '16:00'), birth)).toBeNull()
  })
})

describe('R-18: part-time contract cap', () => {
  it('passes within 125% of weekly contract hours', () => {
    const shifts = Array.from({ length: 4 }, (_, i) =>
      shift(`2025-06-0${i + 2}`, '08:00', '16:00'),
    )
    expect(validatePartTimeContract(shifts, 144)).toBeNull()
  })
  it('fails when exceeding 125% of weekly contract', () => {
    const shifts = Array.from({ length: 7 }, (_, i) =>
      shift(`2025-06-0${i + 1}`, '08:00', '18:00'),
    )
    expect(validatePartTimeContract(shifts, 80)?.rule).toBe('R-18')
  })
})
