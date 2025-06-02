// Offline Action Queue Utility

const QUEUE_KEY = 'offline-action-queue-v1';

export interface OfflineAction {
  type: string;
  payload: any;
  timestamp: number;
}

export function enqueueOfflineAction(action: Omit<OfflineAction, 'timestamp'>) {
  const queue: OfflineAction[] = getOfflineQueue();
  queue.push({ ...action, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function processOfflineQueue(processor: (action: OfflineAction) => Promise<void>) {
  const queue = getOfflineQueue();
  for (const action of queue) {
    try {
      await processor(action);
    } catch (err) {
      // If any action fails, stop processing to retry later
      break;
    }
  }
  clearOfflineQueue();
} 