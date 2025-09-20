const { ethers } = require("hardhat");

async function main() {
    console.log("Checking contract deployment and admin status...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    // Get the deployed contract address
    const issuerRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    try {
        // Check if contract is deployed
        const code = await ethers.provider.getCode(issuerRegistryAddress);
        if (code === "0x") {
            console.log("❌ Contract not deployed at", issuerRegistryAddress);
            console.log("You may need to redeploy the contracts first.");
            return;
        }
        console.log("✅ Contract found at", issuerRegistryAddress);
        
        // Get the contract
        const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
        const issuerRegistry = IssuerRegistry.attach(issuerRegistryAddress);
        
        // Check admin role
        const adminRole = await issuerRegistry.ADMIN_ROLE();
        console.log("Admin role hash:", adminRole);
        
        // Check if current signer has admin role
        const hasAdminRole = await issuerRegistry.hasRole(adminRole, signer.address);
        console.log("Current account has admin role:", hasAdminRole);
        
        // Check if the hardhat default account has admin role
        const defaultHardhatAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const defaultHasAdminRole = await issuerRegistry.hasRole(adminRole, defaultHardhatAccount);
        console.log("Default Hardhat account has admin role:", defaultHasAdminRole);
        
        if (!hasAdminRole && !defaultHasAdminRole) {
            console.log("❌ No account has admin role. Contract may need to be redeployed.");
        }
        
    } catch (error) {
        console.error("❌ Error checking contract:", error.message);
        console.log("\nTry redeploying the contracts with:");
        console.log("npx hardhat run scripts/deploy.js --network localhost");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });