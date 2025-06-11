import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{
    width: string;
    height: string;
  }>;
}

export async function GET(request: NextRequest, context: Params) {
  const { width, height } = await context.params;
  
  // Parse dimensions with defaults
  const w = parseInt(width) || 400;
  const h = parseInt(height) || 300;
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#e2e8f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="16" fill="#64748b">
        ${w} × ${h}
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 