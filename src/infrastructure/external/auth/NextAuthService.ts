import { injectable } from 'inversify';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { AuthService } from '@/src/presentation/controllers/TourController';

@injectable()
export class NextAuthService implements AuthService {
  async authenticate(request: Request): Promise<{ userId: string; email: string } | null> {
    try {
      // Get session from NextAuth
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return null;
      }

      return {
        userId: session.user.id || session.user.email,
        email: session.user.email
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async getSession() {
    return getServerSession(authOptions);
  }

  async hasRole(request: Request, role: string): Promise<boolean> {
    const session = await this.getSession();
    return session?.user?.role === role;
  }

  async isOperator(request: Request): Promise<boolean> {
    const session = await this.getSession();
    return session?.user?.role === 'TOUR_OPERATOR';
  }

  async getOperatorId(request: Request): Promise<string | null> {
    const session = await this.getSession();
    return session?.user?.operatorId || null;
  }
}