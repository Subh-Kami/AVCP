import React from 'react'
import { useWalletStore } from '../store/wallet'

interface WalletConnectProps {
  className?: string
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className = '' }) => {
  const {
    isConnected,
    account,
    chainId,
    connectWallet,
    disconnectWallet,
    switchToAvalanche
  } = useWalletStore()

  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isSwitching, setIsSwitching] = React.useState(false)

  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113')
  const isCorrectNetwork = chainId === targetChainId

  const handleConnect = async () => {
    if (isConnected) {
      disconnectWallet()
      return
    }

    try {
      setIsConnecting(true)
      await connectWallet()
    } catch (error: any) {
      console.error('Connection failed:', error)
      if (error.message.includes('MetaMask is not installed')) {
        window.open('https://metamask.io/download/', '_blank')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      setIsSwitching(true)
      await switchToAvalanche()
    } catch (error) {
      console.error('Network switch failed:', error)
    } finally {
      setIsSwitching(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 43113:
        return 'Avalanche Fuji'
      case 43114:
        return 'Avalanche Mainnet'
      case 31337:
        return 'Local Network'
      default:
        return 'Unknown Network'
    }
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`btn-primary ${className} ${isConnecting ? 'wallet-connect-animation' : ''}`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
          Wrong Network ({getNetworkName(chainId || 0)})
        </div>
        <button
          onClick={handleSwitchNetwork}
          disabled={isSwitching}
          className="btn-secondary text-sm"
        >
          {isSwitching ? 'Switching...' : 'Switch to Avalanche'}
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-gray-600">
          {getNetworkName(chainId)}
        </span>
      </div>
      
      <div className="bg-gray-100 px-3 py-2 rounded-lg">
        <span className="text-sm font-mono">
          {formatAddress(account || '')}
        </span>
      </div>
      
      <button
        onClick={handleConnect}
        className="btn-outline text-sm"
      >
        Disconnect
      </button>
    </div>
  )
}
