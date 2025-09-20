const { ethers } = require("hardhat");

async function main() {
    // Get the signers
    const [currentAdmin] = await ethers.getSigners();
    console.log("Current admin address:", currentAdmin.address);
    
    // New admin address (replace with your wallet address)
    const newAdminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace this with your actual wallet address
    
    // Get the deployed contract
    const issuerRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From localhost.json
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const issuerRegistry = IssuerRegistry.attach(issuerRegistryAddress);
    
    console.log("Granting admin role to:", newAdminAddress);
    
    try {
        // Get the admin role
        const adminRole = await issuerRegistry.ADMIN_ROLE();
        
        // Grant admin role to the new address
        const tx = await issuerRegistry.grantRole(adminRole, newAdminAddress);
        await tx.wait();
        
        console.log("✅ Admin role granted successfully!");
        console.log("Transaction hash:", tx.hash);
        
        // Verify the new admin has the role
        const hasRole = await issuerRegistry.hasRole(adminRole, newAdminAddress);
        console.log("New admin role verified:", hasRole);
        
    } catch (error) {
        console.error("❌ Failed to grant admin role:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });