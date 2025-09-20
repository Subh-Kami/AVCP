import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { CompactPresentationData } from './qrCodeService'

export interface ScanResult {
  success: boolean
  data?: CompactPresentationData
  rawData?: string
  error?: string
}

export interface ScannerConfig {
  fps?: number
  qrbox?: number | { width: number; height: number }
  aspectRatio?: number
  disableFlip?: boolean
  videoConstraints?: MediaTrackConstraints
}

class QRScannerService {
  private scanner: Html5QrcodeScanner | null = null
  private qrCode: Html5Qrcode | null = null
  private isScanning = false

  /**
   * Initialize QR scanner with camera
   */
  async initializeScanner(
    elementId: string,
    config?: ScannerConfig,
    onScanSuccess?: (result: ScanResult) => void,
    onScanFailure?: (error: string) => void
  ): Promise<void> {
    try {
      const defaultConfig = {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        disableFlip: false
      }

      const finalConfig = { ...defaultConfig, ...config }

      this.scanner = new Html5QrcodeScanner(
        elementId,
        finalConfig,
        false // verbose logging
      )

      this.scanner.render(
        (decodedText: string) => {
          const result = this.parseScannedData(decodedText)
          if (onScanSuccess) {
            onScanSuccess(result)
          }
        },
        (errorMessage: string) => {
          if (onScanFailure) {
            onScanFailure(errorMessage)
          }
        }
      )

      this.isScanning = true
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error)
      throw new Error('Scanner initialization failed')
    }
  }

  /**
   * Start scanning with a specific camera
   */
  async startScanning(
    elementId: string,
    cameraId?: string,
    config?: ScannerConfig,
    onScanSuccess?: (result: ScanResult) => void,
    onScanFailure?: (error: string) => void
  ): Promise<void> {
    try {
      this.qrCode = new Html5Qrcode(elementId)

      const defaultConfig = {
        fps: 10,
        qrbox: 250
      }

      const finalConfig = { ...defaultConfig, ...config }

      // Get available cameras if no specific camera ID provided
      let selectedCameraId = cameraId
      if (!selectedCameraId) {
        const cameras = await Html5Qrcode.getCameras()
        if (cameras && cameras.length > 0) {
          selectedCameraId = cameras[0].id
        } else {
          throw new Error('No cameras found')
        }
      }

      await this.qrCode.start(
        selectedCameraId,
        finalConfig,
        (decodedText: string) => {
          const result = this.parseScannedData(decodedText)
          if (onScanSuccess) {
            onScanSuccess(result)
          }
        },
        (errorMessage: string) => {
          if (onScanFailure) {
            onScanFailure(errorMessage)
          }
        }
      )

      this.isScanning = true
    } catch (error) {
      console.error('Failed to start QR scanning:', error)
      throw new Error('Failed to start camera scanning')
    }
  }

  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    try {
      if (this.scanner) {
        await this.scanner.clear()
        this.scanner = null
      }

      if (this.qrCode) {
        await this.qrCode.stop()
        this.qrCode = null
      }

      this.isScanning = false
    } catch (error) {
      console.error('Failed to stop scanning:', error)
    }
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<{ id: string; label: string }[]> {
    try {
      const cameras = await Html5Qrcode.getCameras()
      return cameras.map(camera => ({
        id: camera.id,
        label: camera.label || `Camera ${camera.id}`
      }))
    } catch (error) {
      console.error('Failed to get cameras:', error)
      return []
    }
  }

  /**
   * Scan QR from file upload
   */
  async scanFromFile(file: File): Promise<ScanResult> {
    try {
      const html5QrCode = new Html5Qrcode('temp-file-scan')
      const result = await html5QrCode.scanFile(file, true)
      return this.parseScannedData(result)
    } catch (error) {
      console.error('Failed to scan from file:', error)
      return {
        success: false,
        error: 'Failed to scan QR code from file'
      }
    }
  }

  /**
   * Parse scanned QR data
   */
  private parseScannedData(rawData: string): ScanResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawData)
      
      // Check if it's a valid verifiable presentation
      if (this.isValidPresentationData(parsed)) {
        return {
          success: true,
          data: parsed as CompactPresentationData,
          rawData
        }
      } else {
        return {
          success: false,
          rawData,
          error: 'Invalid presentation data format'
        }
      }
    } catch (error) {
      // If not JSON, return as raw data
      return {
        success: false,
        rawData,
        error: 'QR code does not contain valid JSON data'
      }
    }
  }

  /**
   * Validate presentation data structure
   */
  private isValidPresentationData(data: any): boolean {
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
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return permission.state === 'granted'
    } catch (error) {
      console.error('Failed to check camera permission:', error)
      return false
    }
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  }

  /**
   * Check if scanning is currently active
   */
  isCurrentlyScanning(): boolean {
    return this.isScanning
  }

  /**
   * Handle scanning errors gracefully
   */
  handleScanError(error: string): string {
    if (error.includes('NotAllowedError')) {
      return 'Camera access denied. Please allow camera permissions.'
    } else if (error.includes('NotFoundError')) {
      return 'No camera found on this device.'
    } else if (error.includes('NotReadableError')) {
      return 'Camera is being used by another application.'
    } else if (error.includes('OverconstrainedError')) {
      return 'Camera constraints cannot be satisfied.'
    } else {
      return 'An error occurred while accessing the camera.'
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopScanning()
  }
}

// Create singleton instance
const qrScannerService = new QRScannerService()

export default qrScannerService