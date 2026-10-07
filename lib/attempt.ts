export const attemptTokenKey = (attemptId: string) => `eval_hive_attempt_token:${attemptId}`;
export const integrityQueueKey = (attemptId: string) => `eval_hive_integrity_queue:${attemptId}`;
export const integritySequenceKey = (attemptId: string) => `eval_hive_integrity_sequence:${attemptId}`;

export function saveAttemptSession(attemptId: string, token: string, nextSequence?: number) {
  localStorage.setItem(attemptTokenKey(attemptId), token);
  if (nextSequence) localStorage.setItem(integritySequenceKey(attemptId), String(nextSequence));
}

export function attemptHeaders(attemptId: string) {
  const token = localStorage.getItem(attemptTokenKey(attemptId));
  return token ? { "x-attempt-session": token } : {};
}

export function nextIntegritySequence(attemptId: string) {
  const next = Math.max(1, Number(localStorage.getItem(integritySequenceKey(attemptId)) || 1));
  localStorage.setItem(integritySequenceKey(attemptId), String(next + 1));
  return next;
}
