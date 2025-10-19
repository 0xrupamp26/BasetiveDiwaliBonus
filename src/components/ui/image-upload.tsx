'use client';

import { useState, useRef, ChangeEvent, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useAccount } from 'wagmi';
import { toast } from './use-toast';
import { compressImage, validateImageFile } from '~/lib/image-utils';
import { UI_CONSTANTS } from '~/lib/constants';

interface ImageUploadProps {
  onImageUpload: (file: File, ipfsHash?: string) => void;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  disabled?: boolean;
}

export function ImageUpload({
  onImageUpload,
  maxSizeMB = UI_CONSTANTS.MAX_IMAGE_SIZE_MB,
  maxWidth = UI_CONSTANTS.MAX_IMAGE_WIDTH,
  maxHeight = UI_CONSTANTS.MAX_IMAGE_HEIGHT,
  quality = UI_CONSTANTS.IMAGE_QUALITY,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { isConnected } = useAccount();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate the file
    const validationError = validateImageFile(file, maxSizeMB);
    if (validationError) {
      toast({
        title: 'Invalid file',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      setPreview(URL.createObjectURL(compressedFile));
      onImageUpload(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access the camera. Please check your permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File(
          [blob],
          `diwali-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );

        try {
          setIsLoading(true);
          const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
          setPreview(URL.createObjectURL(compressedFile));
          onImageUpload(compressedFile);
          stopCamera();
        } catch (error) {
          console.error('Error processing captured image:', error);
          toast({
            title: 'Error',
            description: 'Failed to process captured image. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }, 'image/jpeg', quality);
    }
  }, [maxWidth, maxHeight, quality, onImageUpload, stopCamera]);

  const handleRetake = () => {
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Connect your wallet to submit a photo
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Please connect your wallet to participate in the Diwali celebration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Capture the Magic of Diwali
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Share your brightest Diwali moments. Upload a photo or use your camera to capture the festive glow.
        </p>
      </div>

      {!preview && !isCameraActive && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 group">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isLoading || disabled}
            />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-48 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:shadow-lg p-6 relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-5 h-5 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  JPG, PNG (max {maxSizeMB}MB)
                  <span className="block mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Recommended: {maxWidth}×{maxHeight}px
                  </span>
                </p>
              </div>
            </label>
          </div>

          <div className="flex-1 group">
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading || disabled}
              className={`w-full h-48 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/10 hover:border-amber-400 dark:hover:border-amber-400 transition-all duration-300 hover:shadow-lg relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors" />
                </div>
                <span className="font-semibold text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                  Take a photo
                </span>
                <p className="text-xs text-amber-500/80 dark:text-amber-400/80 mt-1">
                  Use your camera
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {isCameraActive && (
        <div className="relative bg-gray-900/5 dark:bg-black/20 rounded-2xl p-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={stopCamera}
              className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-800 hover:bg-white transition-colors shadow-lg hover:scale-105 transform transition-transform"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={captureImage}
              disabled={isLoading}
              className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-xl hover:scale-105 transform transition-transform focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              <div className="h-full w-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-white/90"></div>
              </div>
            </button>

            <button className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-800 hover:bg-white transition-colors shadow-lg opacity-0 pointer-events-none">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isLoading ? 'Processing...' : 'Center your festive lights and capture! '}
            </p>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative">
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
              <Button
                type="button"
                onClick={handleRetake}
                className="bg-white/90 hover:bg-white text-gray-900 border border-gray-200"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Retake
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
