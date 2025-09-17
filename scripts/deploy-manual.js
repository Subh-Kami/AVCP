const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Manual AVCP Contract Deployment");
    console.log("=================================");
    
    try {
        // Test connection first
        const [deployer] = await ethers.getSigners();
        const balance = await ethers.provider.getBalance(deployer.address);
        
        console.log(`✅ Connected to network`);
        console.log(`📍 Deployer: ${deployer.address}`);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);
        
        // Deploy IssuerRegistry
        console.log("🚀 Deploying IssuerRegistry...");
        const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
        const issuerRegistry = await IssuerRegistry.deploy(deployer.address);
        await issuerRegistry.waitForDeployment();
        const issuerRegistryAddress = await issuerRegistry.getAddress();
        console.log(`✅ IssuerRegistry: ${issuerRegistryAddress}`);
        
        // Deploy CredentialNFT
        console.log("🚀 Deploying CredentialNFT...");
        const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
        const credentialNFT = await CredentialNFT.deploy(
            "AVCP Credentials",
            "AVCP", 
            issuerRegistryAddress,
            deployer.address
        );
        await credentialNFT.waitForDeployment();
        const credentialNFTAddress = await credentialNFT.getAddress();
        console.log(`✅ CredentialNFT: ${credentialNFTAddress}`);
        
        // Setup initial roles and permissions
        console.log("\n⚙️ Setting up permissions...");
        
        // Grant ADMIN role to deployer on CredentialNFT (already done in constructor)
        const adminRole = await credentialNFT.ADMIN_ROLE();
        console.log(`✅ Admin role configured for: ${deployer.address}`);
        
        // Create deployment summary
        const deploymentInfo = {
            network: "localhost",
            chainId: 31337,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                IssuerRegistry: issuerRegistryAddress,
                CredentialNFT: credentialNFTAddress
            },
            transactions: {
                issuerRegistryDeployTx: issuerRegistry.deploymentTransaction()?.hash,
                credentialNFTDeployTx: credentialNFT.deploymentTransaction()?.hash
            }
        };
        
        // Save deployment info
        const deploymentPath = path.join(__dirname, '..', 'deployments', 'localhost.json');
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log("\n📄 Deployment Summary:");
        console.log("======================");
        console.log(`📅 Deployed: ${deploymentInfo.timestamp}`);
        console.log(`🌐 Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
        console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
        console.log(`📋 IssuerRegistry: ${deploymentInfo.contracts.IssuerRegistry}`);
        console.log(`🎫 CredentialNFT: ${deploymentInfo.contracts.CredentialNFT}`);
        console.log(`💾 Saved to: ${deploymentPath}`);
        
        // Update frontend environment file
        const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
        const envContent = `# AVCP Environment Configuration

# Local Development (Hardhat)
NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY=${issuerRegistryAddress}
NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT=${credentialNFTAddress}

# RPC URLs
NEXT_PUBLIC_RPC_URL_LOCAL=http://127.0.0.1:8545
NEXT_PUBLIC_RPC_URL_FUJI=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_RPC_URL_MAINNET=https://api.avax.network/ext/bc/C/rpc

# Network Configuration  
NEXT_PUBLIC_CHAIN_ID=31337

# Default Network Environment
NEXT_PUBLIC_DEFAULT_NETWORK=local
`;
        
        fs.writeFileSync(frontendEnvPath, envContent);
        console.log(`✅ Updated frontend environment: ${frontendEnvPath}`);
        
        console.log("\n🎉 Deployment Complete!");
        console.log("========================");
        console.log("Next steps:");
        console.log("1. Start frontend: cd frontend && npm run dev");
        console.log("2. Open http://localhost:3000");
        console.log("3. Connect wallet with test account");
        console.log("4. Test issuer registration and credential issuance");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
