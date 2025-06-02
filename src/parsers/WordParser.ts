import mammoth from 'mammoth';
import { BaseDocumentParser, ParsedDocument } from './BaseDocumentParser';

export class WordParser extends BaseDocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const { value: rawText } = await mammoth.extractRawText({ buffer });
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