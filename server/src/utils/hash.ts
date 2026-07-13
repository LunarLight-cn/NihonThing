export const hashPassword = async (password: string, salt: string) => {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const generateSaltAndHash = async (password: string) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const hash = await hashPassword(password, saltHex)
  return `${saltHex}:${hash}`
}

export const verifyPassword = async (password: string, storedHash: string, globalSalt: string) => {
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':')
    const calculatedHash = await hashPassword(password, salt)
    return calculatedHash === hash
  } else {
    // Legacy global salt fallback
    const calculatedHash = await hashPassword(password, globalSalt)
    return calculatedHash === storedHash
  }
}
