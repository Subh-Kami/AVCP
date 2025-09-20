import { ethers } from 'ethers'
import { CONTRACTS, NETWORK_CONFIG } from '../constants'

export class ContractService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null

  constructor(provider?: ethers.BrowserProvider, signer?: ethers.JsonRpcSigner) {
    this.provider = provider || null
    this.signer = signer || null
  }

  // Initialize with provider and signer
  initialize(provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) {
    this.provider = provider
    this.signer = signer
  }

  // Get contract instance
  private getContract(contractName: 'ISSUER_REGISTRY' | 'CREDENTIAL_NFT' | 'VERIFIABLE_PRESENTATION', readonly = false) {
    const config = CONTRACTS[contractName]
    if (!config.address) {
      throw new Error(`${contractName} address not configured`)
    }

    const provider = readonly ? this.provider : this.signer
    if (!provider) {
      throw new Error('Provider/Signer not initialized')
    }

    return new ethers.Contract(config.address, config.abi, provider)
  }

  // Issuer Registry Methods
  async registerIssuer(
    issuerAddress: string,
    name: string,
    description: string,
    website: string,
    logoUrl: string
  ) {
    const contract = this.getContract('ISSUER_REGISTRY')
    const tx = await contract.registerIssuer(
      issuerAddress,
      name,
      description,
      website,
      logoUrl
    )
    return await tx.wait()
  }

  async isActiveIssuer(issuerAddress: string): Promise<boolean> {
    const contract = this.getContract('ISSUER_REGISTRY', true)
    return await contract.isActiveIssuer(issuerAddress)
  }

  async getIssuer(issuerAddress: string) {
    const contract = this.getContract('ISSUER_REGISTRY', true)
    const result = await contract.getIssuer(issuerAddress)
    return {
      name: result.name,
      description: result.description,
      website: result.website,
      logoUrl: result.logoUrl,
      isActive: result.isActive,
      registeredAt: Number(result.registeredAt),
      credentialsIssued: Number(result.credentialsIssued)
    }
  }

  async getAllIssuers(): Promise<string[]> {
    const contract = this.getContract('ISSUER_REGISTRY', true)
    return await contract.getAllIssuers()
  }

  async deactivateIssuer(issuerAddress: string) {
    const contract = this.getContract('ISSUER_REGISTRY')
    const tx = await contract.deactivateIssuer(issuerAddress)
    return await tx.wait()
  }

  async activateIssuer(issuerAddress: string) {
    const contract = this.getContract('ISSUER_REGISTRY')
    const tx = await contract.activateIssuer(issuerAddress)
    return await tx.wait()
  }

  async isAdmin(address: string): Promise<boolean> {
    const contract = this.getContract('ISSUER_REGISTRY', true)
    const adminRole = await contract.ADMIN_ROLE()
    return await contract.hasRole(adminRole, address)
  }

  // Credential NFT Methods
  async issueCredential(
    recipientAddress: string,
    credentialType: string,
    subject: string,
    recipientName: string,
    validUntil: number,
    additionalData: object,
    tokenURI: string
  ) {
    const contract = this.getContract('CREDENTIAL_NFT')
    const tx = await contract.issueCredential(
      recipientAddress,
      credentialType,
      subject,
      recipientName,
      validUntil,
      JSON.stringify(additionalData),
      tokenURI
    )
    return await tx.wait()
  }

  async revokeCredential(tokenId: number, reason: string) {
    const contract = this.getContract('CREDENTIAL_NFT')
    const tx = await contract.revokeCredential(tokenId, reason)
    return await tx.wait()
  }

  async isCredentialValid(tokenId: number): Promise<boolean> {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    return await contract.isCredentialValid(tokenId)
  }

  async getCredential(tokenId: number) {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    const result = await contract.getCredential(tokenId)
    return {
      credentialType: result.credentialType,
      subject: result.subject,
      recipientName: result.recipientName,
      recipientAddress: result.recipientAddress,
      issuerAddress: result.issuerAddress,
      issuedAt: Number(result.issuedAt),
      validUntil: Number(result.validUntil),
      additionalData: result.additionalData,
      isRevoked: result.isRevoked,
      revokedAt: Number(result.revokedAt),
      revocationReason: result.revocationReason
    }
  }

  async verifyCredential(tokenId: number) {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    const result = await contract.verifyCredential(tokenId)
    return {
      isValid: result.isValid,
      issuerName: result.issuerName,
      credentialData: {
        credentialType: result.credentialData.credentialType,
        subject: result.credentialData.subject,
        recipientName: result.credentialData.recipientName,
        recipientAddress: result.credentialData.recipientAddress,
        issuerAddress: result.credentialData.issuerAddress,
        issuedAt: Number(result.credentialData.issuedAt),
        validUntil: Number(result.credentialData.validUntil),
        additionalData: result.credentialData.additionalData,
        isRevoked: result.credentialData.isRevoked,
        revokedAt: Number(result.credentialData.revokedAt),
        revocationReason: result.credentialData.revocationReason
      }
    }
  }

  async getRecipientCredentials(recipientAddress: string): Promise<number[]> {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    const tokenIds = await contract.getRecipientCredentials(recipientAddress)
    return tokenIds.map((id: any) => Number(id))
  }

  async getIssuerCredentials(issuerAddress: string): Promise<number[]> {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    const tokenIds = await contract.getIssuerCredentials(issuerAddress)
    return tokenIds.map((id: any) => Number(id))
  }

  async getTotalSupply(): Promise<number> {
    const contract = this.getContract('CREDENTIAL_NFT', true)
    const total = await contract.totalSupply()
    return Number(total)
  }

  // Verifiable Presentation Methods
  async createPresentation(credentialId: number, ipfsCid: string, nonce: number) {
    const contract = this.getContract('VERIFIABLE_PRESENTATION')
    const tx = await contract.createPresentation(credentialId, ipfsCid, nonce)
    return await tx.wait()
  }

  async verifyPresentationOnChain(presentation: any) {
    const contract = this.getContract('VERIFIABLE_PRESENTATION', true)
    const result = await contract.verifyPresentation(presentation)
    return {
      isValid: result.isValid,
      issuerInfo: {
        name: result.issuerInfo.name,
        description: result.issuerInfo.description,
        website: result.issuerInfo.website,
        logoUrl: result.issuerInfo.logoUrl,
        isActive: result.issuerInfo.isActive,
        registeredAt: Number(result.issuerInfo.registeredAt),
        credentialsIssued: Number(result.issuerInfo.credentialsIssued)
      }
    }
  }

  async getCompactPresentation(credentialId: number, ipfsCid: string, signature: string): Promise<string> {
    const contract = this.getContract('VERIFIABLE_PRESENTATION', true)
    return await contract.getCompactPresentation(credentialId, ipfsCid, signature)
  }

  async verifyOffline(compactData: string, fullMetadata: string): Promise<boolean> {
    const contract = this.getContract('VERIFIABLE_PRESENTATION', true)
    return await contract.verifyOffline(compactData, fullMetadata)
  }

  async isNonceUsed(holder: string, nonce: number): Promise<boolean> {
    const contract = this.getContract('VERIFIABLE_PRESENTATION', true)
    return await contract.usedNonces(holder, nonce)
  }

  // Utility methods
  formatAddress(address: string): string {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  getExplorerUrl(chainId: number, txHash: string): string {
    const config = NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG]
    return `${config?.blockExplorer}/tx/${txHash}`
  }
}
