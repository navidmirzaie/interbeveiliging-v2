type EmployeeInfo = {
  id: string
  firstName: string
  lastName: string
  contractHoursPerPeriod: number
  grants: { roleTypeName: string; startsAt: string | null; expiresAt: string | null }[]
  availability: { dayOfWeek: number; maxHours: number }[]
}

type ShiftInfo = {
  id: string
  profileId: string
  date: string
  startTime: string
  endTime: string
  locationLabel: string | null
}

const CAO_SYSTEM = `Je bent een roosterplanner voor een particulier beveiligingsbedrijf.
Je kent de CAO Particuliere Beveiliging 2024–2026. De volgende regels zijn HARDE CONSTRAINTS:

1. Maximaal 9 uur per dagdienst (CAO art. 4.2)
2. Maximaal 8 uur per nachtdienst (start 22:00–06:00) (CAO art. 4.3)
3. Minimaal 11 uur rust tussen diensten (CAO art. 5.1)
4. Maximaal 48 uur per week (CAO art. 4.1)
5. Maximaal 5 diensten per week (CAO art. 4.4)
6. Maximaal 6 aaneengesloten werkdagen (CAO art. 5.3)
7. Maximaal 3 aaneengesloten nachtdiensten (CAO art. 4.5)
8. Minimaal 2 uur dienst (CAO art. 4.6)
9. Minimaal 1 vrij weekend per 2 weken (CAO art. 5.4)
10. Geen gesplitste diensten met pauze > 1 uur (CAO art. 4.7)
11. Minimaal 14 uur herstel na nachtdienst (CAO art. 5.2)
12. Maximaal 40 uur overwerk per 4-weekse periode (CAO art. 6.1)
13. Controleer feestdagen (CAO art. 7.2)
14. Controleer zondagstoeslag (CAO art. 7.1)
15. Pauze verplicht bij > 5,5 uur dienst (CAO art. 5.5)
16. Nachtdiensten eindigen na middernacht — correct registreren (CAO art. 4.8)
17. Nachtdiensten alleen voor 18+ (CAO art. 9.1)
18. Contracturen niet meer dan 125% overschrijden per week (CAO art. 6.2)

Retourneer ALLEEN geldige JSON, geen tekst, geen markdown. Formaat:
{
  "suggestions": [
    { "employeeId": "uuid", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "locationLabel": "string|null" }
  ],
  "unfillable": [
    { "date": "YYYY-MM-DD", "reason": "Nederlandse uitleg" }
  ]
}`

export function buildCaoSystemPrompt(): string {
  return CAO_SYSTEM
}

export function buildSchedulePrompt(
  weekStart: string,
  employees: EmployeeInfo[],
  existingShifts: ShiftInfo[],
): string {
  const today = new Date().toISOString().slice(0, 10)

  const employeeList = employees.map(e => {
    const activeGrants = e.grants.filter(g =>
      (!g.startsAt || g.startsAt <= today) && (!g.expiresAt || g.expiresAt >= today),
    ).map(g => g.roleTypeName)

    const availability = e.availability.length
      ? e.availability.map(a => `dag ${a.dayOfWeek}: max ${a.maxHours}u`).join(', ')
      : 'geen beperkingen'

    return `- ${e.id} | ${e.firstName} ${e.lastName} | contract: ${e.contractHoursPerPeriod}u/4wk | rollen: ${activeGrants.join(', ') || 'geen'} | beschikbaarheid: ${availability}`
  }).join('\n')

  const shiftList = existingShifts.length
    ? existingShifts.map(s => `- ${s.profileId} | ${s.date} | ${s.startTime}–${s.endTime}${s.locationLabel ? ` @ ${s.locationLabel}` : ''}`).join('\n')
    : '(geen bestaande diensten)'

  return `Plan een compleet rooster voor week van ${weekStart}.

MEDEWERKERS:
${employeeList}

BESTAANDE DIENSTEN DEZE WEEK:
${shiftList}

Vul de openstaande plaatsen in. Respecteer beschikbaarheid, contracturen en alle 18 CAO-regels.
Plan alleen diensten voor medewerkers die nog niet zijn ingepland op die dag.`
}
