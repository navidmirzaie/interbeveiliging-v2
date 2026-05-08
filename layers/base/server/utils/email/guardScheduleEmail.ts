type ShiftRow = {
  date: string
  startTime: string
  endTime: string
  locationLabel: string | null
}

type Params = {
  orgName: string
  logoUrl: string | null
  weekLabel: string
  shifts: ShiftRow[]
}

export function guardScheduleEmail({ orgName, logoUrl, weekLabel, shifts }: Params): string {
  const rows = shifts.map(s => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A">${s.date}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A">${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B">${s.locationLabel ?? '—'}</td>
    </tr>`).join('')

  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="height: 32px; margin-bottom: 12px">`
    : `<div style="font-size: 18px; font-weight: 700; color: #1E3A5F; margin-bottom: 12px">${orgName}</div>`

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #F1F5F9; margin: 0; padding: 32px 16px">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.07)">
    <div style="background: #1E3A5F; padding: 24px 32px">
      ${logo}
      <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0">Uw rooster — ${weekLabel}</h1>
    </div>
    <div style="padding: 24px 32px">
      <p style="font-size: 14px; color: #64748B; margin: 0 0 20px">Hieronder uw ingeplande diensten voor ${weekLabel}:</p>
      ${shifts.length ? `
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden">
          <thead>
            <tr style="background: #F1F5F9">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8">Datum</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8">Tijd</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8">Locatie</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '<p style="font-size: 13px; color: #94A3B8">Geen diensten gepland deze week.</p>'}
      <p style="font-size: 12px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px">
        Dit bericht is automatisch gegenereerd door ${orgName} via InterBeveiliging.
      </p>
    </div>
  </div>
</body>
</html>`
}
