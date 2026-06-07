import type { Metadata } from 'next'
import './space-age-general.css'
import './duotronics-theme.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Duotronics',
  description: 'Dual hemisphere AI processing — an experiment',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/duotron_favicon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,900;1,400&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
