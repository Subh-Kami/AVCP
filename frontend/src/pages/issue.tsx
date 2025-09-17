import React, { useState } from 'react'
import Head from 'next/head'
import { Header } from '../components/Header'
import { useWalletStore } from '../store/wallet'
import { ContractService } from '../services/contractService'
import { CREDENTIAL_TYPES, COMMON_SUBJECTS } from '../constants'
import { LoadingSpinner, ErrorState } from '../components/UI'

const IssueCredentialPage: React.FC = () => {
  const { provider, signer, account } = useWalletStore()
  const [form, setForm] = useState({
    recipientAddress: '',
    recipientName: '',
    credentialType: CREDENTIAL_TYPES[0],
    subject: COMMON_SUBJECTS[0],
    validUntil: '',
    additionalData: '',
    tokenURI: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [txHash, setTxHash] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setTxHash('')
    try {
      if (!provider || !signer) throw new Error('Connect your wallet')
      if (!form.recipientAddress || !form.recipientName || !form.credentialType || !form.subject) {
        throw new Error('Fill all required fields')
      }
      const contractService = new ContractService(provider, signer)
      const validUntil = form.validUntil ? Math.floor(new Date(form.validUntil).getTime() / 1000) : 0
      const additionalData = form.additionalData ? JSON.parse(form.additionalData) : {}
      const tx = await contractService.issueCredential(
        form.recipientAddress,
        form.credentialType,
        form.subject,
        form.recipientName,
        validUntil,
        additionalData,
        form.tokenURI
      )
      setSuccess('Credential issued successfully!')
      setTxHash(tx.hash)
    } catch (err: any) {
      setError(err.message || 'Failed to issue credential')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Issue Credential - AVCP</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Issue Credential</h1>
          <form className="card p-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="form-label">Recipient Wallet Address *</label>
              <input type="text" name="recipientAddress" className="form-input" value={form.recipientAddress} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Recipient Name *</label>
              <input type="text" name="recipientName" className="form-input" value={form.recipientName} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label">Credential Type *</label>
              <select name="credentialType" className="form-input" value={form.credentialType} onChange={handleChange} required>
                {CREDENTIAL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Subject *</label>
              <select name="subject" className="form-input" value={form.subject} onChange={handleChange} required>
                {COMMON_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Valid Until (optional)</label>
              <input type="date" name="validUntil" className="form-input" value={form.validUntil} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Additional Data (JSON, optional)</label>
              <textarea name="additionalData" className="form-input" value={form.additionalData} onChange={handleChange} rows={3} placeholder='{"gpa": "4.0"}' />
            </div>
            <div>
              <label className="form-label">Token URI (optional, IPFS or URL)</label>
              <input type="text" name="tokenURI" className="form-input" value={form.tokenURI} onChange={handleChange} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {loading ? 'Issuing...' : 'Issue Credential'}
            </button>
            {error && <ErrorState title="Error" description={error} />}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-green-800">
                {success}
                {txHash && (
                  <div className="mt-2 text-xs text-green-700">Tx Hash: {txHash}</div>
                )}
              </div>
            )}
          </form>
        </main>
      </div>
    </>
  )
}

export default IssueCredentialPage
