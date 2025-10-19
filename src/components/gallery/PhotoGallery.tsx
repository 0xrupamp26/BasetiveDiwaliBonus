'use client';

import { useEffect, useState } from 'react';
import { useContractEvent, useContractRead } from 'wagmi';
import { basetiveDiwaliBonusABI } from '@/lib/contracts';
import { Submission } from '@/types';
import { PhotoCard } from './PhotoCard';

export function PhotoGallery() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Initial load
  const { data, refetch } = useContractRead({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: basetiveDiwaliBonusABI,
    functionName: 'getAllSubmissions',
  });

  // Listen for new submissions
  useContractEvent({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi: basetiveDiwaliBonusABI,
    eventName: 'SubmissionCreated',
    listener: (event) => {
      console.log('New submission detected:', event);
      refetch();
    },
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setSubmissions(data as Submission[]);
    }
  }, [data]);

  if (submissions.length === 0) {
    return <div className="text-center py-12">No submissions yet. Be the first to submit!</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.map((submission) => (
        <PhotoCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
}
