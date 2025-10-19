import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Submission } from '@/types';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export function PhotoCard({ submission }: { submission: Submission }) {
  const imageUrl = `https://ipfs.io/ipfs/${submission.cid}`;
  
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={imageUrl}
          alt={`Diwali submission by ${submission.submitter}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">
          Submission #{submission.id}
        </CardTitle>
        <div className="text-sm text-gray-500">
          {submission.score > 0 ? (
            <span className="text-green-500">Score: {submission.score}</span>
          ) : (
            <span className="text-yellow-500">Pending review</span>
          )}
          <span className="mx-2">•</span>
          {formatDistanceToNow(new Date(submission.timestamp * 1000), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 truncate max-w-[180px]">
            {submission.submitter}
          </span>
          {submission.isApproved && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Approved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
