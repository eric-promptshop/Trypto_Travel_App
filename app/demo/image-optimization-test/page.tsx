import Image from 'next/image'
import { useState } from 'react'

export default function ImageOptimizationTestPage() {
  const [showLazy, setShowLazy] = useState(false)
  return (
    <main className="p-8 max-w-2xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold mb-6">Image Optimization Test Page</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Responsive Image (srcset/sizes)</h2>
        <Image
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80"
          alt="Responsive mountain"
          width={800}
          height={533}
          sizes="(max-width: 600px) 100vw, 800px"
          style={{ width: '100%', height: 'auto' }}
          priority
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Blur-up Placeholder</h2>
        <Image
          src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=600&q=80"
          alt="Blur-up beach"
          width={600}
          height={400}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          style={{ width: '100%', height: 'auto' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Image with Alt Text</h2>
        <Image
          src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&q=80"
          alt="Dog in a car"
          width={400}
          height={267}
          style={{ width: '100%', height: 'auto' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Broken Image (404)</h2>
        <img
          src="/images/does-not-exist.jpg"
          alt="Broken image"
          width={300}
          height={200}
          style={{ width: '100%', height: 'auto', border: '1px solid #ccc' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">WebP Image</h2>
        <img
          src="https://www.gstatic.com/webp/gallery/1.sm.webp"
          alt="WebP sample"
          width={300}
          height={200}
          style={{ width: '100%', height: 'auto' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Large Image (Layout Shift)</h2>
        <Image
          src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?w=1200&q=80"
          alt="Large cityscape"
          width={1200}
          height={800}
          style={{ width: '100%', height: 'auto' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Image with No Width/Height</h2>
        <img
          src="https://via.placeholder.com/350x150"
          alt="No width/height"
          style={{ width: '100%', height: 'auto' }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Lazy-loaded Image (appears after scroll)</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded mb-2"
          onClick={() => setShowLazy(true)}
        >
          Show Lazy Image
        </button>
        {showLazy && (
          <Image
            src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=500&q=80"
            alt="Lazy loaded"
            width={500}
            height={333}
            loading="lazy"
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </section>
    </main>
  )
} 