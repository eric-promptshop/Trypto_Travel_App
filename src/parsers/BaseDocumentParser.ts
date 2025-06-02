export interface ParsedDocument {
  sections: Array<{
    title: string;
    content: string;
    day?: number;
    activities?: string[];
    accommodations?: string[];
  }>;
  metadata: {
    dates?: string[];
    locations?: string[];
    durations?: string[];
    [key: string]: any;
  };
  rawText: string;
}

export abstract class BaseDocumentParser {
  abstract parse(buffer: Buffer): Promise<ParsedDocument>;
} 