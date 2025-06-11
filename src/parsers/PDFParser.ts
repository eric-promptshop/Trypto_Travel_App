import pdfParse from 'pdf-parse';
import { BaseDocumentParser, ParsedDocument } from './BaseDocumentParser';

export class PDFParser extends BaseDocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const data = await pdfParse(buffer);
    const rawText = data.text;
    // TODO: Implement structure detection and metadata extraction
    return {
      sections: [
        {
          title: 'Full Document',
          content: rawText,
        },
      ],
      metadata: {},
      rawText,
    };
  }
} 