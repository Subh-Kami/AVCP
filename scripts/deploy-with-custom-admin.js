const { ethers } = require("hardhat");

async function main() {
    console.log("Starting AVCP deployment with custom admin...");
    
    // Replace this with your wallet address
    const customAdminAddress = "YOUR_WALLET_ADDRESS_HERE";
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Setting admin to:", customAdminAddress);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy IssuerRegistry with custom admin
    console.log("\nDeploying IssuerRegistry...");
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const issuerRegistry = await IssuerRegistry.deploy(customAdminAddress); // Use custom admin
    await issuerRegistry.waitForDeployment();
    console.log("IssuerRegistry deployed to:", await issuerRegistry.getAddress());

    // Deploy CredentialNFT with custom admin
    console.log("\nDeploying CredentialNFT...");
    const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
    const credentialNFT = await CredentialNFT.deploy(
        "AVCP Credentials", // name
        "AVCP", // symbol
        await issuerRegistry.getAddress(), // issuer registry address
        customAdminAddress // Use custom admin
    );
    await credentialNFT.waitForDeployment();
    console.log("CredentialNFT deployed to:", await credentialNFT.getAddress());

    // Save deployment info
    const deploymentInfo = {
        network: "localhost",
        chainId: 31337,
        contracts: {
            IssuerRegistry: await issuerRegistry.getAddress(),
            CredentialNFT: await credentialNFT.getAddress()
        },
        admin: customAdminAddress,
        deployedAt: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync(
        './deployments/localhost.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment completed!");
    console.log("Admin address:", customAdminAddress);
    console.log("Deployment info saved to deployments/localhost.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });