import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Header } from '../components/Header'
import { LoadingState, ErrorState, EmptyState, LoadingSpinner } from '../components/UI'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'

interface IssuerInfo {
  address: string
  name: string
  description: string
  website: string
  logoUrl: string
  isActive: boolean
  registeredAt: number
  credentialsIssued: number
}

const AdminPage: React.FC = () => {
  const { provider, signer, account, isConnected } = useWalletStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [issuers, setIssuers] = useState<IssuerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>('')
  
  const [newIssuer, setNewIssuer] = useState({
    address: '',
    name: '',
    description: '',
    website: '',
    logoUrl: ''
  })

  useEffect(() => {
    checkAdminRole()
  }, [isConnected, account])

  useEffect(() => {
    if (isAdmin) {
      loadIssuers()
    }
  }, [isAdmin])

  const checkAdminRole = async () => {
    if (!provider || !signer || !account) {
      setCheckingAdmin(false)
      return
    }

    try {
      const contractService = new ContractService(provider, signer)
      const adminStatus = await contractService.isAdmin(account)
      setIsAdmin(adminStatus)
    } catch (err) {
      console.error('Failed to check admin status:', err)
      setIsAdmin(false)
    } finally {
      setCheckingAdmin(false)
    }
  }

  const loadIssuers = async () => {
    if (!provider || !signer) return

    setLoading(true)
    setError('')

    try {
      const contractService = new ContractService(provider, signer)
      const issuerAddresses = await contractService.getAllIssuers()
      
      const issuerDetails: IssuerInfo[] = []
      for (const address of issuerAddresses) {
        try {
          const issuer = await contractService.getIssuer(address)
          issuerDetails.push({
            address,
            ...issuer
          })
        } catch (err) {
          console.error(`Failed to load issuer ${address}:`, err)
        }
      }

      setIssuers(issuerDetails)
    } catch (err: any) {
      setError(err.message || 'Failed to load issuers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIssuer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider || !signer) return

    setActionLoading('add')
    try {
      const contractService = new ContractService(provider, signer)
      await contractService.registerIssuer(
        newIssuer.address,
        newIssuer.name,
        newIssuer.description,
        newIssuer.website,
        newIssuer.logoUrl
      )
      
      setNewIssuer({ address: '', name: '', description: '', website: '', logoUrl: '' })
      setShowAddForm(false)
      await loadIssuers()
    } catch (err: any) {
      setError(err.message || 'Failed to add issuer')
    } finally {
      setActionLoading('')
    }
  }

  const handleToggleIssuer = async (address: string, isActive: boolean) => {
    if (!provider || !signer) return

    setActionLoading(address)
    try {
      const contractService = new ContractService(provider, signer)
      
      if (isActive) {
        await contractService.deactivateIssuer(address)
      } else {
        await contractService.activateIssuer(address)
      }
      
      await loadIssuers()
    } catch (err: any) {
      setError(err.message || 'Failed to update issuer status')
    } finally {
      setActionLoading('')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (checkingAdmin) {
    return (
      <>
        <Head>
          <title>Admin Panel - AVCP</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-10">
            <LoadingState message="Checking admin permissions..." />
          </main>
        </div>
      </>
    )
  }

  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Admin Panel - AVCP</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-10">
            <EmptyState
              title="Connect Your Wallet"
              description="Please connect your wallet to access the admin panel"
            />
          </main>
        </div>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <Head>
          <title>Admin Panel - AVCP</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-10">
            <ErrorState
              title="Access Denied"
              description="You don't have admin privileges for this platform"
            />
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Panel - AVCP</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage credential issuers and platform settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadIssuers}
                className="btn-outline"
                disabled={loading}
              >
                Refresh
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Issuer
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Issuers</p>
                  <p className="text-2xl font-bold text-gray-900">{issuers.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Issuers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {issuers.filter(i => i.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Credentials</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {issuers.reduce((sum, i) => sum + i.credentialsIssued, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && <LoadingState message="Loading issuers..." />}

          {!loading && !error && issuers.length === 0 && (
            <EmptyState
              title="No Issuers Found"
              description="No credential issuers have been registered yet"
              action={
                <button onClick={() => setShowAddForm(true)} className="btn-primary">
                  Add First Issuer
                </button>
              }
            />
          )}

          {!loading && !error && issuers.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Registered Issuers</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issuer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credentials
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {issuers.map((issuer) => (
                        <tr key={issuer.address}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  {issuer.logoUrl ? (
                                    <img className="h-10 w-10 rounded-full" src={issuer.logoUrl} alt="" />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-700">
                                      {issuer.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{issuer.name}</div>
                                <div className="text-sm text-gray-500">{issuer.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {formatAddress(issuer.address)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              issuer.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {issuer.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issuer.credentialsIssued}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleToggleIssuer(issuer.address, issuer.isActive)}
                              disabled={actionLoading === issuer.address}
                              className={`${
                                issuer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                              } disabled:opacity-50`}
                            >
                              {actionLoading === issuer.address ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                issuer.isActive ? 'Deactivate' : 'Activate'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Add Issuer Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Issuer</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddIssuer} className="space-y-4">
                <div>
                  <label className="form-label">Issuer Wallet Address *</label>
                  <input
                    type="text"
                    value={newIssuer.address}
                    onChange={(e) => setNewIssuer({ ...newIssuer, address: e.target.value })}
                    className="form-input"
                    required
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label className="form-label">Organization Name *</label>
                  <input
                    type="text"
                    value={newIssuer.name}
                    onChange={(e) => setNewIssuer({ ...newIssuer, name: e.target.value })}
                    className="form-input"
                    required
                    placeholder="e.g., MIT"
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={newIssuer.description}
                    onChange={(e) => setNewIssuer({ ...newIssuer, description: e.target.value })}
                    className="form-input"
                    rows={3}
                    placeholder="Brief description of the organization..."
                  />
                </div>

                <div>
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    value={newIssuer.website}
                    onChange={(e) => setNewIssuer({ ...newIssuer, website: e.target.value })}
                    className="form-input"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="form-label">Logo URL</label>
                  <input
                    type="url"
                    value={newIssuer.logoUrl}
                    onChange={(e) => setNewIssuer({ ...newIssuer, logoUrl: e.target.value })}
                    className="form-input"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'add'}
                    className="btn-primary flex-1"
                  >
                    {actionLoading === 'add' ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Issuer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminPage
