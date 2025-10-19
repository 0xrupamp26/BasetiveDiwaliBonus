'use client';

import { useState, useRef } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { useRouter } from 'next/navigation';
import { basetiveDiwaliBonusABI } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TransactionStatus } from './TransactionStatus';
import { Loader2, UploadCloud } from 'lucide-react';
import { uploadToIPFS } from '@/lib/ipfs';
import { toast } from 'sonner';

export function SubmitPhotoForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address } = useAccount();
  const router = useRouter();

  const { write: submitPhoto, isLoading } = useContractWrite({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: basetiveDiwaliBonusABI,
    functionName: 'submitPhoto',
    onSuccess: (data) => {
      setTxHash(data.hash);
    },
    onError: (error) => {
      console.error('Submission error:', error);
      setIsSubmitting(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !address) return;
    
    setIsUploading(true);
    try {
      // Upload to IPFS
      const cid = await uploadToIPFS(file);
      
      // Submit to blockchain
      setIsSubmitting(true);
      submitPhoto({
        args: [cid],
      });
    } catch (error) {
      console.error('Error submitting photo:', error);
      toast.error('Failed to submit photo. Please try again.');
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const handleConfirmed = () => {
    setIsSubmitting(false);
    // Refresh the gallery or redirect
    router.refresh();
  };

  const handleError = () => {
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading || isSubmitting}
          />
          
          {previewUrl ? (
            <div className="relative h-64 w-full">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-500">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!file || isUploading || isSubmitting || !address}
          className="w-full"
        >
          {(isUploading || isSubmitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? 'Uploading...' : 'Submitting...'}
            </>
          ) : (
            'Submit Photo'
          )}
        </Button>
      </form>

      {txHash && (
        <TransactionStatus
          hash={txHash}
          onConfirmed={handleConfirmed}
          onError={handleError}
        />
      )}
    </div>
  );
}
