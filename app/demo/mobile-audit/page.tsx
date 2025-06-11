'use client'

import { MobileAuditDashboard } from '@/components/mobile-audit/mobile-audit-dashboard'
import { AuditRunner } from '@/components/mobile-audit/audit-runner'
import { TouchTargetGuide } from '@/components/mobile-audit/touch-target-guide'

export default function MobileAuditPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold mb-2">Mobile Usability Audit Tools</h1>
        
        {/* Quick audit for current page */}
        <AuditRunner />
        
        {/* Touch target visual guide */}
        <TouchTargetGuide />
        
        {/* Full audit dashboard */}
        <MobileAuditDashboard />
      </div>
    </div>
  )
} 