import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function requireOperatorAuth(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token) {
    // Not authenticated
    const signInUrl = new URL('/auth/operator/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (token.role !== 'TOUR_OPERATOR' && token.role !== 'ADMIN') {
    // Not an operator
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
  }

  if (token.operatorStatus === 'suspended' || token.operatorStatus === 'inactive') {
    // Operator account is not active
    return NextResponse.redirect(new URL('/operator/suspended', request.url))
  }

  // Allow access
  return NextResponse.next()
}

export function isOperatorPath(pathname: string): boolean {
  return pathname.startsWith('/operator') || pathname.startsWith('/api/operator')
}