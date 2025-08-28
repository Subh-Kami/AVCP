import React, { useState, useEffect } from 'react'
import { CredentialCard } from './CredentialCard'
import { LoadingState, ErrorState, EmptyState } from './UI'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'

interface IssuerCredentialManagerProps {
  issuerAddress?: string // If provided, shows credentials for this issuer, otherwise shows for connected account
}

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
  additionalData: string
  revocationReason: string
}

export const IssuerCredentialManager: React.FC<IssuerCredentialManagerProps> = ({ 
  issuerAddress 
}) => {
  const { provider, signer, account } = useWalletStore()
  const [credentials, setCredentials] = useState<CredentialWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revoking, setRevoking] = useState<number | null>(null)
  const [showRevokeModal, setShowRevokeModal] = useState<CredentialWithDetails | null>(null)
  const [revocationReason, setRevocationReason] = useState('')

  const targetAddress = issuerAddress || account

  useEffect(() => {
    if (targetAddress) {
      loadCredentials()
    }
  }, [targetAddress])

  const loadCredentials = async () => {
    if (!provider || !signer || !targetAddress) return

    setLoading(true)
    setError('')

    try {
      const contractService = new ContractService(provider, signer)
      const tokenIds = await contractService.getIssuerCredentials(targetAddress)
      
      const credentialDetails: CredentialWithDetails[] = []
      
      for (const tokenId of tokenIds) {
        try {
          const verification = await contractService.verifyCredential(tokenId)
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
            additionalData: verification.credentialData.additionalData,
            revocationReason: verification.credentialData.revocationReason
          })
        } catch (err) {
          console.error(`Failed to load credential ${tokenId}:`, err)
        }
      }

      // Sort by most recent first
      credentialDetails.sort((a, b) => b.issuedAt - a.issuedAt)
      setCredentials(credentialDetails)
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (credential: CredentialWithDetails) => {
    setShowRevokeModal(credential)
  }

  const confirmRevoke = async () => {
    if (!showRevokeModal || !provider || !signer || !revocationReason.trim()) return

    setRevoking(showRevokeModal.tokenId)
    try {
      const contractService = new ContractService(provider, signer)
      await contractService.revokeCredential(showRevokeModal.tokenId, revocationReason.trim())
      
      setShowRevokeModal(null)
      setRevocationReason('')
      await loadCredentials()
    } catch (err: any) {
      setError(err.message || 'Failed to revoke credential')
    } finally {
      setRevoking(null)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return <LoadingState message="Loading issued credentials..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Credentials"
        description={error}
        onRetry={loadCredentials}
      />
    )
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        title="No Credentials Issued"
        description={
          issuerAddress 
            ? "This issuer hasn't issued any credentials yet"
            : "You haven't issued any credentials yet"
        }
      />
    )
  }

  const stats = {
    total: credentials.length,
    active: credentials.filter(c => c.isValid && !c.isRevoked).length,
    revoked: credentials.filter(c => c.isRevoked).length,
    expired: credentials.filter(c => !c.isValid && !c.isRevoked && c.validUntil > 0).length
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Issued</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
          <div className="text-sm text-gray-600">Revoked</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.expired}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button onClick={loadCredentials} className="btn-outline">
          Refresh
        </button>
      </div>

      {/* Credentials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map(credential => (
          <div key={credential.tokenId} className="relative">
            <CredentialCard
              tokenId={credential.tokenId}
              credentialType={credential.credentialType}
              subject={credential.subject}
              recipientName={credential.recipientName}
              issuerName={credential.issuerName}
              issuedAt={credential.issuedAt}
              isValid={credential.isValid}
              isRevoked={credential.isRevoked}
            />
            
            {/* Issuer Actions */}
            {!issuerAddress && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => window.open(`/verify?tokenId=${credential.tokenId}`, '_blank')}
                  className="btn-outline text-xs py-1 px-2 flex-1"
                >
                  View Public
                </button>
                {!credential.isRevoked && (
                  <button
                    onClick={() => handleRevoke(credential)}
                    disabled={revoking === credential.tokenId}
                    className="text-red-600 hover:text-red-800 text-xs py-1 px-2 border border-red-300 rounded hover:bg-red-50 flex-1 disabled:opacity-50"
                  >
                    {revoking === credential.tokenId ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            )}

            {/* Additional Info for Recipients */}
            <div className="mt-2 text-xs text-gray-500">
              <div>Recipient: {formatAddress(credential.recipientAddress)}</div>
              {credential.isRevoked && (
                <div className="text-red-600 mt-1">
                  Revoked: {credential.revocationReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revoke Credential #{showRevokeModal.tokenId}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Type:</strong> {showRevokeModal.credentialType}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> {showRevokeModal.subject}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Recipient:</strong> {showRevokeModal.recipientName}
              </p>
            </div>

            <div className="mb-4">
              <label className="form-label">Reason for Revocation *</label>
              <textarea
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Please provide a reason for revoking this credential..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRevokeModal(null)
                  setRevocationReason('')
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                disabled={!revocationReason.trim() || revoking === showRevokeModal.tokenId}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex-1 disabled:bg-gray-400"
              >
                {revoking === showRevokeModal.tokenId ? 'Revoking...' : 'Revoke Credential'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
