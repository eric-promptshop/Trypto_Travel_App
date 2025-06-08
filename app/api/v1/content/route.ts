import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation } from '@/lib/middleware/tenant';

// GET /api/v1/content - List tenant content
export const GET = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = {
      tenantId: tenantContext.tenantId,
      ...(type && { contentType: type }),
      ...(category && { category }),
    };

    const [content, total] = await Promise.all([
      prisma.tenantContent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.tenantContent.count({ where })
    ]);

    return NextResponse.json({
      content,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching tenant content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
});

// POST /api/v1/content - Create new content
export const POST = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    const body = await request.json();
    const { title, content, contentType, category, metadata, status = 'draft' } = body;

    if (!title || !content || !contentType) {
      return NextResponse.json(
        { error: 'Title, content, and content type are required' },
        { status: 400 }
      );
    }

    const newContent = await prisma.tenantContent.create({
      data: {
        title,
        content,
        contentType,
        category,
        metadata: metadata || {},
        status,
        tenantId: tenantContext.tenantId,
        authorId: tenantContext.userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}); 