import React from 'react'
import Link from 'next/link'
import { WalletConnect } from './WalletConnect'

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-avalanche-red rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AVCP</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-avalanche-red font-medium">
                Home
              </Link>
              <Link href="/verify" className="text-gray-700 hover:text-avalanche-red font-medium">
                Verify
              </Link>
              <Link href="/credentials" className="text-gray-700 hover:text-avalanche-red font-medium">
                My Credentials
              </Link>
              <Link href="/issue" className="text-gray-700 hover:text-avalanche-red font-medium">
                Issue Credential
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-avalanche-red font-medium">
                Admin
              </Link>
            </nav>
          </div>

          {/* Wallet Connection */}
          <WalletConnect />
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-4">
          <div className="flex space-x-4 overflow-x-auto">
            <Link href="/" className="text-gray-700 hover:text-avalanche-red font-medium whitespace-nowrap">
              Home
            </Link>
            <Link href="/verify" className="text-gray-700 hover:text-avalanche-red font-medium whitespace-nowrap">
              Verify
            </Link>
            <Link href="/credentials" className="text-gray-700 hover:text-avalanche-red font-medium whitespace-nowrap">
              My Credentials
            </Link>
            <Link href="/issue" className="text-gray-700 hover:text-avalanche-red font-medium whitespace-nowrap">
              Issue
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-avalanche-red font-medium whitespace-nowrap">
              Admin
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
