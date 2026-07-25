import type { Metadata } from "next"

import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { DEFAULT_LOCALE, getDocumentLang, studioMessages } from "@/lib/i18n"
import "./globals.css"

export const metadata: Metadata = {
  title: studioMessages[DEFAULT_LOCALE].metadataTitle,
  description: studioMessages[DEFAULT_LOCALE].metadataDescription,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={getDocumentLang(DEFAULT_LOCALE)} translate="no" className="h-full antialiased" suppressHydrationWarning>
      <body className="notranslate flex min-h-full flex-col" translate="no" suppressHydrationWarning>
        <Providers>{children}<Toaster richColors position="top-center" /></Providers>
      </body>
    </html>
  )
}
