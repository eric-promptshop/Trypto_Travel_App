// Wrapper for pdf-parse to handle production environment issues
export async function parsePDF(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  info: any;
  metadata: any;
  version: string;
}> {
  try {
    // Try to use pdf-parse
    const pdfParse = require('pdf-parse');
    return await pdfParse(buffer);
  } catch (error) {
    console.warn('pdf-parse failed, using fallback parser:', error);
    
    // Fallback: return a basic structure
    // In production, you might want to use a different PDF parsing library
    // or implement a basic PDF text extraction
    return {
      text: '[PDF content could not be extracted]',
      numpages: 0,
      info: {},
      metadata: {},
      version: 'unknown'
    };
  }
}