/**
 * Dependency injection types/tokens
 */
export const TYPES = {
  // Infrastructure
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
  Cache: Symbol.for('Cache'),
  PrismaClient: Symbol.for('PrismaClient'),
  
  // Repositories
  TourRepository: Symbol.for('TourRepository'),
  ItineraryRepository: Symbol.for('ItineraryRepository'),
  LeadRepository: Symbol.for('LeadRepository'),
  OperatorRepository: Symbol.for('OperatorRepository'),
  UserRepository: Symbol.for('UserRepository'),
  
  // Domain Services
  TourService: Symbol.for('TourService'),
  ItineraryService: Symbol.for('ItineraryService'),
  LeadService: Symbol.for('LeadService'),
  OperatorService: Symbol.for('OperatorService'),
  UserService: Symbol.for('UserService'),
  
  // Application Services
  TourApplicationService: Symbol.for('TourApplicationService'),
  ItineraryApplicationService: Symbol.for('ItineraryApplicationService'),
  LeadApplicationService: Symbol.for('LeadApplicationService'),
  OperatorApplicationService: Symbol.for('OperatorApplicationService'),
  
  // External Services
  AIService: Symbol.for('AIService'),
  MapsService: Symbol.for('MapsService'),
  EmailService: Symbol.for('EmailService'),
  StorageService: Symbol.for('StorageService'),
  NotificationService: Symbol.for('NotificationService'),
  AnalyticsService: Symbol.for('AnalyticsService'),
  
  // Import Services
  TourImportService: Symbol.for('TourImportService'),
  WebsiteParser: Symbol.for('WebsiteParser'),
  PDFParser: Symbol.for('PDFParser'),
  CSVParser: Symbol.for('CSVParser'),
  ParserFactory: Symbol.for('ParserFactory'),
  
  // Auth
  AuthService: Symbol.for('AuthService'),
  
  // HTTP
  HttpClient: Symbol.for('HttpClient'),
  
  // Queue
  QueueService: Symbol.for('QueueService'),
};