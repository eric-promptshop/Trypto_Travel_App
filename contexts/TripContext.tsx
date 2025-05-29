"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Trip {
  id: string;
  name: string;
  // Add more fields as needed
}

interface TripContextType {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>([]);

  const addTrip = (trip: Trip) => setTrips((prev) => [...prev, trip]);

  return (
    <TripContext.Provider value={{ trips, addTrip }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
}; 