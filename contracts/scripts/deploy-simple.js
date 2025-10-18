const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SonicCashSimple to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicCashSimple
    const SonicCashSimple = await ethers.getContractFactory("SonicCashSimple");
    const sonicCash = await SonicCashSimple.deploy();
    
    await sonicCash.waitForDeployment();
    const sonicCashAddress = await sonicCash.getAddress();
    
    console.log("✅ SonicCashSimple deployed to:", sonicCashAddress);
    
    // Test the contract
    console.log("\n🧪 Testing contract...");
    
    try {
        const [totalTransfers, totalVolume, contractBalance, privacyFee] = await sonicCash.getPoolStats();
        
        console.log("📊 Simple Contract Stats:");
        console.log("- Total Transfers:", totalTransfers.toString());
        console.log("- Total Volume:", ethers.formatEther(totalVolume), "S");
        console.log("- Contract Balance:", ethers.formatEther(contractBalance), "S");
        console.log("- Privacy Fee:", (Number(privacyFee) / 100).toString(), "%");
        
        console.log("\n✅ Simple contract is working!");
        
    } catch (error) {
        console.log("❌ Contract test failed:", error.message);
    }
    
    console.log("\n🎯 SIMPLE FEATURES:");
    console.log("💰 Send funds + recipient address in transaction data");
    console.log("⚡ Instant processing - no waiting");
    console.log("🔒 Privacy through contract mixing");
    console.log("📱 Works with any wallet");
    
    console.log("\n🔗 Simple Contract Address:", sonicCashAddress);
    
    return {
        sonicCash: sonicCashAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });