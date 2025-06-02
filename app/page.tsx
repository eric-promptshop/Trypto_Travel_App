"use client"

import { ItineraryBuilder } from "@/components/itinerary-builder"
import { Button } from "@/components/atoms"
import { TripCard } from "@/components/molecules/TripCard"
import { useTripContext } from "@/contexts/TripContext"
import Link from "next/link"

function TestComponents() {
  const { trips, addTrip } = useTripContext()

  const handleSelectTrip = (id: string) => {
    console.log('Selected trip:', id)
  }

  const handleAddTrip = () => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      name: `Sample Trip ${trips.length + 1}`
    }
    addTrip(newTrip)
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Atomic Design Components Test</h2>
      
      {/* Navigation to Demo Pages */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Navigation to Demo Pages:</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/itinerary-display" className="inline-block">
            <Button variant="primary">📅 Itinerary Display (Task 6.1)</Button>
          </Link>
          <Link href="/demo/activity-selection" className="inline-block">
            <Button variant="secondary">🎯 Activity Selection</Button>
          </Link>
          <Link href="/demo/drag-drop-timeline" className="inline-block">
            <Button variant="secondary">🔄 Drag & Drop Timeline</Button>
          </Link>
          <Link href="/demo/real-time-pricing" className="inline-block">
            <Button variant="secondary">💰 Real-time Pricing</Button>
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Button Atom Variants:</h3>
        <div className="flex gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button onClick={handleAddTrip}>Add Trip (Context Test)</Button>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Trips in context: {trips.length}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">TripCard Molecule:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          <TripCard
            id="1"
            name="Peru Adventure"
            description="Explore the ancient wonders of Machu Picchu and the Sacred Valley"
            imageUrl="/images/machu-picchu.png"
            onSelect={handleSelectTrip}
          />
          <TripCard
            id="2"
            name="Brazil Explorer"
            description="Discover the vibrant culture and natural beauty of Brazil"
            onSelect={handleSelectTrip}
          />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Trypto AI Trip Builder
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Create personalized travel itineraries with AI-powered recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Demo Pages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Demo Pages</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/demo/form" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → AI-Powered Form Builder
              </Link>
            </li>
            <li>
              <Link href="/demo/itinerary" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Visual Itinerary Display
              </Link>
            </li>
            <li>
              <Link href="/demo/customization" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Interactive Customization
              </Link>
            </li>
            <li>
              <Link href="/demo/content-processing" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Content Processing System
              </Link>
            </li>
            <li>
              <Link href="/demo/generation" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Itinerary Generation
              </Link>
            </li>
            <li>
              <Link href="/demo/testing" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Component Testing
              </Link>
            </li>
            <li>
              <Link href="/demo/crm" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → CRM Integration Demo
              </Link>
            </li>
            <li>
              <Link href="/demo/mobile-audit" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → Mobile Usability Audit
              </Link>
            </li>
            <li>
              <Link href="/demo/one-handed-mode" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → One-Handed Mode Demo
              </Link>
            </li>
          </ul>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Features</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✓ Intelligent questionnaire interface</li>
            <li>✓ Voice-to-text input support</li>
            <li>✓ Real-time itinerary generation</li>
            <li>✓ Interactive customization</li>
            <li>✓ Mobile-optimized design</li>
            <li>✓ Multi-tenant architecture</li>
            <li>✓ White-label support</li>
            <li>✓ CRM integration ready</li>
          </ul>
        </div>

        {/* Architecture */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Technical Stack</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Next.js 15 (App Router)</li>
            <li>• TypeScript</li>
            <li>• Tailwind CSS</li>
            <li>• React Hook Form</li>
            <li>• Framer Motion</li>
            <li>• Web Speech API</li>
            <li>• React Beautiful DnD</li>
            <li>• CRM Placeholders</li>
          </ul>
        </div>

        {/* Admin Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Admin Tools</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/admin/crm" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block">
                → CRM Management Dashboard
              </Link>
            </li>
          </ul>
        </div>

        {/* API Endpoints */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">API Endpoints</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• /api/itinerary/generate</li>
            <li>• /api/destinations/search</li>
            <li>• /api/content/process</li>
            <li>• /api/webhooks/crm</li>
            <li>• /api/placeholder/[width]/[height]</li>
          </ul>
        </div>

        {/* Development Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Development Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">System Architecture</span>
              <span className="text-green-600 dark:text-green-400">✓ Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Content Processing</span>
              <span className="text-green-600 dark:text-green-400">✓ Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">AI Form Builder</span>
              <span className="text-green-600 dark:text-green-400">✓ Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Itinerary Generation</span>
              <span className="text-green-600 dark:text-green-400">✓ Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Visual Display</span>
              <span className="text-green-600 dark:text-green-400">✓ Complete</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">CRM Integration</span>
              <span className="text-green-600 dark:text-green-400">✓ Placeholders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Start</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Visit the <Link href="/demo/form" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">AI Form Builder</Link> to see the intelligent questionnaire</li>
          <li>Check out the <Link href="/demo/generation" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Itinerary Generation</Link> demo</li>
          <li>Explore the <Link href="/demo/itinerary" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Visual Display</Link> for mobile-optimized layouts</li>
          <li>Try the <Link href="/demo/customization" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Interactive Customization</Link> features</li>
          <li>Test the <Link href="/demo/crm" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">CRM Integration</Link> placeholders</li>
        </ol>
      </div>
    </main>
  )
}
