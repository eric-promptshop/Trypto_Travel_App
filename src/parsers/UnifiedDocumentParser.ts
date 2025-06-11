import { PDFParser } from './PDFParser';
import { WordParser } from './WordParser';
import { ParsedDocument } from './BaseDocumentParser';

function getFileType(fileName: string, buffer: Buffer): 'pdf' | 'docx' | 'unknown' {
  if (fileName.endsWith('.pdf')) return 'pdf';
  if (fileName.endsWith('.docx')) return 'docx';
  // Optionally inspect magic bytes for robustness
  return 'unknown';
}

export async function parseDocument(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const type = getFileType(fileName, buffer);
  if (type === 'pdf') {
    return new PDFParser().parse(buffer);
  } else if (type === 'docx') {
    return new WordParser().parse(buffer);
  } else {
    throw new Error('Unsupported document type');
  }
} 