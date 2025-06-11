import { parseDocument } from './UnifiedDocumentParser';

describe('Document Parsers', () => {
  it('parses a PDF buffer', async () => {
    const buffer = Buffer.from('%PDF-1.4...'); // Stub: replace with real PDF buffer in real test
    await expect(parseDocument(buffer, 'sample.pdf')).resolves.toHaveProperty('sections');
  });

  it('parses a DOCX buffer', async () => {
    const buffer = Buffer.from('PK...'); // Stub: replace with real DOCX buffer in real test
    await expect(parseDocument(buffer, 'sample.docx')).resolves.toHaveProperty('sections');
  });

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('');
    await expect(parseDocument(buffer, 'sample.txt')).rejects.toThrow('Unsupported document type');
  });
}); 