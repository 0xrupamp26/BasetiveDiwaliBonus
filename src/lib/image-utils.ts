/**
 * Compresses an image file to a specified maximum width/height and quality
 * @param file The image file to compress
 * @param maxWidth Maximum width in pixels (default: 800)
 * @param maxHeight Maximum height in pixels (default: 600)
 * @param quality Image quality (0-1, default: 0.8)
 * @returns A Promise that resolves to a compressed File object
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Draw image with the new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create a new File from the compressed blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a File object to a base64 string
 * @param file The file to convert
 * @returns A Promise that resolves to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validates if a file is an image and within size limits
 * @param file The file to validate
 * @param maxSizeMB Maximum file size in MB (default: 5)
 * @returns An error message if validation fails, or null if valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string | null {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return 'Please upload an image file (JPEG, PNG, etc.)';
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Image must be smaller than ${maxSizeMB}MB`;
  }
  
  return null;
}

/**
 * Captures an image from a video stream
 * @param videoElement The video element to capture from
 * @param quality Image quality (0-1, default: 0.8)
 * @returns A Promise that resolves to a Blob of the captured image
 */
export function captureFromVideo(
  videoElement: HTMLVideoElement,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not create canvas context'));
      return;
    }
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to capture image from video'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}
