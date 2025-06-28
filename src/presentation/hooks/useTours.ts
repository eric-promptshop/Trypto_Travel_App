import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Tour {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  destinations: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourData {
  title: string;
  description: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  destinations: string[];
  activities: Array<{
    title: string;
    description: string;
    duration?: string;
    price?: number;
  }>;
  images: Array<{
    url: string;
    alt: string;
  }>;
  included?: string[];
  excluded?: string[];
  languages?: string[];
}

export interface UseTours {
  tours: Tour[];
  loading: boolean;
  error: string | null;
  stats: {
    draft: number;
    published: number;
    archived: number;
    total: number;
  } | null;
  createTour: (data: CreateTourData) => Promise<Tour>;
  updateTour: (tourId: string, updates: Partial<CreateTourData>) => Promise<Tour>;
  publishTour: (tourId: string) => Promise<Tour>;
  archiveTour: (tourId: string) => Promise<void>;
  duplicateTour: (tourId: string) => Promise<Tour>;
  fetchTours: (options?: { includeArchived?: boolean }) => Promise<void>;
  fetchStats: () => Promise<void>;
}

/**
 * Hook for managing tours using the new service architecture
 */
export function useTours(): UseTours {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseTours['stats']>(null);

  const fetchTours = useCallback(async (options?: { includeArchived?: boolean }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (options?.includeArchived) {
        params.append('includeArchived', 'true');
      }
      
      const response = await fetch(`/api/v1/tours?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tours');
      }
      
      const result = await response.json();
      setTours(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tours';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/tours/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createTour = useCallback(async (data: CreateTourData): Promise<Tour> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tour');
      }
      
      const tour = await response.json();
      setTours(prev => [tour, ...prev]);
      
      toast.success('Tour created successfully');
      
      // Refresh stats
      fetchStats();
      
      return tour;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tour';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const updateTour = useCallback(async (tourId: string, updates: Partial<CreateTourData>): Promise<Tour> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/tours/${tourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tour');
      }
      
      const tour = await response.json();
      setTours(prev => prev.map(t => t.id === tourId ? tour : t));
      
      toast.success('Tour updated successfully');
      
      return tour;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tour';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishTour = useCallback(async (tourId: string): Promise<Tour> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/tours/${tourId}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish tour');
      }
      
      const tour = await response.json();
      setTours(prev => prev.map(t => t.id === tourId ? tour : t));
      
      toast.success('Tour published successfully');
      
      // Refresh stats
      fetchStats();
      
      return tour;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish tour';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const archiveTour = useCallback(async (tourId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/tours/${tourId}/archive`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive tour');
      }
      
      setTours(prev => prev.map(t => 
        t.id === tourId ? { ...t, status: 'ARCHIVED' } : t
      ));
      
      toast.success('Tour archived successfully');
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive tour';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  const duplicateTour = useCallback(async (tourId: string): Promise<Tour> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/tours/${tourId}/duplicate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate tour');
      }
      
      const tour = await response.json();
      setTours(prev => [tour, ...prev]);
      
      toast.success('Tour duplicated successfully');
      
      // Refresh stats
      fetchStats();
      
      return tour;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate tour';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  return {
    tours,
    loading,
    error,
    stats,
    createTour,
    updateTour,
    publishTour,
    archiveTour,
    duplicateTour,
    fetchTours,
    fetchStats
  };
}