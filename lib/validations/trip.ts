import { z } from 'zod';

// Trip creation schema
export const createTripSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  startDate: z.string()
    .datetime('Invalid start date format'),
  endDate: z.string()
    .datetime('Invalid end date format'),
  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters'),
  participants: z.array(z.string().uuid('Invalid participant ID'))
    .optional()
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

// Trip update schema (all fields optional except ID)
export const updateTripSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  participants: z.array(z.string().uuid('Invalid participant ID'))
    .optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'])
    .optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

// Trip query parameters schema
export const tripQuerySchema = z.object({
  page: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'])
    .optional(),
  location: z.string()
    .min(1)
    .optional(),
  startDate: z.string()
    .datetime()
    .optional(),
  endDate: z.string()
    .datetime()
    .optional()
});

// Trip ID parameter schema
export const tripIdSchema = z.object({
  id: z.string().uuid('Invalid trip ID format')
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripQueryInput = z.infer<typeof tripQuerySchema>;
export type TripIdInput = z.infer<typeof tripIdSchema>; 