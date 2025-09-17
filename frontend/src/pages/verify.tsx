import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Header } from '../components/Header'
import { LoadingSpinner, ErrorState, EmptyState } from '../components/UI'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'

const VerifyPage: React.FC = () => {
  const router = useRouter()
  const { provider, signer } = useWalletStore()
  const [tokenId, setTokenId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationResult, setVerificationResult] = useState<any>(null)

  // Check for tokenId in URL query params
  useEffect(() => {
    if (router.query.tokenId) {
      setTokenId(router.query.tokenId as string)
    }
  }, [router.query.tokenId])

  // Auto-verify if tokenId is present in URL
  useEffect(() => {
    if (tokenId && provider && signer && !verificationResult && !loading) {
      handleVerify()
    }
  }, [tokenId, provider, signer])

  const handleVerify = async () => {
    if (!provider || !signer || !tokenId) {
      setError('Please connect your wallet and enter a token ID')
      return
    }

    setLoading(true)
    setError('')
    setVerificationResult(null)

    try {
      const contractService = new ContractService(provider, signer)
      const result = await contractService.verifyCredential(parseInt(tokenId))
      setVerificationResult(result)
    } catch (err: any) {
      setError(err.message || 'Failed to verify credential')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <>
      <Head>
        <title>Verify Credential - AVCP</title>
        <meta name="description" content="Verify the authenticity of credentials on the Avalanche blockchain" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Verify Credential
            </h1>
            <p className="text-lg text-gray-600">
              Enter a credential token ID to verify its authenticity and validity
            </p>
          </div>

          {/* Verification Form */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="number"
                placeholder="Enter Token ID (e.g. 0, 1, 2...)"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="form-input flex-1"
                min="0"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !tokenId}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Credential'
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  verificationResult.isValid ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {verificationResult.isValid ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${
                    verificationResult.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {verificationResult.isValid ? 'Valid Credential' : 'Invalid Credential'}
                  </h2>
                  <p className="text-gray-600">
                    {verificationResult.isValid 
                      ? 'This credential is authentic and currently valid'
                      : 'This credential is not valid or has been revoked'
                    }
                  </p>
                </div>
              </div>

              {/* Credential Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Credential Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p className="text-gray-900">{verificationResult.credentialData.credentialType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Subject:</span>
                      <p className="text-gray-900">{verificationResult.credentialData.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Recipient:</span>
                      <p className="text-gray-900">{verificationResult.credentialData.recipientName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Recipient Address:</span>
                      <p className="text-gray-900 font-mono text-sm">
                        {formatAddress(verificationResult.credentialData.recipientAddress)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Issuer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Issuer:</span>
                      <p className="text-gray-900">{verificationResult.issuerName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Issuer Address:</span>
                      <p className="text-gray-900 font-mono text-sm">
                        {formatAddress(verificationResult.credentialData.issuerAddress)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Issue Date:</span>
                      <p className="text-gray-900">{formatDate(verificationResult.credentialData.issuedAt)}</p>
                    </div>
                    {verificationResult.credentialData.validUntil > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Valid Until:</span>
                        <p className="text-gray-900">{formatDate(verificationResult.credentialData.validUntil)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Revocation Info */}
              {verificationResult.credentialData.isRevoked && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Credential Revoked</h3>
                  <p className="text-red-700 mb-2">
                    <strong>Reason:</strong> {verificationResult.credentialData.revocationReason}
                  </p>
                  <p className="text-red-700">
                    <strong>Revoked On:</strong> {formatDate(verificationResult.credentialData.revokedAt)}
                  </p>
                </div>
              )}

              {/* Additional Data */}
              {verificationResult.credentialData.additionalData && verificationResult.credentialData.additionalData !== '{}' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(verificationResult.credentialData.additionalData), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!verificationResult && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Verify</h3>
              <p className="text-gray-600 mb-4">
                Enter a credential token ID above to check its authenticity and validity
              </p>
              <p className="text-sm text-gray-500">
                Token IDs are sequential numbers starting from 0 (e.g., 0, 1, 2, 3...)
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default VerifyPage
