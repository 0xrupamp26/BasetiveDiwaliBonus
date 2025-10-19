"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, MessageSquare, Zap, Clock, User } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useSocial } from "~/hooks/useSocial";
import { ipfsToHttp } from "~/lib/ipfs";
import { shortAddress, formatDateTime } from "~/lib/format";

export type GalleryItem = {
  id: string; // requestId hex
  imageUrl: string; // ipfs:// or http
  score: number;
  timestamp: number; // seconds or ms
  submitter: `0x${string}`;
};

export function GalleryCard({ item }: { item: GalleryItem }) {
  const [commentText, setCommentText] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const { likes, comments, cheers, like, cheer, comment } = useSocial(item.id, item.submitter);

  const httpSrc = ipfsToHttp(item.imageUrl);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-md border border-yellow-200 bg-white dark:bg-gray-900">
      {/* Festive glow border */}
      <div className="absolute -inset-[1px] bg-[conic-gradient(at_50%_0%,#fde047_0deg,#f59e0b_90deg,#a855f7_180deg,#f97316_270deg,#fde047_360deg)] opacity-30 blur-lg" aria-hidden />

      <div className="relative">
        <div className={`relative h-64 w-full bg-gray-100 dark:bg-gray-800 ${imgLoaded ? "" : "animate-pulse"}`}>
          {/* Use next/image for better perf */}
          <Image
            src={httpSrc}
            alt={`Diwali celebration by ${item.submitter}`}
            fill
            priority={false}
            onLoadingComplete={() => setImgLoaded(true)}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <span className="mr-1">⭐</span> {item.score}/10
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                <User className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {shortAddress(item.submitter)}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {formatDateTime(item.timestamp)}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
            <button
              onClick={like}
              className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4 mr-1" />
              {likes}
            </button>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MessageSquare className="h-4 w-4 mr-1" />
              {comments.length}
            </div>
            <button
              onClick={cheer}
              className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition-colors"
            >
              <Zap className="h-4 w-4 mr-1" />
              {cheers} Cheer
            </button>
          </div>

          {/* Comment box */}
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a festive comment..."
                className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <Button
                disabled={!commentText.trim()}
                onClick={() => {
                  if (!commentText.trim()) return;
                  comment(commentText.trim());
                  setCommentText("");
                }}
                className="w-auto bg-yellow-500 hover:bg-yellow-600"
              >
                Send
              </Button>
            </div>
            {comments.length > 0 && (
              <div className="mt-3 space-y-2 max-h-24 overflow-auto pr-2">
                {comments.map((c) => (
                  <div key={c.id} className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium mr-1">{c.user}:</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
