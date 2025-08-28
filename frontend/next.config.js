/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['upload.wikimedia.org', 'via.placeholder.com'],
  },
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY,
    NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT,
    NEXT_PUBLIC_RPC_URL_LOCAL: process.env.NEXT_PUBLIC_RPC_URL_LOCAL,
    NEXT_PUBLIC_RPC_URL_FUJI: process.env.NEXT_PUBLIC_RPC_URL_FUJI,
    NEXT_PUBLIC_RPC_URL_MAINNET: process.env.NEXT_PUBLIC_RPC_URL_MAINNET,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  }
}

module.exports = nextConfig
