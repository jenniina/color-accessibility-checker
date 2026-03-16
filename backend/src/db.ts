import mongoose from 'mongoose'

let isConnected = false
let lastError: string | null = null

export function mongoIsConnected(): boolean {
  return isConnected
}

export function mongoLastError(): string | null {
  return lastError
}

export async function connectToMongo(): Promise<void> {
  if (isConnected) return

  const uri = process.env.MONGODB_URI
  if (!uri) {
    lastError = 'MONGODB_URI is not set'
    return
  }

  try {
    await mongoose.connect(uri)
    isConnected = true
    lastError = null
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e)
  }
}
