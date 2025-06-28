/**
 * Shared types across the domain
 */

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchCriteria {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationOptions;
}

export interface Money {
  amount: number;
  currency: string;
}

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  static create(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }
}

export interface Image {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Location {
  address: string;
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}