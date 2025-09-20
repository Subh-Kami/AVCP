import QRCode from 'qrcode'

export interface CompactPresentationData {
  cid: string
  sig: string
  issuer: string
  id: number
  holder: string
  timestamp?: number
}

export interface VerifiablePresentationQR {
  compactData: CompactPresentationData
  qrCodeDataURL: string
}

class QRCodeService {
  /**
   * Generate QR code from compact presentation data
   */
  async generateQRCode(
    compactData: CompactPresentationData,
    options?: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    }
  ): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      const jsonString = JSON.stringify(compactData)
      const qrCodeDataURL = await QRCode.toDataURL(jsonString, finalOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error('QR code generation failed')
    }
  }

  /**
   * Generate QR code from JSON string
   */
  async generateQRCodeFromString(
    data: string,
    options?: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    }
  ): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      return await QRCode.toDataURL(data, finalOptions)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error('QR code generation failed')
    }
  }

  /**
   * Create complete verifiable presentation QR
   */
  async createVerifiablePresentationQR(
    cid: string,
    signature: string,
    issuerAddress: string,
    credentialId: number,
    holderAddress: string,
    options?: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    }
  ): Promise<VerifiablePresentationQR> {
    const compactData: CompactPresentationData = {
      cid,
      sig: signature,
      issuer: issuerAddress,
      id: credentialId,
      holder: holderAddress,
      timestamp: Math.floor(Date.now() / 1000)
    }

    const qrCodeDataURL = await this.generateQRCode(compactData, options)

    return {
      compactData,
      qrCodeDataURL
    }
  }

  /**
   * Parse QR code data back to compact presentation
   */
  parseQRData(qrData: string): CompactPresentationData | null {
    try {
      const parsed = JSON.parse(qrData)
      
      // Validate required fields
      if (!parsed.cid || !parsed.sig || !parsed.issuer || parsed.id === undefined || !parsed.holder) {
        throw new Error('Missing required fields in QR data')
      }

      return parsed as CompactPresentationData
    } catch (error) {
      console.error('Failed to parse QR data:', error)
      return null
    }
  }

  /**
   * Validate QR data structure
   */
  validateQRData(data: any): data is CompactPresentationData {
    return (
      typeof data === 'object' &&
      typeof data.cid === 'string' &&
      typeof data.sig === 'string' &&
      typeof data.issuer === 'string' &&
      typeof data.id === 'number' &&
      typeof data.holder === 'string'
    )
  }

  /**
   * Generate QR code for credential sharing (simpler format)
   */
  async generateCredentialShareQR(
    credentialId: number,
    holderAddress: string,
    options?: {
      width?: number
      margin?: number
    }
  ): Promise<string> {
    const shareData = {
      type: 'credential-share',
      id: credentialId,
      holder: holderAddress,
      timestamp: Math.floor(Date.now() / 1000)
    }

    return await this.generateQRCodeFromString(JSON.stringify(shareData), options)
  }

  /**
   * Download QR code as image
   */
  downloadQRCode(dataURL: string, filename: string = 'credential-qr.png') {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Copy QR code to clipboard
   */
  async copyQRToClipboard(dataURL: string): Promise<boolean> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      
      return true
    } catch (error) {
      console.error('Failed to copy QR code to clipboard:', error)
      return false
    }
  }

  /**
   * Generate multiple QR codes for batch processing
   */
  async generateBatchQRCodes(
    presentations: CompactPresentationData[],
    options?: {
      width?: number
      margin?: number
    }
  ): Promise<VerifiablePresentationQR[]> {
    const results: VerifiablePresentationQR[] = []

    for (const compactData of presentations) {
      try {
        const qrCodeDataURL = await this.generateQRCode(compactData, options)
        results.push({
          compactData,
          qrCodeDataURL
        })
      } catch (error) {
        console.error(`Failed to generate QR code for credential ${compactData.id}:`, error)
        // Continue with other QR codes even if one fails
      }
    }

    return results
  }
}

// Create singleton instance
const qrCodeService = new QRCodeService()

export default qrCodeService