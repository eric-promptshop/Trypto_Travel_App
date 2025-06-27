import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Handle demo accounts without database
        if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
          return {
            id: 'demo-traveler-001',
            email: 'demo@example.com',
            name: 'Demo Traveler',
            role: 'TRAVELER',
            tenantId: 'default'
          };
        }

        if (credentials.email === 'demo-operator@example.com' && credentials.password === 'demo123') {
          return {
            id: 'demo-operator-001',
            email: 'demo-operator@example.com',
            name: 'Demo Tour Operator',
            role: 'TOUR_OPERATOR',
            operatorId: 'demo-operator-001',
            operatorStatus: 'active',
            tenantId: 'default'
          };
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              operator: true,
              profile: true
            }
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify the password
          const passwordValid = await bcrypt.compare(credentials.password, user.password);
          if (!passwordValid) {
            return null;
          }

          // Prepare user data
          const userData: any = {
            id: user.id,
            email: user.email,
            name: user.profile?.firstName && user.profile?.lastName
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : user.name || user.email,
            role: user.role || 'TRAVELER',
            tenantId: user.tenantId || 'default'
          };

          // Add operator data if user is an operator
          if (user.operator) {
            userData.operatorId = user.operator.id;
            userData.operatorStatus = user.operator.status;
            userData.role = 'TOUR_OPERATOR';
          }

          return userData;
        } catch (error) {
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.operatorId = user.operatorId;
        token.operatorStatus = user.operatorStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.operatorId = token.operatorId as string;
        session.user.operatorStatus = token.operatorStatus as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect based on role
      const token = url.includes('callbackUrl=') 
        ? new URLSearchParams(url.split('?')[1]).get('callbackUrl')
        : null;
      
      if (token?.includes('operator')) {
        return `${baseUrl}/operator/dashboard`;
      }
      
      // Default redirect to trips page for travelers
      return `${baseUrl}/trips`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production',
}; 