const { ethers } = require("hardhat");

async function main() {
    console.log("Starting AVCP deployment...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy IssuerRegistry first
    console.log("\nDeploying IssuerRegistry...");
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const issuerRegistry = await IssuerRegistry.deploy(deployer.address);
    await issuerRegistry.waitForDeployment();
    console.log("IssuerRegistry deployed to:", await issuerRegistry.getAddress());

    // Deploy CredentialNFT
    console.log("\nDeploying CredentialNFT...");
    const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
    const credentialNFT = await CredentialNFT.deploy(
        "AVCP Credentials", // name
        "AVCP", // symbol
        await issuerRegistry.getAddress(), // issuer registry address
        deployer.address // admin address
    );
    await credentialNFT.waitForDeployment();
    console.log("CredentialNFT deployed to:", await credentialNFT.getAddress());

    // Wait for confirmations
    console.log("\nWaiting for confirmations...");
    // No need to wait for deployTransaction in ethers v6

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", await deployer.provider.getNetwork());
    console.log("Deployer:", deployer.address);
    console.log("IssuerRegistry:", await issuerRegistry.getAddress());
    console.log("CredentialNFT:", await credentialNFT.getAddress());

    // Save deployment info
    const deploymentInfo = {
        network: (await deployer.provider.getNetwork()).name,
        chainId: Number((await deployer.provider.getNetwork()).chainId),
        deployer: deployer.address,
        contracts: {
            IssuerRegistry: {
                address: await issuerRegistry.getAddress()
            },
            CredentialNFT: {
                address: await credentialNFT.getAddress()
            }
        },
        timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    const path = require('path');
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nDeployment info saved to:", deploymentFile);

    console.log("\n=== Next Steps ===");
    console.log("1. Update your .env file with the contract addresses:");
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY=${await issuerRegistry.getAddress()}`);
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT=${await credentialNFT.getAddress()}`);
    console.log("\n2. Register some sample issuers using the admin interface");
    console.log("3. Start the frontend application");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
