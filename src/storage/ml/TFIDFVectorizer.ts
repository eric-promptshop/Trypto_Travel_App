import * as natural from 'natural';

/**
 * Simple TF-IDF vectorizer for text embeddings when OpenAI is not available
 */
export class TFIDFVectorizer {
  private tfidf: natural.TfIdf;
  private vocabulary: Set<string>;
  private vocabularyArray: string[];
  private dimension: number;
  
  constructor(maxFeatures: number = 300) {
    this.tfidf = new natural.TfIdf();
    this.vocabulary = new Set();
    this.vocabularyArray = [];
    this.dimension = maxFeatures;
  }

  /**
   * Fit the vectorizer on a corpus (for initialization)
   */
  fit(documents: string[]): void {
    // Build vocabulary from documents
    documents.forEach(doc => {
      this.tfidf.addDocument(doc);
      const tokens = this.tokenize(doc);
      tokens.forEach(token => this.vocabulary.add(token));
    });
    
    // Convert to array and limit to maxFeatures
    this.vocabularyArray = Array.from(this.vocabulary)
      .slice(0, this.dimension)
      .sort();
  }

  /**
   * Transform text to vector
   */
  transform(text: string): number[] {
    // If vocabulary is empty, initialize with common travel terms
    if (this.vocabularyArray.length === 0) {
      this.initializeDefaultVocabulary();
    }
    
    // Create a temporary TF-IDF instance for this document
    const tempTfidf = new natural.TfIdf();
    tempTfidf.addDocument(text);
    
    // Create vector
    const vector = new Array(this.dimension).fill(0);
    
    tempTfidf.listTerms(0).forEach(term => {
      const index = this.vocabularyArray.indexOf(term.term);
      if (index !== -1) {
        vector[index] = term.tfidf;
      }
    });
    
    // Normalize vector
    return this.normalize(vector);
  }

  /**
   * Get dimension of vectors
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    const tokenizer = new natural.WordTokenizer();
    return tokenizer.tokenize(text.toLowerCase())
      .filter(token => token.length > 2); // Filter short words
  }

  /**
   * Initialize with default travel-related vocabulary
   */
  private initializeDefaultVocabulary(): void {
    const defaultTerms = [
      // Destinations
      'beach', 'city', 'mountain', 'island', 'country', 'region', 'town', 'village',
      'coast', 'lake', 'river', 'desert', 'forest', 'park', 'capital',
      
      // Activities
      'tour', 'adventure', 'hiking', 'swimming', 'diving', 'snorkeling', 'surfing',
      'skiing', 'climbing', 'cycling', 'kayaking', 'rafting', 'safari', 'cruise',
      'sightseeing', 'museum', 'gallery', 'temple', 'church', 'monument', 'shopping',
      'dining', 'restaurant', 'cafe', 'bar', 'nightlife', 'entertainment', 'show',
      
      // Accommodations
      'hotel', 'hostel', 'resort', 'apartment', 'villa', 'guesthouse', 'motel',
      'lodge', 'cabin', 'camping', 'glamping', 'airbnb', 'boutique', 'luxury',
      'budget', 'suite', 'room', 'bed', 'breakfast', 'pool', 'spa', 'gym',
      
      // Transportation
      'flight', 'airplane', 'airport', 'train', 'bus', 'car', 'taxi', 'uber',
      'metro', 'subway', 'ferry', 'boat', 'ship', 'transfer', 'rental',
      
      // Time
      'day', 'night', 'morning', 'afternoon', 'evening', 'hour', 'minute',
      'week', 'month', 'year', 'season', 'summer', 'winter', 'spring', 'fall',
      
      // Descriptors
      'beautiful', 'amazing', 'stunning', 'spectacular', 'scenic', 'historic',
      'modern', 'traditional', 'cultural', 'authentic', 'unique', 'popular',
      'famous', 'local', 'international', 'private', 'public', 'free', 'paid',
      
      // Price/Value
      'price', 'cost', 'free', 'cheap', 'expensive', 'affordable', 'luxury',
      'budget', 'value', 'discount', 'deal', 'offer', 'package', 'inclusive',
      
      // General travel
      'travel', 'trip', 'journey', 'vacation', 'holiday', 'tour', 'visit',
      'explore', 'discover', 'experience', 'adventure', 'destination', 'itinerary',
      'guide', 'recommendation', 'review', 'rating', 'location', 'place', 'spot'
    ];
    
    this.vocabularyArray = defaultTerms.slice(0, this.dimension);
  }

  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
} 