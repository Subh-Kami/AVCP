import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Header } from '../components/Header'
import { WalletConnect } from '../components/WalletConnect'

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>AVCP - Avalanche Verifiable Credentials Platform</title>
        <meta name="description" content="Decentralized credential verification on Avalanche blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Verifiable Credentials
              <br />
              <span className="text-red-200">on Avalanche</span>
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
              Issue, manage, and verify educational and professional credentials using blockchain technology. 
              Instant verification, tamper-proof records, and global accessibility.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnect className="w-full sm:w-auto" />
              <Link href="/verify" className="btn-secondary bg-white text-avalanche-red w-full sm:w-auto">
                Verify a Credential
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose AVCP?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built on Avalanche for speed, security, and scalability
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card p-8 text-center">
                <div className="w-16 h-16 bg-avalanche-red rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Instant Verification</h3>
                <p className="text-gray-600">
                  Verify any credential in seconds with cryptographic proof. No phone calls, no paperwork.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card p-8 text-center">
                <div className="w-16 h-16 bg-avalanche-red rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tamper-Proof</h3>
                <p className="text-gray-600">
                  Credentials are stored on the blockchain and cannot be forged or altered once issued.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card p-8 text-center">
                <div className="w-16 h-16 bg-avalanche-red rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
                <p className="text-gray-600">
                  Built on Avalanche with sub-second finality and minimal transaction costs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Use Cases
              </h2>
              <p className="text-xl text-gray-600">
                Perfect for institutions and organizations of all sizes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Universities', desc: 'Digital diplomas and certificates' },
                { title: 'Professional Bodies', desc: 'Licenses and certifications' },
                { title: 'Training Centers', desc: 'Course completion certificates' },
                { title: 'Employers', desc: 'Instant credential verification' }
              ].map((useCase, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-lg hover:border-avalanche-red transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-100">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join the future of credential verification today
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/issue" className="btn-primary">
                Issue Credentials
              </Link>
              <Link href="/verify" className="btn-outline">
                Verify Credentials
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-avalanche-red rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="text-xl font-bold">AVCP</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Avalanche Verifiable Credentials Platform - The future of credential verification
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/verify" className="hover:text-white">Verify</Link></li>
                  <li><Link href="/credentials" className="hover:text-white">My Credentials</Link></li>
                  <li><Link href="/issue" className="hover:text-white">Issue</Link></li>
                  <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="https://docs.avax.network" className="hover:text-white" target="_blank" rel="noopener noreferrer">Avalanche Docs</a></li>
                  <li><a href="https://core.app" className="hover:text-white" target="_blank" rel="noopener noreferrer">Core Wallet</a></li>
                  <li><a href="https://testnet.snowtrace.io" className="hover:text-white" target="_blank" rel="noopener noreferrer">Fuji Explorer</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 AVCP. Built on Avalanche blockchain.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default HomePage
