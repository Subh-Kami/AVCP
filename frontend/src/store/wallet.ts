import { create } from 'zustand'
import { ethers } from 'ethers'

interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToAvalanche: () => Promise<void>
}

const SUPPORTED_NETWORKS = {
  31337: {
    chainId: '0x7a69',
    chainName: 'Hardhat Local',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: ['http://localhost:8545'],
  },
  43113: {
    chainId: '0xa869',
    chainName: 'Avalanche Fuji Testnet',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io/'],
  },
  43114: {
    chainId: '0xa86a',
    chainName: 'Avalanche Network',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io/'],
  },
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  account: null,
  chainId: null,
  provider: null,
  signer: null,

  connectWallet: async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      const signer = await provider.getSigner()
      const account = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      set({
        isConnected: true,
        account,
        chainId,
        provider,
        signer,
      })

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          get().disconnectWallet()
        } else {
          set({ account: accounts[0] })
        }
      })

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        set({ chainId: parseInt(chainId, 16) })
      })

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      account: null,
      chainId: null,
      provider: null,
      signer: null,
    })
  },

  switchToAvalanche: async () => {
    try {
      const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113')
      const networkConfig = SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS]

      if (!networkConfig) {
        throw new Error('Unsupported network')
      }

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        })
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          })
        } else {
          throw switchError
        }
      }
    } catch (error) {
      console.error('Failed to switch to Avalanche network:', error)
      throw error
    }
  },
}))

// Type for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
