'use client';

import { useEffect, useState } from 'react';
import { useTours } from '@/src/presentation/hooks/useTours';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';

/**
 * Example component demonstrating the new service architecture
 * This shows how clean the component code becomes when using proper services
 */
export function TourManagementExample() {
  const {
    tours,
    loading,
    error,
    stats,
    createTour,
    publishTour,
    archiveTour,
    fetchTours,
    fetchStats
  } = useTours();

  // Fetch data on mount
  useEffect(() => {
    fetchTours();
    fetchStats();
  }, [fetchTours, fetchStats]);

  // Example: Create a new tour
  const handleCreateTour = async () => {
    try {
      await createTour({
        title: 'Amazing Paris Tour',
        description: 'Experience the magic of Paris with our guided tour',
        duration: 3,
        price: { amount: 299, currency: 'USD' },
        destinations: ['Paris', 'Versailles'],
        activities: [
          {
            title: 'Eiffel Tower Visit',
            description: 'Skip-the-line access to the iconic Eiffel Tower',
            duration: '2 hours',
            price: 50
          },
          {
            title: 'Louvre Museum Tour',
            description: 'Guided tour of the world-famous Louvre Museum',
            duration: '3 hours',
            price: 75
          }
        ],
        images: [
          {
            url: 'https://example.com/paris-tour.jpg',
            alt: 'Paris Tour'
          }
        ],
        included: ['Professional guide', 'Skip-the-line tickets', 'Hotel pickup'],
        excluded: ['Meals', 'Personal expenses'],
        languages: ['English', 'French', 'Spanish']
      });
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  if (loading && tours.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Tours</h2>
        <Button onClick={handleCreateTour} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tour
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tours List */}
      <div className="grid gap-4">
        {tours.map((tour) => (
          <Card key={tour.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{tour.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tour.description}
                  </p>
                </div>
                <Badge 
                  variant={
                    tour.status === 'PUBLISHED' ? 'default' :
                    tour.status === 'DRAFT' ? 'secondary' :
                    'outline'
                  }
                >
                  {tour.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Duration:</span> {tour.duration} days
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Price:</span> ${tour.price.amount} {tour.price.currency}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Destinations:</span> {tour.destinations.join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {tour.status === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => publishTour(tour.id)}
                      disabled={loading}
                    >
                      Publish
                    </Button>
                  )}
                  {tour.status !== 'ARCHIVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveTour(tour.id)}
                      disabled={loading}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tours.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any tours yet
              </p>
              <Button onClick={handleCreateTour}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}