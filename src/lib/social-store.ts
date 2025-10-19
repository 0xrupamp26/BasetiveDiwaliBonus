type Comment = {
  id: string;
  user: string; // wallet address (short or full)
  text: string;
  time: number; // unix ms
};

export type SocialState = {
  likes: number;
  cheers: number;
  comments: Comment[];
};

const STORAGE_KEY = 'diwali_social_v1';

function readAll(): Record<string, SocialState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SocialState>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getSocial(submissionId: string): SocialState {
  const all = readAll();
  return all[submissionId] || { likes: 0, cheers: 0, comments: [] };
}

export function like(submissionId: string) {
  const all = readAll();
  const current = all[submissionId] || { likes: 0, cheers: 0, comments: [] };
  all[submissionId] = { ...current, likes: current.likes + 1 };
  writeAll(all);
  return all[submissionId];
}

export function cheer(submissionId: string) {
  const all = readAll();
  const current = all[submissionId] || { likes: 0, cheers: 0, comments: [] };
  all[submissionId] = { ...current, cheers: current.cheers + 1 };
  writeAll(all);
  return all[submissionId];
}

export function addComment(submissionId: string, user: string, text: string) {
  const all = readAll();
  const current = all[submissionId] || { likes: 0, cheers: 0, comments: [] };
  const newComment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user,
    text,
    time: Date.now(),
  };
  all[submissionId] = { ...current, comments: [newComment, ...current.comments] };
  writeAll(all);
  return all[submissionId];
}
