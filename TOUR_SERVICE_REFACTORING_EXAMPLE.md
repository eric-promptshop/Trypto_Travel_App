# Tour Service Refactoring Example

## Complete Refactoring: Tour Import Feature

This example demonstrates the complete transformation of the tour import functionality from the current mixed-concern implementation to a clean service-oriented architecture.

## Current Implementation Analysis

### Problems with Current Code

```typescript
// app/api/tour-operator/tours/import/route.ts (CURRENT - PROBLEMATIC)
export async function POST(request: NextRequest) {
  try {
    // Problem 1: Authentication mixed with business logic
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Problem 2: Direct database queries in API route
    const operator = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Problem 3: Business logic in API route
    const { url, source = 'website' } = await request.json()
    
    // Problem 4: Direct external service calls
    if (source === 'website') {
      const response = await fetch(url)
      const html = await response.text()
      
      // Problem 5: Parsing logic in API route
      const $ = cheerio.load(html)
      const title = $('h1').first().text()
      const description = $('meta[name="description"]').attr('content')
      
      // Problem 6: Complex business logic mixed with HTTP handling
      const activities = []
      $('.activity-item').each((i, el) => {
        activities.push({
          name: $(el).find('.title').text(),
          description: $(el).find('.description').text()
        })
      })
      
      // Problem 7: Direct database insertion
      const tour = await prisma.tour.create({
        data: {
          operatorId: operator.id,
          title,
          description,
          source: url,
          importedAt: new Date(),
          status: 'DRAFT',
          activities: {
            create: activities
          }
        }
      })
      
      // Problem 8: Direct email sending in route
      await sendEmail({
        to: operator.email,
        subject: 'Tour Imported Successfully',
        body: `Your tour "${title}" has been imported`
      })
      
      return NextResponse.json({ success: true, tour })
    }
  } catch (error) {
    // Problem 9: Generic error handling
    console.error(error)
    return createErrorResponse('Import failed', 500)
  }
}
```

## Refactored Implementation

### 1. Domain Layer

```typescript
// src/core/domain/tour/import/ImportSource.ts
export abstract class ImportSource {
  abstract parse(data: any): Promise<ParsedTourData>;
  abstract validate(data: any): ValidationResult;
}

// src/core/domain/tour/import/TourImport.ts
export interface TourImportProps {
  id: string;
  operatorId: string;
  source: ImportSourceType;
  sourceUrl: string;
  status: ImportStatus;
  parsedData?: ParsedTourData;
  tourId?: string;
  error?: string;
  importedAt: Date;
  completedAt?: Date;
}

export class TourImport {
  private constructor(private props: TourImportProps) {}

  static create(props: Omit<TourImportProps, 'id' | 'importedAt'>): TourImport {
    return new TourImport({
      ...props,
      id: generateId(),
      importedAt: new Date()
    });
  }

  process(parsedData: ParsedTourData): Result<void> {
    if (this.props.status !== ImportStatus.PENDING) {
      return Result.fail('Import has already been processed');
    }

    this.props.parsedData = parsedData;
    this.props.status = ImportStatus.PROCESSING;
    
    return Result.ok();
  }

  complete(tourId: string): void {
    this.props.tourId = tourId;
    this.props.status = ImportStatus.COMPLETED;
    this.props.completedAt = new Date();
  }

  fail(error: string): void {
    this.props.error = error;
    this.props.status = ImportStatus.FAILED;
    this.props.completedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get status(): ImportStatus { return this.props.status; }
  get parsedData(): ParsedTourData | undefined { return this.props.parsedData; }
}

// src/core/domain/tour/import/ParsedTourData.ts
export interface ParsedTourData {
  title: string;
  description: string;
  duration?: number;
  price?: Money;
  destinations: string[];
  activities: ParsedActivity[];
  images: ParsedImage[];
  metadata: Record<string, any>;
}

export interface ParsedActivity {
  title: string;
  description: string;
  duration?: string;
  price?: number;
  location?: string;
}
```

### 2. Import Strategy Pattern

```typescript
// src/infrastructure/parsers/WebsiteParser.ts
import { JSDOM } from 'jsdom';
import { ImportSource, ParsedTourData } from '@/core/domain/tour/import';

@injectable()
export class WebsiteParser extends ImportSource {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.HttpClient) private http: HttpClient
  ) {
    super();
  }

  async parse(url: string): Promise<ParsedTourData> {
    try {
      // Fetch webpage
      const html = await this.http.get(url);
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract structured data first
      const structuredData = this.extractStructuredData(document);
      if (structuredData) {
        return this.parseStructuredData(structuredData);
      }

      // Fallback to HTML parsing
      return this.parseHTML(document);
    } catch (error) {
      this.logger.error('Failed to parse website', { url, error });
      throw new ParsingError(`Failed to parse website: ${error.message}`);
    }
  }

  private extractStructuredData(document: Document): any | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'TouristTrip' || data['@type'] === 'Product') {
          return data;
        }
      } catch {}
    }
    
    return null;
  }

  private parseStructuredData(data: any): ParsedTourData {
    return {
      title: data.name || '',
      description: data.description || '',
      duration: this.parseDuration(data.duration),
      price: data.offers ? Money.create(data.offers.price, data.offers.priceCurrency) : undefined,
      destinations: this.extractDestinations(data),
      activities: this.extractActivitiesFromStructuredData(data),
      images: this.extractImages(data),
      metadata: {
        source: 'structured_data',
        originalData: data
      }
    };
  }

  private parseHTML(document: Document): ParsedTourData {
    const title = this.extractTitle(document);
    const description = this.extractDescription(document);
    const activities = this.extractActivitiesFromHTML(document);
    const images = this.extractImagesFromHTML(document);

    return {
      title,
      description,
      destinations: this.inferDestinations(title, description),
      activities,
      images,
      metadata: {
        source: 'html_parsing',
        selectors: this.getUsedSelectors()
      }
    };
  }

  validate(data: ParsedTourData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.title || data.title.length < 5) {
      errors.push(new ValidationError('Title must be at least 5 characters', 'title'));
    }

    if (!data.description || data.description.length < 20) {
      errors.push(new ValidationError('Description must be at least 20 characters', 'description'));
    }

    if (data.activities.length === 0) {
      errors.push(new ValidationError('At least one activity is required', 'activities'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// src/infrastructure/parsers/ParserFactory.ts
@injectable()
export class ParserFactory {
  constructor(
    @inject(TYPES.WebsiteParser) private websiteParser: WebsiteParser,
    @inject(TYPES.PDFParser) private pdfParser: PDFParser,
    @inject(TYPES.CSVParser) private csvParser: CSVParser
  ) {}

  create(source: ImportSourceType): ImportSource {
    switch (source) {
      case ImportSourceType.WEBSITE:
        return this.websiteParser;
      case ImportSourceType.PDF:
        return this.pdfParser;
      case ImportSourceType.CSV:
        return this.csvParser;
      default:
        throw new Error(`Unsupported import source: ${source}`);
    }
  }
}
```

### 3. Import Service

```typescript
// src/core/domain/tour/import/TourImportService.ts
export interface TourImportService {
  startImport(data: StartImportDTO): Promise<Result<TourImport>>;
  processImport(importId: string): Promise<Result<Tour>>;
  getImportStatus(importId: string): Promise<ImportStatus>;
}

@injectable()
export class TourImportServiceImpl implements TourImportService {
  constructor(
    @inject(TYPES.TourImportRepository) private importRepo: TourImportRepository,
    @inject(TYPES.TourService) private tourService: TourService,
    @inject(TYPES.ParserFactory) private parserFactory: ParserFactory,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async startImport(data: StartImportDTO): Promise<Result<TourImport>> {
    try {
      // Create import record
      const tourImport = TourImport.create({
        operatorId: data.operatorId,
        source: data.source,
        sourceUrl: data.url,
        status: ImportStatus.PENDING
      });

      // Save import record
      await this.importRepo.save(tourImport);

      // Publish event for async processing
      await this.eventBus.publish(new ImportStartedEvent(tourImport));

      this.logger.info('Import started', { 
        importId: tourImport.id, 
        source: data.source 
      });

      return Result.ok(tourImport);
    } catch (error) {
      this.logger.error('Failed to start import', error);
      return Result.fail('Failed to start import');
    }
  }

  async processImport(importId: string): Promise<Result<Tour>> {
    const importRecord = await this.importRepo.findById(importId);
    if (!importRecord) {
      return Result.fail('Import not found');
    }

    try {
      // Get appropriate parser
      const parser = this.parserFactory.create(importRecord.source);
      
      // Parse the source
      const parsedData = await parser.parse(importRecord.sourceUrl);
      
      // Validate parsed data
      const validation = parser.validate(parsedData);
      if (!validation.isValid) {
        importRecord.fail(validation.errors.join(', '));
        await this.importRepo.save(importRecord);
        return Result.fail('Validation failed');
      }

      // Update import record with parsed data
      importRecord.process(parsedData);
      await this.importRepo.save(importRecord);

      // Create tour from parsed data
      const tourResult = await this.tourService.createTour({
        operatorId: importRecord.operatorId,
        title: parsedData.title,
        description: parsedData.description,
        duration: parsedData.duration,
        price: parsedData.price,
        destinations: parsedData.destinations,
        activities: parsedData.activities.map(a => ({
          title: a.title,
          description: a.description,
          duration: a.duration,
          price: a.price ? Money.create(a.price, 'USD') : undefined
        })),
        images: parsedData.images,
        metadata: {
          ...parsedData.metadata,
          importId: importRecord.id,
          importSource: importRecord.source,
          importedFrom: importRecord.sourceUrl
        }
      });

      if (!tourResult.isSuccess) {
        importRecord.fail(tourResult.error);
        await this.importRepo.save(importRecord);
        return Result.fail(tourResult.error);
      }

      const tour = tourResult.getValue();

      // Mark import as complete
      importRecord.complete(tour.id);
      await this.importRepo.save(importRecord);

      // Publish success event
      await this.eventBus.publish(new ImportCompletedEvent(importRecord, tour));

      return Result.ok(tour);
    } catch (error) {
      this.logger.error('Import processing failed', { importId, error });
      
      importRecord.fail(error.message);
      await this.importRepo.save(importRecord);
      
      await this.eventBus.publish(new ImportFailedEvent(importRecord, error));
      
      return Result.fail('Import processing failed');
    }
  }
}
```

### 4. Application Service

```typescript
// src/core/application/tour/ImportTourUseCase.ts
@injectable()
export class ImportTourUseCase {
  constructor(
    @inject(TYPES.TourImportService) private importService: TourImportService,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService,
    @inject(TYPES.QueueService) private queue: QueueService
  ) {}

  async execute(command: ImportTourCommand): Promise<ImportTourResult> {
    // Validate command
    const validation = await this.validateCommand(command);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Start import
    const importResult = await this.importService.startImport({
      operatorId: command.operatorId,
      source: command.source,
      url: command.url
    });

    if (!importResult.isSuccess) {
      throw new Error(importResult.error);
    }

    const tourImport = importResult.getValue();

    // Queue for async processing
    await this.queue.enqueue('process-import', {
      importId: tourImport.id
    });

    // Track analytics
    await this.analytics.track('tour_import_started', {
      importId: tourImport.id,
      operatorId: command.operatorId,
      source: command.source
    });

    // Send notification
    await this.notificationService.send({
      userId: command.operatorId,
      type: 'import_started',
      data: {
        importId: tourImport.id,
        source: command.source
      }
    });

    return {
      importId: tourImport.id,
      status: tourImport.status,
      message: 'Import started successfully. You will be notified when complete.'
    };
  }

  private async validateCommand(command: ImportTourCommand): Promise<ValidationResult> {
    const errors = [];

    if (!command.url) {
      errors.push('URL is required');
    } else if (!this.isValidUrl(command.url)) {
      errors.push('Invalid URL format');
    }

    if (!Object.values(ImportSourceType).includes(command.source)) {
      errors.push('Invalid import source');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// src/core/application/tour/ProcessImportJob.ts
@injectable()
export class ProcessImportJob {
  constructor(
    @inject(TYPES.TourImportService) private importService: TourImportService,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.OperatorRepository) private operatorRepo: OperatorRepository
  ) {}

  async handle(data: { importId: string }): Promise<void> {
    const result = await this.importService.processImport(data.importId);

    const operator = await this.getOperatorForImport(data.importId);
    
    if (result.isSuccess) {
      const tour = result.getValue();
      
      // Send success notification
      await this.notificationService.send({
        userId: operator.id,
        type: 'import_completed',
        data: {
          importId: data.importId,
          tourId: tour.id,
          tourTitle: tour.title
        }
      });

      // Send email
      await this.emailService.send({
        to: operator.email,
        template: 'import-success',
        data: {
          operatorName: operator.name,
          tourTitle: tour.title,
          tourId: tour.id,
          viewUrl: `${process.env.APP_URL}/operator/tours/${tour.id}`
        }
      });
    } else {
      // Send failure notification
      await this.notificationService.send({
        userId: operator.id,
        type: 'import_failed',
        data: {
          importId: data.importId,
          error: result.error
        }
      });

      // Send email
      await this.emailService.send({
        to: operator.email,
        template: 'import-failure',
        data: {
          operatorName: operator.name,
          error: result.error,
          retryUrl: `${process.env.APP_URL}/operator/import`
        }
      });
    }
  }
}
```

### 5. API Route (Thin Controller)

```typescript
// src/presentation/controllers/TourImportController.ts
@injectable()
export class TourImportController {
  constructor(
    @inject(TYPES.ImportTourUseCase) private importTourUseCase: ImportTourUseCase,
    @inject(TYPES.AuthService) private auth: AuthService
  ) {}

  async importTour(request: Request): Promise<Response> {
    try {
      // Authenticate
      const session = await this.auth.authenticate(request);
      if (!session) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Parse request
      const body = await request.json();
      
      // Execute use case
      const result = await this.importTourUseCase.execute({
        operatorId: session.userId,
        url: body.url,
        source: body.source || ImportSourceType.WEBSITE
      });

      // Return response
      return Response.json(result, { status: 202 }); // 202 Accepted for async
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json({ 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 });
      }

      return Response.json({ 
        error: 'Import failed' 
      }, { status: 500 });
    }
  }

  async getImportStatus(request: Request, importId: string): Promise<Response> {
    try {
      const session = await this.auth.authenticate(request);
      if (!session) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const status = await this.importService.getImportStatus(importId);
      
      return Response.json({ importId, status });
    } catch (error) {
      return Response.json({ 
        error: 'Failed to get status' 
      }, { status: 500 });
    }
  }
}

// app/api/v1/tours/import/route.ts
import { container } from '@/core/container';
import { TourImportController } from '@/presentation/controllers/TourImportController';

const controller = container.get<TourImportController>(TourImportController);

export async function POST(request: Request) {
  return controller.importTour(request);
}

// app/api/v1/tours/import/[importId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { importId: string } }
) {
  return controller.getImportStatus(request, params.importId);
}
```

### 6. React Hook for UI

```typescript
// src/presentation/hooks/useTourImport.ts
export function useTourImport() {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const { toast } = useToast();

  const importTour = useCallback(async (data: ImportTourData) => {
    setImporting(true);
    
    try {
      const response = await fetch('/api/v1/tours/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      
      // Start polling for status
      pollImportStatus(result.importId);
      
      toast.success('Import started! We\'ll notify you when it\'s complete.');
      
      return result;
    } catch (error) {
      toast.error('Failed to start import');
      throw error;
    } finally {
      setImporting(false);
    }
  }, [toast]);

  const pollImportStatus = useCallback(async (importId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/tours/import/${importId}`);
        const { status } = await response.json();
        
        setImportStatus(status);
        
        if (status === ImportStatus.COMPLETED || status === ImportStatus.FAILED) {
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  return {
    importTour,
    importing,
    importStatus
  };
}

// Usage in component
export function ImportTourForm() {
  const { importTour, importing, importStatus } = useTourImport();
  const [url, setUrl] = useState('');
  const [source, setSource] = useState<ImportSourceType>(ImportSourceType.WEBSITE);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      await importTour({ url, source });
      setUrl(''); // Clear form
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter tour URL"
        disabled={importing}
      />
      
      <Select
        value={source}
        onChange={(e) => setSource(e.target.value as ImportSourceType)}
        disabled={importing}
      >
        <option value={ImportSourceType.WEBSITE}>Website</option>
        <option value={ImportSourceType.PDF}>PDF</option>
        <option value={ImportSourceType.CSV}>CSV</option>
      </Select>
      
      <Button type="submit" disabled={importing}>
        {importing ? 'Importing...' : 'Import Tour'}
      </Button>
      
      {importStatus && (
        <ImportStatusBadge status={importStatus} />
      )}
    </form>
  );
}
```

## Benefits of Refactored Architecture

### 1. **Separation of Concerns**
- API routes only handle HTTP concerns
- Business logic isolated in services
- Data access through repositories
- External services behind interfaces

### 2. **Testability**
```typescript
// Easy to test each layer independently
describe('TourImportService', () => {
  it('should process valid import', async () => {
    const mockParser = createMockParser();
    const mockTourService = createMockTourService();
    
    const service = new TourImportServiceImpl(
      mockRepo,
      mockTourService,
      mockParserFactory,
      mockEventBus,
      mockLogger
    );
    
    const result = await service.processImport('import-123');
    
    expect(result.isSuccess).toBe(true);
    expect(mockTourService.createTour).toHaveBeenCalled();
  });
});
```

### 3. **Flexibility**
- Easy to add new import sources
- Can swap implementations
- Can extract to microservice
- Can add caching/retry logic

### 4. **Error Handling**
- Domain-specific errors
- Proper error propagation
- User-friendly error messages
- Detailed logging for debugging

### 5. **Performance**
- Async processing for long operations
- No blocking of API responses
- Efficient resource usage
- Scalable architecture

This refactoring demonstrates how to transform a problematic, mixed-concern implementation into a clean, maintainable, and scalable service-oriented architecture.