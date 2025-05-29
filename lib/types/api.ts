// Standard API response format
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string;
  };
}

// Trip related types
export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  participants?: string[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  participants?: string[];
}

// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'traveler';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

// CRM Integration types
export interface CrmContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  tripInterest?: string;
  budget?: number;
  travelDates?: {
    start: string;
    end: string;
  };
} 