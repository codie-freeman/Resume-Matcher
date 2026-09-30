import type { Metadata } from 'next';
import { Geist, Space_Grotesk, Merriweather } from 'next/font/google';
import './(default)/css/globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

// LaTeX resume template's signature serif typeface (see TEMPLATE_FONT_PRESETS
// in lib/types/template-settings.ts). Loaded here, on the root layout, so it's
// available both in the interactive builder and the print/PDF pages.
const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Resume Matcher',
  description: 'Build your resume with Resume Matcher',
  applicationName: 'Resume Matcher',
  keywords: ['resume', 'matcher', 'job', 'application'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${spaceGrotesk.variable} ${merriweather.variable} antialiased bg-background text-ink-soft min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}
