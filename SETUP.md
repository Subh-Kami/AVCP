# AVCP Installation and Setup Guide

## Prerequisites

Before setting up the AVCP project, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Git**
   - Download from [git-scm.com](https://git-scm.com/)

3. **MetaMask or Core Wallet**
   - [MetaMask](https://metamask.io/)
   - [Core Wallet](https://core.app/)

4. **Avalanche CLI** (optional, for local development)
   - Install following [Avalanche docs](https://docs.avax.network/tooling/cli-guides/install-avalanche-cli)

## Installation Steps

### 1. Install Dependencies

Navigate to the project directory and install the main dependencies:

```bash
cd AVCP
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Snowtrace API key for contract verification
SNOWTRACE_API_KEY=your_snowtrace_api_key_here

# Contract addresses (will be set after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY=
NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT=

# Network configuration
NEXT_PUBLIC_RPC_URL_FUJI=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_CHAIN_ID=43113
```

### 3. Compile Smart Contracts

```bash
npm run compile
```

### 4. Run Tests (Optional)

```bash
npm test
```

### 5. Deploy to Avalanche Fuji Testnet

First, make sure you have AVAX tokens in your wallet for Fuji testnet:
- Get testnet AVAX from the [Avalanche Faucet](https://faucet.avax.network/)

Deploy the contracts:

```bash
npm run deploy:fuji
```

After deployment, update your `.env` file with the deployed contract addresses.

### 6. Set Up Sample Data (Optional)

```bash
node scripts/setup-sample-data.js
```

### 7. Start the Frontend

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Local Development with Hardhat

For local development, you can use Hardhat's built-in network:

1. Start a local Hardhat network:

```bash
npm run node:local
```

2. Deploy to local network:

```bash
npm run deploy:local
```

3. Update your environment variables for local development.

## Network Configuration

### Avalanche Fuji Testnet

- **Chain ID**: 43113
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Explorer**: https://testnet.snowtrace.io/
- **Faucet**: https://faucet.avax.network/

### Avalanche Mainnet

- **Chain ID**: 43114
- **RPC URL**: https://api.avax.network/ext/bc/C/rpc
- **Explorer**: https://snowtrace.io/

## Wallet Setup

1. Install MetaMask or Core Wallet
2. Add Avalanche network to your wallet
3. Get testnet AVAX from the faucet
4. Import your account using the private key (for development only)

## Troubleshooting

### Common Issues

1. **"MetaMask is not installed"**
   - Install MetaMask browser extension
   - Refresh the page

2. **"Wrong network"**
   - Switch to Avalanche Fuji testnet in your wallet
   - Or click the "Switch to Avalanche" button in the app

3. **Contract not deployed**
   - Make sure you've run the deployment script
   - Check that contract addresses are set in `.env`

4. **Transaction failed**
   - Ensure you have enough AVAX for gas fees
   - Check that you're on the correct network

### Getting Help

- Check the [Avalanche documentation](https://docs.avax.network/)
- Review the contract code in the `contracts/` directory
- Look at the test files in `test/` for usage examples

## Project Structure

```
AVCP/
├── contracts/              # Solidity smart contracts
│   ├── IssuerRegistry.sol   # Manages approved credential issuers
│   └── CredentialNFT.sol    # NFT contract for credentials
├── scripts/                # Deployment and utility scripts
├── test/                   # Contract tests
├── frontend/               # React/Next.js frontend
├── deployments/            # Deployment artifacts
└── docs/                   # Additional documentation
```

## Next Steps

1. Register as an admin to add issuers
2. Add institutional issuers through the admin panel
3. Issue test credentials
4. Verify credentials using the verification page
5. Explore the codebase and customize for your needs
