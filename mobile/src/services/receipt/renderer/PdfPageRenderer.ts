/**
 * Bjet Mobile - Android PDF Page Renderer Abstraction (Phase 6)
 *
 * Renders individual pages of a PDF into temporary bitmap images using
 * native Android PdfRenderer (via expo-pdf-page-renderer module).
 *
 * Provides automatic, immediate file cleanup to prevent temporary file leakage.
 */

// @ts-ignore
import { renderPdfPageToImage, cleanupPdfPageImage, isPdfRendererSupported, getPdfPageCount } from 'expo-pdf-page-renderer';

export interface RenderedPage {
  imageUri: string;
  filePath?: string;
  pageCount?: number;
  cleanup: () => Promise<void>;
}

export interface IPdfPageRenderer {
  isSupported(): boolean;
  getPageCount?(pdfUri: string): Promise<number>;
  renderPage(pdfUri: string, pageNumber: number): Promise<RenderedPage>;
}

export class AndroidPdfPageRenderer implements IPdfPageRenderer {
  public isSupported(): boolean {
    return isPdfRendererSupported;
  }

  public async getPageCount(pdfUri: string): Promise<number> {
    return await getPdfPageCount(pdfUri);
  }

  public async renderPage(pdfUri: string, pageNumber: number): Promise<RenderedPage> {
    const result = await renderPdfPageToImage(pdfUri, pageNumber);

    return {
      imageUri: result.imageUri,
      filePath: result.filePath,
      pageCount: result.pageCount,
      cleanup: async () => {
        if (result.filePath) {
          try {
            await cleanupPdfPageImage(result.filePath);
          } catch {
            // Ignore cleanup errors
          }
        }
      },
    };
  }
}
