declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string
    IsAcroFormPresent: boolean
    IsXFAPresent: boolean
    Title?: string
    Author?: string
    Subject?: string
    Keywords?: string
    Creator?: string
    Producer?: string
    CreationDate?: string
    ModDate?: string
  }

  interface PDFPage {
    pageIndex: number
    pageInfo: any
    content: string
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata: any
    text: string
    version: string
  }

  function pdf(dataBuffer: Buffer, options?: any): Promise<PDFData>
  
  export = pdf
}