type GuardSummary = {
  name: string
  shifts: { date: string; startTime: string; endTime: string; locationLabel: string | null }[]
}

type Params = {
  orgName: string
  logoUrl: string | null
  weekLabel: string
  guards: GuardSummary[]
}

export function plannerOverviewEmail({ orgName, logoUrl, weekLabel, guards }: Params): string {
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="height: 32px; margin-bottom: 12px">`
    : `<div style="font-size: 18px; font-weight: 700; color: #1E3A5F; margin-bottom: 12px">${orgName}</div>`

  const guardSections = guards.map(g => {
    const rows = g.shifts.map(s => `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #0F172A">${s.date}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #0F172A">${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B">${s.locationLabel ?? '—'}</td>
      </tr>`).join('')

    return `
      <div style="margin-bottom: 20px">
        <p style="font-size: 13px; font-weight: 600; color: #0F172A; margin: 0 0 8px">${g.name}</p>
        ${g.shifts.length ? `
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 6px">
            <thead><tr style="background: #F1F5F9">
              <th style="padding: 6px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94A3B8">Datum</th>
              <th style="padding: 6px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94A3B8">Tijd</th>
              <th style="padding: 6px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94A3B8">Locatie</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>` : '<p style="font-size: 12px; color: #94A3B8">Geen diensten</p>'}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #F1F5F9; margin: 0; padding: 32px 16px">
  <div style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.07)">
    <div style="background: #1E3A5F; padding: 24px 32px">
      ${logo}
      <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0">Roosteroverzicht — ${weekLabel}</h1>
    </div>
    <div style="padding: 24px 32px">
      <p style="font-size: 14px; color: #64748B; margin: 0 0 20px">Overzicht van alle ingeplande medewerkers voor ${weekLabel}:</p>
      ${guardSections || '<p style="font-size: 13px; color: #94A3B8">Geen medewerkers ingepland.</p>'}
      <p style="font-size: 12px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px">
        Dit bericht is automatisch gegenereerd door ${orgName} via InterBeveiliging.
      </p>
    </div>
  </div>
</body>
</html>`
}
