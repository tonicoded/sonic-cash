const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SonicPrivacyPro to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicPrivacyPro
    const SonicPrivacyPro = await ethers.getContractFactory("SonicPrivacyPro");
    const privacyPro = await SonicPrivacyPro.deploy();
    
    await privacyPro.waitForDeployment();
    const privacyProAddress = await privacyPro.getAddress();
    
    console.log("✅ SonicPrivacyPro deployed to:", privacyProAddress);
    
    // Test the contract
    console.log("\n🧪 Testing contract...");
    
    try {
        const [totalTransfers, totalVolume, contractBalance, privacyFee, totalBatch, totalDelayed] = await privacyPro.getPoolStats();
        
        console.log("📊 Enhanced Contract Stats:");
        console.log("- Total Transfers:", totalTransfers.toString());
        console.log("- Total Volume:", ethers.formatEther(totalVolume), "S");
        console.log("- Contract Balance:", ethers.formatEther(contractBalance), "S");
        console.log("- Privacy Fee:", (Number(privacyFee) / 100).toString(), "%");
        console.log("- Batch Transfers:", totalBatch.toString());
        console.log("- Delayed Transfers:", totalDelayed.toString());
        
        console.log("\n✅ Advanced contract is working!");
        
    } catch (error) {
        console.log("❌ Contract test failed:", error.message);
    }
    
    console.log("\n🎯 NEW FEATURES AVAILABLE:");
    console.log("🔥 Batch Transfers - Send to multiple recipients");
    console.log("⏰ Variable Delays - Enhanced anonymity");
    console.log("📊 Privacy Scoring - Real-time privacy metrics");
    console.log("📈 Advanced Stats - Detailed analytics");
    
    console.log("\n🔗 Contract Address:", privacyProAddress);
    
    return {
        privacyPro: privacyProAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });