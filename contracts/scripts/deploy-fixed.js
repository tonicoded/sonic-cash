const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Deploying SonicPrivacySendFixed to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicPrivacySendFixed
    const SonicPrivacySendFixed = await ethers.getContractFactory("SonicPrivacySendFixed");
    const privacySend = await SonicPrivacySendFixed.deploy();
    
    await privacySend.waitForDeployment();
    const privacySendAddress = await privacySend.getAddress();
    
    console.log("✅ SonicPrivacySendFixed deployed to:", privacySendAddress);
    
    // Test the contract
    console.log("\n🧪 Testing contract...");
    
    try {
        const [totalTransfers, totalVolume, contractBalance, privacyFee] = await privacySend.getPoolStats();
        
        console.log("📊 Contract Stats:");
        console.log("- Total Transfers:", totalTransfers.toString());
        console.log("- Total Volume:", ethers.formatEther(totalVolume), "S");
        console.log("- Contract Balance:", ethers.formatEther(contractBalance), "S");
        console.log("- Privacy Fee:", (Number(privacyFee) / 100).toString(), "%");
        
        console.log("\n✅ Contract is working properly!");
        
    } catch (error) {
        console.log("❌ Contract test failed:", error.message);
    }
    
    console.log("\n🚀 Ready for anonymous transfers!");
    console.log("🔗 Contract Address:", privacySendAddress);
    
    return {
        privacySend: privacySendAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });