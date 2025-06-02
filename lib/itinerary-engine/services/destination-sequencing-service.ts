import { 
  DestinationSequencingService,
  SequencingConstraints,
  SequencedDestination,
  TravelTimeResult,
  SequenceValidation,
  SequenceIssue
} from '../types'
import { 
  Destination,
  UserPreferences,
  Transportation,
  Money,
  Coordinates
} from '@/lib/types/itinerary'

/**
 * Implementation of the destination sequencing service
 * Handles geographic clustering, travel optimization, and logical sequencing of destinations
 */
export class DefaultDestinationSequencingService implements DestinationSequencingService {
  private readonly config: SequencingConfig
  private readonly cache: Map<string, TravelTimeResult> = new Map()

  constructor(config: Partial<SequencingConfig> = {}) {
    this.config = {
      maxTravelTimePerDay: 480, // 8 hours max
      clusteringThreshold: 100, // 100km for clustering
      enableCaching: true,
      parallelProcessing: true,
      optimizationAlgorithm: 'hybrid',
      ...config
    }
  }

  /**
   * Calculate optimal sequence for visiting destinations
   */
  async optimizeSequence(
    destinations: Destination[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<SequencedDestination[]> {
    const startTime = Date.now()
    
    try {
      // Step 1: Apply geographic clustering
      const clusters = await this.clusterDestinations(destinations, constraints)
      
      // Step 2: Optimize sequence within and between clusters
      const optimizedSequence = await this.optimizeClusterSequence(clusters, preferences, constraints)
      
      // Step 3: Allocate days and calculate travel times
      const sequencedDestinations = await this.allocateDaysAndTravelTimes(
        optimizedSequence, 
        preferences, 
        constraints
      )
      
      // Step 4: Validate the sequence
      const validation = this.validateSequence(sequencedDestinations)
      
      if (!validation.valid) {
        console.warn('Generated sequence has validation issues:', validation.issues)
        // Attempt to fix issues automatically
        return this.fixSequenceIssues(sequencedDestinations, validation.issues)
      }
      
      const endTime = Date.now()
      console.log(`Destination sequencing completed in ${endTime - startTime}ms`)
      
      return sequencedDestinations
    } catch (error) {
      console.error('Error in destination sequencing:', error)
      throw new Error(`Failed to optimize destination sequence: ${(error as Error).message}`)
    }
  }

  /**
   * Calculate travel time between destinations
   */
  async calculateTravelTime(
    from: Destination,
    to: Destination,
    transportType: string
  ): Promise<TravelTimeResult> {
    const cacheKey = `${from.id}-${to.id}-${transportType}`
    
    // Check cache first
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    try {
      // Calculate distance using haversine formula
      const distance = this.calculateDistance(from.coordinates, to.coordinates)
      
      // Estimate travel time based on transport type and distance
      const travelTime = this.estimateTravelTimeByTransport(distance, transportType)
      
      // Create transportation options
      const transportationOptions = this.generateTransportationOptions(
        from, 
        to, 
        transportType, 
        distance, 
        travelTime
      )
      
      // Estimate cost
      const cost = this.estimateTravelCost(distance, transportType, from.localCurrency)
      
      const result: TravelTimeResult = {
        duration: travelTime,
        distance,
        transportationOptions,
        cost
      }
      
      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, result)
      }
      
      return result
    } catch (error) {
      console.error(`Error calculating travel time from ${from.id} to ${to.id}:`, error)
      throw new Error(`Failed to calculate travel time: ${(error as Error).message}`)
    }
  }

  /**
   * Validate that a sequence is logically feasible
   */
  validateSequence(sequence: SequencedDestination[]): SequenceValidation {
    const issues: SequenceIssue[] = []
    let totalTravelTime = 0
    let totalDistance = 0

    // Check each destination in sequence
    for (let i = 0; i < sequence.length; i++) {
      const current = sequence[i]
      
      // Validate dates
      if (new Date(current.arrivalDate) > new Date(current.departureDate)) {
        issues.push({
          type: 'logistics',
          severity: 'error',
          message: `Arrival date is after departure date for ${current.title}`,
          affectedDestinations: [current.id]
        })
      }
      
      // Validate day allocation
      if (current.daysAllocated < 1) {
        issues.push({
          type: 'logistics',
          severity: 'error',
          message: `Insufficient days allocated for ${current.title}`,
          affectedDestinations: [current.id]
        })
      }
      
      if (i > 0) {
        const previous = sequence[i - 1]
        totalTravelTime += current.travelTimeFromPrevious
        
        // Validate travel time constraints
        if (current.travelTimeFromPrevious > this.config.maxTravelTimePerDay) {
          issues.push({
            type: 'travel_time',
            severity: 'warning',
            message: `Travel time from ${previous.title} to ${current.title} exceeds daily limit`,
            affectedDestinations: [previous.id, current.id]
          })
        }
        
        // Validate logical sequence timing
        const prevDeparture = new Date(previous.departureDate)
        const currentArrival = new Date(current.arrivalDate)
        const timeDiff = (currentArrival.getTime() - prevDeparture.getTime()) / (1000 * 60) // minutes
        
        if (timeDiff < current.travelTimeFromPrevious) {
          issues.push({
            type: 'timing',
            severity: 'error',
            message: `Insufficient time for travel from ${previous.title} to ${current.title}`,
            affectedDestinations: [previous.id, current.id]
          })
        }
      }
      
      // Calculate total distance (approximate)
      if (i > 0) {
        totalDistance += this.calculateDistance(
          sequence[i - 1].coordinates,
          current.coordinates
        )
      }
    }

    // Overall validation checks
    const totalDuration = sequence.reduce((sum, dest) => sum + dest.daysAllocated, 0)
    if (totalDuration > 30) { // Example: warn for trips longer than 30 days
      issues.push({
        type: 'logistics',
        severity: 'warning',
        message: 'Trip duration is very long, consider breaking into multiple trips',
        affectedDestinations: sequence.map(d => d.id)
      })
    }

    return {
      valid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      totalTravelTime,
      totalDistance
    }
  }

  // Private implementation methods

  /**
   * Cluster destinations geographically for efficient routing
   */
  private async clusterDestinations(
    destinations: Destination[],
    constraints: SequencingConstraints
  ): Promise<DestinationCluster[]> {
    if (destinations.length <= 1) {
      return destinations.map((dest, index) => ({
        id: `cluster-${index}`,
        destinations: [dest],
        centroid: dest.coordinates,
        radius: 0
      }))
    }

    // Use a simple distance-based clustering algorithm
    const clusters: DestinationCluster[] = []
    const unprocessed = [...destinations]

    while (unprocessed.length > 0) {
      const seed = unprocessed.shift()!
      const cluster: DestinationCluster = {
        id: `cluster-${clusters.length}`,
        destinations: [seed],
        centroid: seed.coordinates,
        radius: 0
      }

      // Find nearby destinations to add to this cluster
      for (let i = unprocessed.length - 1; i >= 0; i--) {
        const candidate = unprocessed[i]
        const distance = this.calculateDistance(seed.coordinates, candidate.coordinates)
        
        if (distance <= this.config.clusteringThreshold) {
          cluster.destinations.push(candidate)
          unprocessed.splice(i, 1)
        }
      }

      // Recalculate centroid and radius
      if (cluster.destinations.length > 1) {
        cluster.centroid = this.calculateCentroid(cluster.destinations.map(d => d.coordinates))
        cluster.radius = Math.max(...cluster.destinations.map(d => 
          this.calculateDistance(cluster.centroid, d.coordinates)
        ))
      }

      clusters.push(cluster)
    }

    return clusters
  }

  /**
   * Optimize the sequence of clusters and destinations within clusters
   */
  private async optimizeClusterSequence(
    clusters: DestinationCluster[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<Destination[]> {
    // If only one cluster, optimize within cluster
    if (clusters.length === 1) {
      return this.optimizeWithinCluster(clusters[0], preferences, constraints)
    }

    // Optimize sequence between clusters using TSP-like approach
    const clusterSequence = await this.optimizeClusterOrder(clusters, constraints)
    
    // Optimize within each cluster and concatenate results
    const optimizedDestinations: Destination[] = []
    
    for (const cluster of clusterSequence) {
      const clusterDestinations = await this.optimizeWithinCluster(cluster, preferences, constraints)
      optimizedDestinations.push(...clusterDestinations)
    }

    return optimizedDestinations
  }

  /**
   * Optimize destination order within a single cluster
   */
  private async optimizeWithinCluster(
    cluster: DestinationCluster,
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<Destination[]> {
    if (cluster.destinations.length <= 1) {
      return cluster.destinations
    }

    // Use nearest neighbor algorithm for small clusters
    if (cluster.destinations.length <= 5) {
      return this.nearestNeighborOptimization(cluster.destinations, constraints)
    }

    // Use genetic algorithm for larger clusters
    return this.geneticAlgorithmOptimization(cluster.destinations, preferences, constraints)
  }

  /**
   * Simple nearest neighbor optimization for small destination sets
   */
  private nearestNeighborOptimization(
    destinations: Destination[],
    constraints: SequencingConstraints
  ): Destination[] {
    if (destinations.length <= 1) return destinations

    const unvisited = [...destinations]
    const route: Destination[] = []
    
    // Start from specified location or first destination
    let current: Destination
    if (constraints.startLocation) {
      const foundStart = unvisited.find(d => 
        d.location.toLowerCase().includes(constraints.startLocation!.toLowerCase())
      )
      current = foundStart || unvisited[0]
    } else {
      current = unvisited[0]
    }
    
    if (!current) {
      throw new Error('No destinations available for optimization')
    }
    
    route.push(current)
    unvisited.splice(unvisited.indexOf(current), 1)

    // Visit nearest unvisited destination until all are visited
    while (unvisited.length > 0) {
      if (!current) {
        throw new Error('Current destination became undefined during optimization')
      }
      
      let nearest = unvisited[0]
      let minDistance = this.calculateDistance(current.coordinates, nearest.coordinates)
      
      for (const candidate of unvisited) {
        const distance = this.calculateDistance(current.coordinates, candidate.coordinates)
        if (distance < minDistance) {
          minDistance = distance
          nearest = candidate
        }
      }
      
      route.push(nearest)
      unvisited.splice(unvisited.indexOf(nearest), 1)
      current = nearest
    }

    return route
  }

  /**
   * Genetic algorithm optimization for larger destination sets
   */
  private async geneticAlgorithmOptimization(
    destinations: Destination[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<Destination[]> {
    const populationSize = Math.min(50, destinations.length * 4)
    const generations = Math.min(100, destinations.length * 2)
    const mutationRate = 0.1
    const eliteSize = Math.floor(populationSize * 0.2)

    // Initialize population with random permutations
    let population = Array.from({ length: populationSize }, () => 
      this.shuffleArray([...destinations])
    )

    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness for each individual
      const fitness = await Promise.all(
        population.map(individual => this.calculateRouteFitness(individual, preferences, constraints))
      )

      // Create pairs of fitness and individuals, then sort by fitness
      const populationWithFitness = population.map((individual, index) => ({
        individual,
        fitness: fitness[index]
      })).sort((a, b) => b.fitness - a.fitness) // Higher fitness is better

      // Select elite individuals
      const elite = populationWithFitness.slice(0, eliteSize).map(p => p.individual)

      // Generate new population
      const newPopulation = [...elite]

      while (newPopulation.length < populationSize) {
        // Tournament selection
        const parent1 = this.tournamentSelection(populationWithFitness, 3).individual
        const parent2 = this.tournamentSelection(populationWithFitness, 3).individual

        // Crossover
        const offspring = this.orderCrossover(parent1, parent2)

        // Mutation
        if (Math.random() < mutationRate) {
          this.swapMutation(offspring)
        }

        newPopulation.push(offspring)
      }

      population = newPopulation
    }

    // Return the best individual
    const finalFitness = await Promise.all(
      population.map(individual => this.calculateRouteFitness(individual, preferences, constraints))
    )
    
    const bestIndex = finalFitness.indexOf(Math.max(...finalFitness))
    return population[bestIndex]
  }

  /**
   * Calculate fitness score for a route
   */
  private async calculateRouteFitness(
    route: Destination[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<number> {
    let fitness = 1000 // Base fitness

    // Calculate total travel time and distance
    let totalTravelTime = 0
    let totalDistance = 0

    for (let i = 1; i < route.length; i++) {
      const distance = this.calculateDistance(route[i - 1].coordinates, route[i].coordinates)
      const travelTime = this.estimateTravelTimeByTransport(distance, constraints.preferredTransportation[0] || 'car')
      
      totalDistance += distance
      totalTravelTime += travelTime

      // Penalty for excessive travel time between destinations
      if (travelTime > constraints.maxTravelTimePerDay) {
        fitness -= (travelTime - constraints.maxTravelTimePerDay) * 2
      }
    }

    // Prefer shorter total distance
    fitness -= totalDistance * 0.1

    // Prefer shorter total travel time
    fitness -= totalTravelTime * 0.5

    // Bonus for following must-visit order if specified
    if (constraints.mustVisitOrder && constraints.mustVisitOrder.length > 0) {
      let orderBonus = 0
      const routeIds = route.map(d => d.id)
      
      for (let i = 0; i < constraints.mustVisitOrder.length - 1; i++) {
        const currentIndex = routeIds.indexOf(constraints.mustVisitOrder[i])
        const nextIndex = routeIds.indexOf(constraints.mustVisitOrder[i + 1])
        
        if (currentIndex !== -1 && nextIndex !== -1 && currentIndex < nextIndex) {
          orderBonus += 50
        }
      }
      
      fitness += orderBonus
    }

    return Math.max(0, fitness)
  }

  /**
   * Optimize the order of visiting clusters
   */
  private async optimizeClusterOrder(
    clusters: DestinationCluster[],
    constraints: SequencingConstraints
  ): Promise<DestinationCluster[]> {
    if (clusters.length <= 1) return clusters

    // Use nearest neighbor for cluster ordering
    const unvisited = [...clusters]
    const route: DestinationCluster[] = []
    
    // Start from cluster containing start location if specified
    let current = constraints.startLocation
      ? unvisited.find(cluster => 
          cluster.destinations.some(d => 
            d.location.toLowerCase().includes(constraints.startLocation!.toLowerCase())
          )
        ) || unvisited[0]
      : unvisited[0]
    
    route.push(current)
    unvisited.splice(unvisited.indexOf(current), 1)

    while (unvisited.length > 0) {
      let nearest = unvisited[0]
      let minDistance = this.calculateDistance(current.centroid, nearest.centroid)
      
      for (const candidate of unvisited) {
        const distance = this.calculateDistance(current.centroid, candidate.centroid)
        if (distance < minDistance) {
          minDistance = distance
          nearest = candidate
        }
      }
      
      route.push(nearest)
      unvisited.splice(unvisited.indexOf(nearest), 1)
      current = nearest
    }

    return route
  }

  /**
   * Allocate days and calculate travel times for sequenced destinations
   */
  private async allocateDaysAndTravelTimes(
    destinations: Destination[],
    preferences: UserPreferences,
    constraints: SequencingConstraints
  ): Promise<SequencedDestination[]> {
    const totalDays = preferences.tripDuration || this.estimateTripDuration(destinations, preferences)
    const sequencedDestinations: SequencedDestination[] = []
    
    // Calculate base days allocation
    const baseDaysPerDestination = Math.floor(totalDays / destinations.length)
    const extraDays = totalDays % destinations.length
    
    let currentDate = new Date(preferences.startDate || new Date())
    
    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i]
      
      // Allocate days (distribute extra days to first few destinations)
      const daysAllocated = baseDaysPerDestination + (i < extraDays ? 1 : 0)
      
      // Calculate travel time from previous destination
      let travelTimeFromPrevious = 0
      let transportationToPrevious: Transportation | undefined
      
      if (i > 0) {
        const travelResult = await this.calculateTravelTime(
          destinations[i - 1],
          destination,
          constraints.preferredTransportation[0] || 'car'
        )
        travelTimeFromPrevious = travelResult.duration
        transportationToPrevious = travelResult.transportationOptions[0]
      }
      
      const arrivalDate = currentDate.toISOString().split('T')[0]
      const departureDate = new Date(currentDate)
      departureDate.setDate(departureDate.getDate() + daysAllocated - 1)
      
      const sequencedDestination: SequencedDestination = {
        ...destination,
        sequenceOrder: i + 1,
        arrivalDate,
        departureDate: departureDate.toISOString().split('T')[0],
        daysAllocated,
        travelTimeFromPrevious,
        transportationToPrevious
      }
      
      sequencedDestinations.push(sequencedDestination)
      
      // Move to next destination start date
      currentDate.setDate(currentDate.getDate() + daysAllocated)
    }
    
    return sequencedDestinations
  }

  // Utility methods

  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude)
    const dLon = this.toRadians(coord2.longitude - coord1.longitude)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private calculateCentroid(coordinates: Coordinates[]): Coordinates {
    const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length
    const avgLon = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length
    
    return { latitude: avgLat, longitude: avgLon }
  }

  private estimateTravelTimeByTransport(distanceKm: number, transportType: string): number {
    const speeds = {
      walking: 5,     // km/h
      cycling: 15,    // km/h
      car: 60,        // km/h
      bus: 45,        // km/h
      train: 80,      // km/h
      flight: 500     // km/h (including time for airport procedures)
    }
    
    const speed = speeds[transportType as keyof typeof speeds] || speeds.car
    return Math.round((distanceKm / speed) * 60) // Convert to minutes
  }

  private generateTransportationOptions(
    from: Destination,
    to: Destination,
    preferredType: string,
    distance: number,
    travelTime: number
  ): Transportation[] {
    const baseTransportation: Transportation = {
      id: `transport-${from.id}-${to.id}`,
      title: `${preferredType} from ${from.title} to ${to.title}`,
      description: `Travel by ${preferredType}`,
      type: preferredType as any,
      from: from.location,
      to: to.location,
      fromCoordinates: from.coordinates,
      toCoordinates: to.coordinates,
      departureTime: '09:00:00',
      arrivalTime: this.addMinutesToTime('09:00:00', travelTime),
      duration: travelTime,
      images: [],
      tags: [preferredType, 'transportation'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return [baseTransportation]
  }

  private estimateTravelCost(distance: number, transportType: string, currency: string): Money {
    const costPerKm = {
      walking: 0,
      cycling: 0,
      car: 0.5,      // Fuel and maintenance
      bus: 0.1,      // Public transport
      train: 0.15,   // Rail travel
      flight: 0.8    // Air travel
    }
    
    const rate = costPerKm[transportType as keyof typeof costPerKm] || costPerKm.car
    const amount = distance * rate
    
    return { amount: Math.round(amount), currency }
  }

  private addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins, secs] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes, secs || 0)
    
    return date.toTimeString().split(' ')[0]
  }

  private estimateTripDuration(destinations: Destination[], preferences: UserPreferences): number {
    // Simple heuristic: 2-3 days per destination, adjusted for pace
    const baseDays = destinations.length * 2.5
    const paceMultiplier = preferences.pacePreference === 'slow' ? 1.5 : 
                          preferences.pacePreference === 'fast' ? 0.8 : 1.0
    
    return Math.ceil(baseDays * paceMultiplier)
  }

  private fixSequenceIssues(
    sequence: SequencedDestination[],
    issues: SequenceIssue[]
  ): SequencedDestination[] {
    // For now, return the sequence as-is
    // In a real implementation, you would analyze and fix specific issues
    console.warn('Sequence has issues but automatic fixing is not implemented:', issues)
    return sequence
  }

  // Genetic algorithm helper methods

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private tournamentSelection(
    populationWithFitness: Array<{ individual: Destination[]; fitness: number }>,
    tournamentSize: number
  ): { individual: Destination[]; fitness: number } {
    let best = populationWithFitness[Math.floor(Math.random() * populationWithFitness.length)]
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = populationWithFitness[Math.floor(Math.random() * populationWithFitness.length)]
      if (candidate.fitness > best.fitness) {
        best = candidate
      }
    }
    
    return best
  }

  private orderCrossover(parent1: Destination[], parent2: Destination[]): Destination[] {
    const length = parent1.length
    const start = Math.floor(Math.random() * length)
    const end = Math.floor(Math.random() * (length - start)) + start
    
    const offspring: (Destination | null)[] = new Array(length).fill(null)
    
    // Copy substring from parent1
    for (let i = start; i <= end; i++) {
      offspring[i] = parent1[i]
    }
    
    // Fill remaining positions with parent2's order
    let parent2Index = 0
    for (let i = 0; i < length; i++) {
      if (offspring[i] === null) {
        while (offspring.includes(parent2[parent2Index])) {
          parent2Index++
        }
        offspring[i] = parent2[parent2Index]
        parent2Index++
      }
    }
    
    return offspring as Destination[]
  }

  private swapMutation(individual: Destination[]): void {
    const index1 = Math.floor(Math.random() * individual.length)
    const index2 = Math.floor(Math.random() * individual.length)
    
    ;[individual[index1], individual[index2]] = [individual[index2], individual[index1]]
  }
}

// Configuration interface
interface SequencingConfig {
  maxTravelTimePerDay: number
  clusteringThreshold: number // km
  enableCaching: boolean
  parallelProcessing: boolean
  optimizationAlgorithm: 'nearest_neighbor' | 'genetic' | 'hybrid'
}

// Clustering interface
interface DestinationCluster {
  id: string
  destinations: Destination[]
  centroid: Coordinates
  radius: number // km
}

// Factory for creating destination sequencing services
export class DestinationSequencingServiceFactory {
  static createDefault(): DestinationSequencingService {
    return new DefaultDestinationSequencingService()
  }

  static createFastSequencing(): DestinationSequencingService {
    return new DefaultDestinationSequencingService({
      optimizationAlgorithm: 'nearest_neighbor',
      enableCaching: true,
      parallelProcessing: true,
      clusteringThreshold: 150 // Larger clusters for faster processing
    })
  }

  static createPreciseSequencing(): DestinationSequencingService {
    return new DefaultDestinationSequencingService({
      optimizationAlgorithm: 'genetic',
      enableCaching: true,
      parallelProcessing: true,
      clusteringThreshold: 50 // Smaller clusters for more precise routing
    })
  }
} 