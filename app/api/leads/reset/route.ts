import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint is for development/testing only
  // In production, you'd want to protect this with authentication
  
  const keysToRemove = [
    'lead_popup_converted',
    'lead_popup_email',
    'lead_popup_last_shown',
    'lead_popup_skipped',
    'lead_popup_skip_time'
  ]
  
  return NextResponse.json({
    message: 'Lead popup state reset. Clear localStorage with these keys:',
    keys: keysToRemove,
    instructions: 'Run this in browser console: ' + keysToRemove.map(k => `localStorage.removeItem('${k}')`).join('; ')
  })
}