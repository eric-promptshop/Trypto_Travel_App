export interface Section {
  title: string;
  content: string;
  day?: number;
  activities?: string[];
  accommodations?: string[];
}

export interface DocumentMetadata {
  dates?: string[];
  locations?: string[];
  durations?: string[];
  [key: string]: any;
}

export interface ParsedDocument {
  sections: Section[];
  metadata: DocumentMetadata;
  rawText: string;
} 