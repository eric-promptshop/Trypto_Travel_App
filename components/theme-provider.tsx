'use client'

import * as React from 'react'

// Since we're only supporting light mode, we can simplify the theme provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
