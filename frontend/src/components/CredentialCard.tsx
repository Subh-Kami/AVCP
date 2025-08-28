import React from 'react'

interface CredentialCardProps {
  tokenId: number
  credentialType: string
  subject: string
  recipientName: string
  issuerName: string
  issuedAt: number
  isValid: boolean
  isRevoked: boolean
  onView?: (tokenId: number) => void
  onVerify?: (tokenId: number) => void
  className?: string
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  tokenId,
  credentialType,
  subject,
  recipientName,
  issuerName,
  issuedAt,
  isValid,
  isRevoked,
  onView,
  onVerify,
  className = ''
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = () => {
    if (isRevoked) return 'text-red-600 bg-red-100'
    if (isValid) return 'text-green-600 bg-green-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  const getStatusText = () => {
    if (isRevoked) return 'Revoked'
    if (isValid) return 'Valid'
    return 'Expired'
  }

  return (
    <div className={`credential-card ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {credentialType}
          </h3>
          <p className="text-sm text-gray-600">
            ID: #{tokenId}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Subject</p>
          <p className="text-sm text-gray-900">{subject}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Recipient</p>
          <p className="text-sm text-gray-900">{recipientName}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Issued By</p>
          <p className="text-sm text-gray-900">{issuerName}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Issue Date</p>
          <p className="text-sm text-gray-900">{formatDate(issuedAt)}</p>
        </div>
      </div>

      {/* Actions */}
      {(onView || onVerify) && (
        <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-200">
          {onView && (
            <button
              onClick={() => onView(tokenId)}
              className="btn-outline flex-1 text-sm py-2"
            >
              View Details
            </button>
          )}
          {onVerify && (
            <button
              onClick={() => onVerify(tokenId)}
              className="btn-primary flex-1 text-sm py-2"
            >
              Verify
            </button>
          )}
        </div>
      )}
    </div>
  )
}
