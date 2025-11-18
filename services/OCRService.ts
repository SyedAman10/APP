/**
 * OCR Service - Extracts text from images using OCR.space API
 * Free tier: https://ocr.space/ocrapi
 */

export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
}

class OCRServiceClass {
  private readonly API_URL = 'https://api.ocr.space/parse/image';
  // Free API key for basic usage (you can replace with your own)
  private readonly API_KEY = 'K87899142388957';

  /**
   * Extract text from an image using OCR
   * @param imageUri - Local file URI or base64 string
   * @param language - OCR language (default: 'eng' for English)
   */
  async extractTextFromImage(
    imageUri: string,
    language: string = 'eng'
  ): Promise<OCRResult> {
    try {
      console.log('🔍 Starting OCR for image...');

      // Create form data
      const formData = new FormData();
      
      // Add the image file
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      formData.append('apikey', this.API_KEY);
      formData.append('language', language);
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Use engine 2 for better accuracy

      console.log('📤 Sending image to OCR API...');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log('📥 OCR Response:', data);

      if (data.OCRExitCode === 1 && data.ParsedResults && data.ParsedResults.length > 0) {
        const extractedText = data.ParsedResults[0].ParsedText;
        
        if (!extractedText || extractedText.trim() === '') {
          return {
            success: false,
            error: 'No text found in the image',
          };
        }

        console.log('✅ OCR successful! Extracted text length:', extractedText.length);
        
        return {
          success: true,
          text: extractedText.trim(),
        };
      } else {
        const errorMessage = data.ErrorMessage?.[0] || data.ParsedResults?.[0]?.ErrorMessage || 'OCR failed';
        console.error('❌ OCR failed:', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error('❌ OCR Exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to process image',
      };
    }
  }

  /**
   * Extract text from base64 image
   * @param base64String - Base64 encoded image
   * @param language - OCR language (default: 'eng' for English)
   */
  async extractTextFromBase64(
    base64String: string,
    language: string = 'eng'
  ): Promise<OCRResult> {
    try {
      console.log('🔍 Starting OCR for base64 image...');

      const formData = new FormData();
      formData.append('base64Image', base64String);
      formData.append('apikey', this.API_KEY);
      formData.append('language', language);
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.OCRExitCode === 1 && data.ParsedResults && data.ParsedResults.length > 0) {
        const extractedText = data.ParsedResults[0].ParsedText;
        
        if (!extractedText || extractedText.trim() === '') {
          return {
            success: false,
            error: 'No text found in the image',
          };
        }

        return {
          success: true,
          text: extractedText.trim(),
        };
      } else {
        const errorMessage = data.ErrorMessage?.[0] || data.ParsedResults?.[0]?.ErrorMessage || 'OCR failed';
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error('❌ OCR Exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to process image',
      };
    }
  }
}

export const OCRService = new OCRServiceClass();

