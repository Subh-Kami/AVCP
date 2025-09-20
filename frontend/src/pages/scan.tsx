import { useState, useEffect, useRef } from 'react'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'
import { getIPFSService, PresentationMetadata } from '../services/ipfsService'
import qrScannerService, { ScanResult } from '../services/qrScannerService'
import { CompactPresentationData } from '../services/qrCodeService'
import { CameraIcon, DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface VerificationResult {
  isValid: boolean
  credential?: any
  issuerInfo?: any
  presentationMetadata?: PresentationMetadata
  error?: string
}

export default function ScanCredential() {
  const { provider } = useWalletStore()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<CompactPresentationData | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const scannerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load available cameras
    loadCameras()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      stopScanning()
    }
  }, [])

  const loadCameras = async () => {
    try {
      const availableCameras = await qrScannerService.getAvailableCameras()
      setCameras(availableCameras)
      if (availableCameras.length > 0) {
        setSelectedCamera(availableCameras[0].id)
      }
    } catch (error) {
      console.error('Failed to load cameras:', error)
    }
  }

  const startScanning = async () => {
    if (!selectedCamera) {
      toast.error('No camera selected')
      return
    }

    try {
      setIsScanning(true)
      setScanResult(null)
      setVerificationResult(null)

      await qrScannerService.startScanning(
        'qr-scanner',
        selectedCamera,
        { fps: 10, qrbox: 250 },
        handleScanSuccess,
        handleScanError
      )
    } catch (error) {
      console.error('Failed to start scanning:', error)
      toast.error('Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      await qrScannerService.stopScanning()
      setIsScanning(false)
    } catch (error) {
      console.error('Failed to stop scanning:', error)
    }
  }

  const handleScanSuccess = async (result: ScanResult) => {
    if (result.success && result.data) {
      setScanResult(result.data)
      await stopScanning()
      await verifyPresentation(result.data)
    }
  }

  const handleScanError = (error: string) => {
    // Only show critical errors to avoid spam
    if (error.includes('NotAllowedError') || error.includes('NotFoundError')) {
      toast.error(qrScannerService.handleScanError(error))
    }
  }

  const verifyPresentation = async (presentationData: CompactPresentationData) => {
    setLoading(true)
    try {
      const result: VerificationResult = { isValid: false }

      // Basic validation
      if (!presentationData.cid || !presentationData.sig || !presentationData.issuer) {
        result.error = 'Invalid presentation data format'
        setVerificationResult(result)
        return
      }

      // Try to get full metadata from IPFS if online
      if (isOnline) {
        try {
          const ipfsService = getIPFSService()
          const metadata = await ipfsService.retrieveMetadata<PresentationMetadata>(presentationData.cid)
          
          if (metadata) {
            result.presentationMetadata = metadata
          }
        } catch (error) {
          console.error('Failed to retrieve IPFS metadata:', error)
        }
      }

      // Verify on-chain if provider is available
      if (provider) {
        try {
          const contractService = new ContractService(provider)
          
          // Verify the credential exists and is valid
          const credentialVerification = await contractService.verifyCredential(presentationData.id)
          
          if (credentialVerification.isValid) {
            result.isValid = true
            result.credential = credentialVerification.credentialData
            result.issuerInfo = {
              name: credentialVerification.issuerName,
              address: presentationData.issuer
            }
          } else {
            result.error = 'Credential is not valid or has been revoked'
          }
        } catch (error) {
          console.error('Failed to verify on-chain:', error)
          result.error = 'Failed to verify credential on blockchain'
        }
      } else {
        // Offline verification - basic structure validation
        result.isValid = true
        result.error = 'Offline mode: Basic validation only. Connect wallet for full verification.'
      }

      setVerificationResult(result)
      
      if (result.isValid) {
        toast.success('Credential verified successfully!')
      } else {
        toast.error(result.error || 'Credential verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        isValid: false,
        error: 'Verification process failed'
      })
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await qrScannerService.scanFromFile(file)
      if (result.success && result.data) {
        setScanResult(result.data)
        await verifyPresentation(result.data)
      } else {
        toast.error(result.error || 'Failed to scan QR code from file')
      }
    } catch (error) {
      console.error('File scan error:', error)
      toast.error('Failed to scan QR code from file')
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setVerificationResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify Credential</h1>
          <p className="mt-2 text-gray-600">
            Scan QR codes to verify credential presentations
          </p>
          
          {!isOnline && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                You're currently offline. Basic verification is available, but full blockchain verification requires an internet connection.
              </p>
            </div>
          )}
        </div>

        {!scanResult ? (
          <div className="space-y-6">
            {/* Camera Scanner */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Scanner</h2>
              
              {cameras.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isScanning}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="text-center">
                <div
                  id="qr-scanner"
                  ref={scannerRef}
                  className={`mx-auto mb-4 ${isScanning ? 'block' : 'hidden'}`}
                  style={{ maxWidth: '400px' }}
                />
                
                {!isScanning ? (
                  <div className="py-12">
                    <CameraIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Click to start camera scanning</p>
                    <button
                      onClick={startScanning}
                      disabled={cameras.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Stop Scanning
                  </button>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload QR Image</h2>
              
              <div className="text-center">
                <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Upload an image containing a QR code</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  Choose File
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Verification Results */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Verification Result</h2>
                <button
                  onClick={resetScanner}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Scan Another
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Verifying credential...</p>
                </div>
              ) : verificationResult ? (
                <div className="space-y-6">
                  {/* Verification Status */}
                  <div className={`flex items-center p-4 rounded-lg ${
                    verificationResult.isValid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {verificationResult.isValid ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        verificationResult.isValid ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {verificationResult.isValid ? 'Credential Verified' : 'Verification Failed'}
                      </h3>
                      {verificationResult.error && (
                        <p className={`text-sm ${
                          verificationResult.isValid ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {verificationResult.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Credential Details */}
                  {verificationResult.credential && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Credential Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type</label>
                          <p className="text-sm text-gray-900">{verificationResult.credential.credentialType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subject</label>
                          <p className="text-sm text-gray-900">{verificationResult.credential.subject}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Recipient</label>
                          <p className="text-sm text-gray-900">{verificationResult.credential.recipientName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Issued Date</label>
                          <p className="text-sm text-gray-900">
                            {new Date(verificationResult.credential.issuedAt * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Issuer Information */}
                  {verificationResult.issuerInfo && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Issuer Information</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-sm text-gray-900">{verificationResult.issuerInfo.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <p className="text-sm font-mono text-gray-600">{verificationResult.issuerInfo.address}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Presentation Metadata */}
                  {verificationResult.presentationMetadata && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Presentation Details</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Purpose</label>
                          <p className="text-sm text-gray-900">{verificationResult.presentationMetadata.purpose}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Created</label>
                          <p className="text-sm text-gray-900">
                            {new Date(verificationResult.presentationMetadata.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {verificationResult.presentationMetadata.challenge && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Challenge</label>
                            <p className="text-sm text-gray-900">{verificationResult.presentationMetadata.challenge}</p>
                          </div>
                        )}
                        {verificationResult.presentationMetadata.domain && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Domain</label>
                            <p className="text-sm text-gray-900">{verificationResult.presentationMetadata.domain}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw QR Data */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">QR Code Data</h3>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap break-all">
                        {JSON.stringify(scanResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Processing scan result...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}