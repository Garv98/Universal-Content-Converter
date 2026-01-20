import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { AccessibilityProvider, AccessibilityPanel, ReadingGuide, TextSelectionReader } from "@/components/accessibility-panel"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Universal UDL Converter",
  description: "AI-Powered Accessibility Platform for Universal Design for Learning",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {/* Skip link for keyboard accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        {/* Color blindness filter SVGs */}
        <svg className="sr-only" aria-hidden="true">
          <defs>
            {/* Protanopia (red-blind) correction filter */}
            <filter id="protanopia-filter">
              <feColorMatrix type="matrix" values="
                0.567, 0.433, 0,     0, 0
                0.558, 0.442, 0,     0, 0
                0,     0.242, 0.758, 0, 0
                0,     0,     0,     1, 0
              "/>
            </filter>
            {/* Deuteranopia (green-blind) correction filter */}
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="
                0.625, 0.375, 0,   0, 0
                0.7,   0.3,   0,   0, 0
                0,     0.3,   0.7, 0, 0
                0,     0,     0,   1, 0
              "/>
            </filter>
            {/* Tritanopia (blue-blind) correction filter */}
            <filter id="tritanopia-filter">
              <feColorMatrix type="matrix" values="
                0.95, 0.05,  0,     0, 0
                0,    0.433, 0.567, 0, 0
                0,    0.475, 0.525, 0, 0
                0,    0,     0,     1, 0
              "/>
            </filter>
          </defs>
        </svg>

        <AccessibilityProvider>
          <AuthProvider>
            <main id="main-content">
              {children}
            </main>
          </AuthProvider>
          <AccessibilityPanel />
          <ReadingGuide />
          <TextSelectionReader />
        </AccessibilityProvider>
        <Analytics />
      </body>
    </html>
  )
}
