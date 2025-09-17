const { ethers } = require("hardhat");

async function main() {
    console.log("Setting up sample data for AVCP...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Get deployed contract addresses from latest deployment
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    const deploymentFiles = fs.readdirSync(deploymentsDir)
        .filter(file => file.startsWith('deployment-'))
        .sort()
        .reverse();

    if (deploymentFiles.length === 0) {
        console.error("No deployment files found. Please deploy contracts first.");
        process.exit(1);
    }

    const latestDeployment = JSON.parse(
        fs.readFileSync(path.join(deploymentsDir, deploymentFiles[0]))
    );

    console.log("Using deployment:", deploymentFiles[0]);
    
    const issuerRegistryAddress = latestDeployment.contracts.IssuerRegistry.address;
    const credentialNFTAddress = latestDeployment.contracts.CredentialNFT.address;

    // Get contract instances
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const issuerRegistry = IssuerRegistry.attach(issuerRegistryAddress);

    console.log("\nRegistering sample issuers...");

    // Sample issuers data
    const sampleIssuers = [
        {
            address: "0x1234567890123456789012345678901234567890", // Replace with actual addresses
            name: "MIT - Massachusetts Institute of Technology",
            description: "Leading research university specializing in technology and science",
            website: "https://mit.edu",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg"
        },
        {
            address: "0x2345678901234567890123456789012345678901", // Replace with actual addresses
            name: "Stanford University",
            description: "Private research university in California",
            website: "https://stanford.edu",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Stanford_University.svg"
        },
        {
            address: "0x3456789012345678901234567890123456789012", // Replace with actual addresses
            name: "Google Cloud Certification",
            description: "Professional cloud computing certifications",
            website: "https://cloud.google.com/certification",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg"
        }
    ];

    for (const issuer of sampleIssuers) {
        try {
            const tx = await issuerRegistry.registerIssuer(
                issuer.address,
                issuer.name,
                issuer.description,
                issuer.website,
                issuer.logoUrl
            );
            await tx.wait();
            console.log(`✅ Registered: ${issuer.name}`);
        } catch (error) {
            console.log(`❌ Failed to register ${issuer.name}:`, error.message);
        }
    }

    console.log("\n=== Sample Data Setup Complete ===");
    console.log("Registered issuers can now mint credentials");
    console.log("Use the frontend application to interact with the platform");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
