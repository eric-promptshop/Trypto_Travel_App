import { PDFParser } from './PDFParser';
import { WordParser } from './WordParser';
import { BaseDocumentParser } from './BaseDocumentParser';

export function getDocumentParser(fileName: string, buffer: Buffer): BaseDocumentParser {
  if (fileName.endsWith('.pdf')) {
    return new PDFParser();
  }
  if (fileName.endsWith('.docx')) {
    return new WordParser();
  }
  throw new Error('Unsupported document type');
} 