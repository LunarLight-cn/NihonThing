export const verifyMagicBytes = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  // Magic bytes
  // JPEG: FFD8FFE0, FFD8FFE1, FFD8FFE2, FFD8FFEE, FFD8FFDB
  // PNG: 89504E47
  // GIF: 47494638
  // WEBP: RIFF....WEBP (checking first 4 bytes of RIFF)
  if (hex.startsWith('FFD8FF')) return true // JPEG
  if (hex.startsWith('89504E47')) return true // PNG
  if (hex.startsWith('47494638')) return true // GIF
  if (hex.startsWith('52494646')) {
    // Check if bytes 8-11 spell 'WEBP' (57 45 42 50)
    if (buffer.byteLength >= 12) {
      const webpBytes = new Uint8Array(buffer.slice(8, 12))
      const webpHex = Array.from(webpBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      if (webpHex === '57454250') return true
    }
  }
  return false
}
