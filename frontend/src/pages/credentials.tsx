import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Header } from '../components/Header'
import { CredentialCard } from '../components/CredentialCard'
import { LoadingState, ErrorState, EmptyState } from '../components/UI'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'

interface CredentialWithDetails {
  tokenId: number
  credentialType: string
  subject: string
  recipientName: string
  issuerName: string
  issuedAt: number
  validUntil: number
  isValid: boolean
  isRevoked: boolean
  additionalData: string
}

const CredentialsPage: React.FC = () => {
  const { provider, signer, account, isConnected } = useWalletStore()
  const [credentials, setCredentials] = useState<CredentialWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCredential, setSelectedCredential] = useState<CredentialWithDetails | null>(null)
  const [filter, setFilter] = useState('all') // all, valid, expired, revoked

  useEffect(() => {
    if (isConnected && account) {
      loadCredentials()
    }
  }, [isConnected, account])

  const loadCredentials = async () => {
    if (!provider || !signer || !account) return

    setLoading(true)
    setError('')

    try {
      const contractService = new ContractService(provider, signer)
      const tokenIds = await contractService.getRecipientCredentials(account)
      
      const credentialDetails: CredentialWithDetails[] = []
      
      for (const tokenId of tokenIds) {
        try {
          const verification = await contractService.verifyCredential(tokenId)
          credentialDetails.push({
            tokenId,
            credentialType: verification.credentialData.credentialType,
            subject: verification.credentialData.subject,
            recipientName: verification.credentialData.recipientName,
            issuerName: verification.issuerName,
            issuedAt: verification.credentialData.issuedAt,
            validUntil: verification.credentialData.validUntil,
            isValid: verification.isValid,
            isRevoked: verification.credentialData.isRevoked,
            additionalData: verification.credentialData.additionalData
          })
        } catch (err) {
          console.error(`Failed to load credential ${tokenId}:`, err)
        }
      }

      setCredentials(credentialDetails)
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const filteredCredentials = credentials.filter(cred => {
    switch (filter) {
      case 'valid':
        return cred.isValid && !cred.isRevoked
      case 'expired':
        return !cred.isValid && !cred.isRevoked && cred.validUntil > 0 && cred.validUntil <= Date.now() / 1000
      case 'revoked':
        return cred.isRevoked
      default:
        return true
    }
  })

  const handleViewDetails = (tokenId: number) => {
    const credential = credentials.find(c => c.tokenId === tokenId)
    if (credential) {
      setSelectedCredential(credential)
    }
  }

  const getFilterCounts = () => {
    return {
      all: credentials.length,
      valid: credentials.filter(c => c.isValid && !c.isRevoked).length,
      expired: credentials.filter(c => !c.isValid && !c.isRevoked && c.validUntil > 0).length,
      revoked: credentials.filter(c => c.isRevoked).length
    }
  }

  const counts = getFilterCounts()

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>My Credentials - AVCP</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-10">
            <EmptyState
              title="Connect Your Wallet"
              description="Please connect your wallet to view your credentials"
            />
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>My Credentials - AVCP</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Credentials</h1>
              <p className="text-gray-600">Manage and view your verifiable credentials</p>
            </div>
            <button
              onClick={loadCredentials}
              className="btn-outline"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'valid', label: 'Valid', count: counts.valid },
                { key: 'expired', label: 'Expired', count: counts.expired },
                { key: 'revoked', label: 'Revoked', count: counts.revoked }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-avalanche-red text-avalanche-red'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {loading && <LoadingState message="Loading your credentials..." />}

          {error && (
            <ErrorState
              title="Failed to Load Credentials"
              description={error}
              onRetry={loadCredentials}
            />
          )}

          {!loading && !error && filteredCredentials.length === 0 && (
            <EmptyState
              title={filter === 'all' ? 'No Credentials Found' : `No ${filter} Credentials`}
              description={
                filter === 'all' 
                  ? 'You don\'t have any credentials yet. Ask an issuer to create one for you.'
                  : `You don't have any ${filter} credentials.`
              }
            />
          )}

          {!loading && !error && filteredCredentials.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCredentials.map(credential => (
                <CredentialCard
                  key={credential.tokenId}
                  tokenId={credential.tokenId}
                  credentialType={credential.credentialType}
                  subject={credential.subject}
                  recipientName={credential.recipientName}
                  issuerName={credential.issuerName}
                  issuedAt={credential.issuedAt}
                  isValid={credential.isValid}
                  isRevoked={credential.isRevoked}
                  onView={handleViewDetails}
                />
              ))}
            </div>
          )}
        </main>

        {/* Credential Details Modal */}
        {selectedCredential && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Credential Details</h2>
                <button
                  onClick={() => setSelectedCredential(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Token ID</label>
                    <p className="text-gray-900">#{selectedCredential.tokenId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCredential.isRevoked ? 'bg-red-100 text-red-800' :
                      selectedCredential.isValid ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedCredential.isRevoked ? 'Revoked' : selectedCredential.isValid ? 'Valid' : 'Expired'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">{selectedCredential.credentialType}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900">{selectedCredential.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Issued By</label>
                  <p className="text-gray-900">{selectedCredential.issuerName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Issued Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedCredential.issuedAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedCredential.validUntil > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valid Until</label>
                      <p className="text-gray-900">
                        {new Date(selectedCredential.validUntil * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedCredential.additionalData && selectedCredential.additionalData !== '{}' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Information</label>
                    <div className="bg-gray-50 p-4 rounded-lg mt-1">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(selectedCredential.additionalData), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setSelectedCredential(null)}
                  className="btn-outline flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`/verify?tokenId=${selectedCredential.tokenId}`, '_blank')}
                  className="btn-primary flex-1"
                >
                  Public Verification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CredentialsPage
