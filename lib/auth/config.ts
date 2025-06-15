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
            id: 'demo-agent-001',
            email: 'demo-operator@example.com',
            name: 'Demo Tour Operator',
            role: 'AGENT',
            tenantId: 'default'
          };
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            return null;
          }

          // Check password from the account table (temporary solution)
          const account = await prisma.account.findFirst({
            where: {
              userId: user.id,
              provider: 'credentials'
            }
          });
          
          if (!account?.refresh_token) {
            // For existing users without password, allow any password (demo mode)
            console.log('Demo mode: allowing login without password verification');
          } else {
            // Verify the password
            const passwordValid = await bcrypt.compare(credentials.password, account.refresh_token);
            if (!passwordValid) {
              return null;
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            tenantId: 'default' // Will be implemented with multi-tenancy
          };
        } catch (error) {
          console.error('Auth error:', error);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect to trips page
      return `${baseUrl}/trips`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production',
}; 