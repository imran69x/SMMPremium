/**
 * Deterministic 6-digit User ID generator using djb2 hash.
 * Consistent across client and server.
 */
export const getShortUid = (uid: string): string => {
  if (!uid) return '000000';
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
};
