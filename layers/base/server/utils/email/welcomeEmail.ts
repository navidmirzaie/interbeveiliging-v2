type Params = {
  orgName: string
  logoUrl: string | null
  firstName: string
  email: string
  password: string
  platformUrl: string
}

export function welcomeEmail({ orgName, logoUrl, firstName, email, password, platformUrl }: Params): string {
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
      <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0">Welkom bij ${orgName}</h1>
    </div>
    <div style="padding: 24px 32px">
      <p style="font-size: 14px; color: #0F172A; margin: 0 0 16px">Hallo ${firstName},</p>
      <p style="font-size: 14px; color: #64748B; margin: 0 0 24px">
        Uw account is aangemaakt. Hieronder vindt u uw inloggegevens. Log in en wijzig uw wachtwoord direct na de eerste keer inloggen.
      </p>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px">
        <div style="margin-bottom: 12px">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8">Gebruikersnaam (e-mail)</span>
          <div style="font-size: 14px; font-weight: 600; color: #0F172A; margin-top: 4px">${email}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8">Tijdelijk wachtwoord</span>
          <div style="font-size: 14px; font-weight: 600; color: #0F172A; font-family: monospace; margin-top: 4px">${password}</div>
        </div>
      </div>

      <a href="${platformUrl}" style="display: inline-block; background: #1E3A5F; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-bottom: 24px">
        Inloggen op het platform
      </a>

      <p style="font-size: 13px; color: #F59E0B; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 10px 14px; margin: 0 0 24px">
        ⚠️ Wijzig uw wachtwoord direct na het eerste inloggen.
      </p>

      <p style="font-size: 12px; color: #94A3B8; margin: 0; border-top: 1px solid #E2E8F0; padding-top: 16px">
        Dit bericht is automatisch gegenereerd door ${orgName} via InterBeveiliging.
      </p>
    </div>
  </div>
</body>
</html>`
}
