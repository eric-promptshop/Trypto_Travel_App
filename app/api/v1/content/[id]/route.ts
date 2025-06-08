import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation } from '@/lib/middleware/tenant';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/v1/content/[id] - Get single content item
export const GET = withTenantIsolation(async (tenantContext, request: NextRequest, { params }: RouteParams) => {
  try {
    const content = await prisma.tenantContent.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
});

// PUT /api/v1/content/[id] - Update content item
export const PUT = withTenantIsolation(async (tenantContext, request: NextRequest, { params }: RouteParams) => {
  try {
    const body = await request.json();
    const { title, content, contentType, category, metadata, status } = body;

    // Check if content exists and belongs to tenant
    const existingContent = await prisma.tenantContent.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      }
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const updatedContent = await prisma.tenantContent.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(contentType && { contentType }),
        ...(category !== undefined && { category }),
        ...(metadata !== undefined && { metadata }),
        ...(status && { status }),
        version: { increment: 1 },
        ...(status === 'published' && { publishedAt: new Date() }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
});

// DELETE /api/v1/content/[id] - Delete content item
export const DELETE = withTenantIsolation(async (tenantContext, request: NextRequest, { params }: RouteParams) => {
  try {
    // Check if content exists and belongs to tenant
    const existingContent = await prisma.tenantContent.findFirst({
      where: {
        id: params.id,
        tenantId: tenantContext.tenantId,
      }
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    await prisma.tenantContent.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}); 