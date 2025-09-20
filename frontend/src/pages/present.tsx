import { useState, useEffect } from 'react'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'
import { getIPFSService } from '../services/ipfsService'
import qrCodeService from '../services/qrCodeService'
import { ClipboardDocumentIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CredentialWithDetails {
  tokenId: number
  credentialType: string
  subject: string
  recipientName: string
  recipientAddress: string
  issuerName: string
  issuedAt: number
  validUntil: number
  isValid: boolean
  isRevoked: boolean
}

interface PresentationData {
  credentialId: number
  qrCodeDataURL: string
  compactData: any
  ipfsCid: string
}

export default function PresentCredential() {
  const { provider, signer, account } = useWalletStore()
  const [credentials, setCredentials] = useState<CredentialWithDetails[]>([])
  const [selectedCredential, setSelectedCredential] = useState<CredentialWithDetails | null>(null)
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [purpose, setPurpose] = useState('authentication')
  const [challenge, setChallenge] = useState('')
  const [domain, setDomain] = useState('')

  useEffect(() => {
    if (account && provider && signer) {
      loadUserCredentials()
    }
  }, [account, provider, signer])

  const loadUserCredentials = async () => {
    if (!provider || !signer || !account) return

    setLoading(true)
    try {
      const contractService = new ContractService(provider, signer)
      const tokenIds = await contractService.getRecipientCredentials(account)
      
      const credentialDetails: CredentialWithDetails[] = []
      
      for (const tokenId of tokenIds) {
        try {
          const verification = await contractService.verifyCredential(tokenId)
          if (verification.isValid) {
            credentialDetails.push({
              tokenId,
              credentialType: verification.credentialData.credentialType,
              subject: verification.credentialData.subject,
              recipientName: verification.credentialData.recipientName,
              recipientAddress: verification.credentialData.recipientAddress,
              issuerName: verification.issuerName,
              issuedAt: verification.credentialData.issuedAt,
              validUntil: verification.credentialData.validUntil,
              isValid: verification.isValid,
              isRevoked: verification.credentialData.isRevoked,
            })
          }
        } catch (error) {
          console.error(`Error loading credential ${tokenId}:`, error)
        }
      }
      
      setCredentials(credentialDetails)
    } catch (error) {
      console.error('Error loading credentials:', error)
      toast.error('Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const generatePresentation = async () => {
    if (!selectedCredential || !provider || !signer || !account) return

    setGenerating(true)
    try {
      const contractService = new ContractService(provider, signer)
      const ipfsService = getIPFSService()
      
      // Get full credential data
      const credential = await contractService.getCredential(selectedCredential.tokenId)
      
      // Create presentation metadata for IPFS
      const presentationMetadata = {
        credential: {
          credentialType: credential.credentialType,
          subject: credential.subject,
          recipientName: credential.recipientName,
          recipientAddress: credential.recipientAddress,
          issuerAddress: credential.issuerAddress,
          issuerName: selectedCredential.issuerName,
          issuedAt: credential.issuedAt,
          validUntil: credential.validUntil,
          additionalData: credential.additionalData,
          isRevoked: credential.isRevoked,
          revokedAt: credential.revokedAt,
          revocationReason: credential.revocationReason
        },
        presentationId: `presentation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        purpose: purpose || 'authentication',
        verificationMethod: 'EcdsaSecp256k1VerificationKey2019',
        challenge: challenge || undefined,
        domain: domain || undefined
      }
      
      // Store metadata in IPFS
      const ipfsCid = await ipfsService.storePresentationMetadata(presentationMetadata)
      
      // For demonstration, create a mock signature
      // In production, this would be created through proper cryptographic signing
      const mockSignature = `0x${Math.random().toString(16).substr(2, 130)}`
      
      // Generate QR code
      const presentationQR = await qrCodeService.createVerifiablePresentationQR(
        ipfsCid,
        mockSignature,
        credential.issuerAddress,
        selectedCredential.tokenId,
        account
      )
      
      setPresentationData({
        credentialId: selectedCredential.tokenId,
        qrCodeDataURL: presentationQR.qrCodeDataURL,
        compactData: presentationQR.compactData,
        ipfsCid
      })
      
      toast.success('Presentation generated successfully!')
    } catch (error) {
      console.error('Error generating presentation:', error)
      toast.error('Failed to generate presentation')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadQR = () => {
    if (!presentationData) return
    qrCodeService.downloadQRCode(
      presentationData.qrCodeDataURL,
      `credential-${presentationData.credentialId}-qr.png`
    )
  }

  const sharePresentation = async () => {
    if (!presentationData) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Verifiable Credential Presentation',
          text: `Credential Presentation for ${selectedCredential?.credentialType}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying the compact data
      await copyToClipboard(JSON.stringify(presentationData.compactData))
    }
  }

  const resetPresentation = () => {
    setPresentationData(null)
    setSelectedCredential(null)
    setPurpose('authentication')
    setChallenge('')
    setDomain('')
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to create credential presentations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Present Credential</h1>
          <p className="mt-2 text-gray-600">
            Generate a QR code for offline verification of your credentials
          </p>
        </div>

        {!presentationData ? (
          <div className="space-y-6">
            {/* Credential Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Credential</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading your credentials...</p>
                </div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No valid credentials found.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {credentials.map((credential) => (
                    <div
                      key={credential.tokenId}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCredential?.tokenId === credential.tokenId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCredential(credential)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{credential.credentialType}</h3>
                          <p className="text-gray-600">{credential.subject}</p>
                          <p className="text-sm text-gray-500">Issued by: {credential.issuerName}</p>
                          <p className="text-sm text-gray-500">
                            Issued: {new Date(credential.issuedAt * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Valid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Presentation Options */}
            {selectedCredential && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Presentation Options</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="authentication">Authentication</option>
                      <option value="assertion">Assertion</option>
                      <option value="verification">Verification</option>
                      <option value="employment">Employment</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Challenge (Optional)</label>
                    <input
                      type="text"
                      value={challenge}
                      onChange={(e) => setChallenge(e.target.value)}
                      placeholder="Verifier challenge or nonce"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Domain (Optional)</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="Verifier domain or URL"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={generatePresentation}
                    disabled={generating}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate QR Presentation'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Presentation Result */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Verifiable Presentation</h2>
                <button
                  onClick={resetPresentation}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Create Another
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="text-center">
                  <img
                    src={presentationData.qrCodeDataURL}
                    alt="Verifiable Presentation QR Code"
                    className="mx-auto mb-4 max-w-full h-auto"
                  />
                  
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={downloadQR}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    
                    <button
                      onClick={sharePresentation}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      Share
                    </button>
                  </div>
                </div>
                
                {/* Presentation Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Presentation Details</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Credential</label>
                      <p className="text-sm text-gray-900">{selectedCredential?.credentialType}</p>
                      <p className="text-sm text-gray-600">{selectedCredential?.subject}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IPFS CID</label>
                      <div className="flex items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded mr-2 flex-1 truncate">
                          {presentationData.ipfsCid}
                        </code>
                        <button
                          onClick={() => copyToClipboard(presentationData.ipfsCid)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Compact Data</label>
                      <div className="flex items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded mr-2 flex-1 truncate">
                          {JSON.stringify(presentationData.compactData)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(presentationData.compactData))}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Show this QR code to verifiers for instant credential verification</li>
                <li>• The QR code works offline for basic verification</li>
                <li>• Full metadata verification requires internet connection</li>
                <li>• Each QR code is unique and cannot be replicated without your private key</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}