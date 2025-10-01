// lib/uuid.ts
export function generateUUID() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  array[6] = (array[6] & 0x0f) | 0x40
  array[8] = (array[8] & 0x3f) | 0x80
  return [...array].map((b) => b.toString(16).padStart(2, '0')).join('')
}
