'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ethers, Interface, Log, JsonRpcProvider, WebSocketProvider } from 'ethers';
import ABI from '~/contracts/DiwaliLightsABI.json';
import { GalleryCard, type GalleryItem } from '~/components/gallery/GalleryCard';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || '';
const WS_RPC_URL = process.env.NEXT_PUBLIC_WS_RPC_URL || '';
const DEFAULT_LOOKBACK_BLOCKS = Number(process.env.NEXT_PUBLIC_GALLERY_LOOKBACK_BLOCKS || 200_000);

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (WS_RPC_URL) {
      try { return new WebSocketProvider(WS_RPC_URL); } catch {}
    }
    return new JsonRpcProvider(RPC_URL);
  }, []);
  const iface = useMemo(() => new Interface(ABI as any), []);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!CONTRACT_ADDRESS || !RPC_URL) {
      setError('Missing contract address or RPC URL.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchInitial() {
      try {
        setLoading(true);
        const latest = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latest - DEFAULT_LOOKBACK_BLOCKS);

        const eventTopic = ethers.id('SubmissionScored(bytes32,address,string,uint8)');

        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock,
          toBlock: latest,
          topics: [eventTopic],
        });

        const parsed = await Promise.all(
          logs.map(async (log) => toItemFromLog(provider, iface, log))
        );

        // Filter score > 5 and unique by id
        const filtered = parsed
          .filter((i): i is GalleryItem => !!i && i.score > 5)
          .reduce<GalleryItem[]>((acc, cur) => {
            if (!acc.find((x) => x.id === cur.id)) acc.push(cur);
            return acc;
          }, [])
          .sort((a, b) => b.timestamp - a.timestamp);

        if (!cancelled) setItems(filtered);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch gallery');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInitial();

    // Subscribe to new logs
    const eventTopic = ethers.id('SubmissionScored(bytes32,address,string,uint8)');
    const filter = { address: CONTRACT_ADDRESS, topics: [eventTopic] };

    const onLog = async (log: Log) => {
      const item = await toItemFromLog(provider, iface, log);
      if (!item || item.score <= 5) return;
      // Prepend if new
      setItems((prev) => {
        if (prev.some((p) => p.id === item.id)) return prev;
        return [item, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      });
    };

    // Subscribe via WS if available; otherwise, start polling
    const isWs = typeof (provider as any)._websocket !== 'undefined' || WS_RPC_URL.length > 0;
    if (isWs && typeof provider.on === 'function') {
      provider.on(filter as any, onLog);
    } else {
      const poll = async () => {
        try {
          const latest = await provider.getBlockNumber();
          const fromBlock = Math.max(0, latest - 2_000); // small recent window
          const logs = await provider.getLogs({ address: CONTRACT_ADDRESS, fromBlock, toBlock: latest, topics: [eventTopic] });
          for (const log of logs) {
            await onLog(log);
          }
        } catch {}
      };
      pollTimer.current = setInterval(poll, 10_000);
    }

    return () => {
      cancelled = true;
      try { provider.off(filter as any, onLog); } catch {}
      if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
    };
  }, [iface, provider]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-bold text-yellow-500 mb-2">Loading Diwali Magic...</div>
          <div className="text-gray-500">Gathering the brightest Diwali moments</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-yellow-500 mb-2">Diwali Gallery of Lights</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Celebrating the brightest Diwali moments from our community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <GalleryCard key={item.id} item={item} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-yellow-500 text-5xl mb-4">🪔</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No winning submissions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Be the first to share your Diwali celebration!
          </p>
        </div>
      )}
    </div>
  );
}

async function toItemFromLog(provider: JsonRpcProvider | WebSocketProvider, iface: Interface, log: Log): Promise<GalleryItem | null> {
  try {
    const parsed = iface.parseLog({ topics: log.topics, data: log.data });
    if (!parsed) return null;
    const { args } = parsed as any;
    // event SubmissionScored(bytes32 requestId, address submitter, string imageUrl, uint8 score)
    const requestId: string = args.requestId as string;
    const submitter: string = args.submitter as string;
    const imageUrl: string = args.imageUrl as string;
    const score: number = Number(args.score);
    const block = await provider.getBlock(log.blockNumber!);
    const timestamp = Number(block?.timestamp || Math.floor(Date.now() / 1000)) * 1000;

    return {
      id: requestId,
      imageUrl,
      score,
      timestamp,
      submitter: submitter as `0x${string}`,
    };
  } catch (e) {
    return null;
  }
}
