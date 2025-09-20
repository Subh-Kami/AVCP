import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { json } from '@helia/json'

export interface CredentialMetadata {
  credentialType: string
  subject: string
  recipientName: string
  recipientAddress: string
  issuerAddress: string
  issuerName: string
  issuedAt: number
  validUntil: number
  additionalData: any
  isRevoked: boolean
  revokedAt: number
  revocationReason: string
}

export interface PresentationMetadata {
  credential: CredentialMetadata
  presentationId: string
  createdAt: number
  purpose: string
  verificationMethod: string
  challenge?: string
  domain?: string
}

class IPFSService {
  private helia: any = null
  private jsonManager: any = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize Helia node
      this.helia = await createHelia()
      this.jsonManager = json(this.helia)
      this.isInitialized = true
      console.log('IPFS Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error)
      throw error
    }
  }

  async storeCredentialMetadata(metadata: CredentialMetadata): Promise<string> {
    await this.initialize()
    
    try {
      const cid = await this.jsonManager.add(metadata)
      return cid.toString()
    } catch (error) {
      console.error('Failed to store credential metadata:', error)
      throw error
    }
  }

  async storePresentationMetadata(metadata: PresentationMetadata): Promise<string> {
    await this.initialize()
    
    try {
      const cid = await this.jsonManager.add(metadata)
      return cid.toString()
    } catch (error) {
      console.error('Failed to store presentation metadata:', error)
      throw error
    }
  }

  async retrieveMetadata<T>(cid: string): Promise<T | null> {
    await this.initialize()
    
    try {
      const metadata = await this.jsonManager.get(cid)
      return metadata as T
    } catch (error) {
      console.error('Failed to retrieve metadata:', error)
      return null
    }
  }

  async createPresentationMetadata(
    credential: CredentialMetadata,
    purpose: string = 'authentication',
    challenge?: string,
    domain?: string
  ): Promise<PresentationMetadata> {
    const presentationId = `presentation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      credential,
      presentationId,
      createdAt: Date.now(),
      purpose,
      verificationMethod: 'EcdsaSecp256k1VerificationKey2019',
      challenge,
      domain
    }
  }

  async storeFullPresentationData(
    credential: CredentialMetadata,
    purpose?: string,
    challenge?: string,
    domain?: string
  ): Promise<string> {
    const presentationMetadata = await this.createPresentationMetadata(
      credential,
      purpose,
      challenge,
      domain
    )
    
    return await this.storePresentationMetadata(presentationMetadata)
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  async stop() {
    if (this.helia) {
      await this.helia.stop()
      this.isInitialized = false
    }
  }
}

// Create a singleton instance
const ipfsService = new IPFSService()

export default ipfsService

// For environments where IPFS is not available, provide a fallback
export class MockIPFSService {
  private storage = new Map<string, any>()

  async initialize() {
    console.log('Using mock IPFS service (fallback)')
  }

  async storeCredentialMetadata(metadata: CredentialMetadata): Promise<string> {
    const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.storage.set(cid, metadata)
    return cid
  }

  async storePresentationMetadata(metadata: PresentationMetadata): Promise<string> {
    const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.storage.set(cid, metadata)
    return cid
  }

  async retrieveMetadata<T>(cid: string): Promise<T | null> {
    return this.storage.get(cid) || null
  }

  async createPresentationMetadata(
    credential: CredentialMetadata,
    purpose: string = 'authentication',
    challenge?: string,
    domain?: string
  ): Promise<PresentationMetadata> {
    const presentationId = `presentation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      credential,
      presentationId,
      createdAt: Date.now(),
      purpose,
      verificationMethod: 'EcdsaSecp256k1VerificationKey2019',
      challenge,
      domain
    }
  }

  async storeFullPresentationData(
    credential: CredentialMetadata,
    purpose?: string,
    challenge?: string,
    domain?: string
  ): Promise<string> {
    const presentationMetadata = await this.createPresentationMetadata(
      credential,
      purpose,
      challenge,
      domain
    )
    
    return await this.storePresentationMetadata(presentationMetadata)
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  async stop() {
    this.storage.clear()
  }
}

// Export the appropriate service based on environment
export const getIPFSService = () => {
  // In development or when IPFS is not available, use mock service
  if (process.env.NODE_ENV === 'development' || typeof window === 'undefined') {
    return new MockIPFSService()
  }
  return ipfsService
}