import { useCallback, useEffect, useState } from 'react';
import { addComment, cheer as cheerStore, getSocial, like as likeStore, SocialState } from '~/lib/social-store';

export function useSocial(submissionId: string, userAddress?: string) {
  const [state, setState] = useState<SocialState>({ likes: 0, cheers: 0, comments: [] });

  useEffect(() => {
    setState(getSocial(submissionId));
  }, [submissionId]);

  const like = useCallback(() => {
    const updated = likeStore(submissionId);
    setState(updated);
  }, [submissionId]);

  const cheer = useCallback(() => {
    const updated = cheerStore(submissionId);
    setState(updated);
  }, [submissionId]);

  const comment = useCallback((text: string) => {
    const display = userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'anon';
    const updated = addComment(submissionId, display, text);
    setState(updated);
  }, [submissionId, userAddress]);

  return {
    ...state,
    like,
    cheer,
    comment,
  };
}
