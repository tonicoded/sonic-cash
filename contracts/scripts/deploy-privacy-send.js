const { ethers } = require("hardhat");

async function main() {
    console.log("🔒 Deploying SonicPrivacySend to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicPrivacySend
    const SonicPrivacySend = await ethers.getContractFactory("SonicPrivacySend");
    const privacySend = await SonicPrivacySend.deploy();
    
    await privacySend.waitForDeployment();
    const privacySendAddress = await privacySend.getAddress();
    
    console.log("✅ SonicPrivacySend deployed to:", privacySendAddress);
    
    // Get initial stats
    const [totalTransfers, totalVolume, contractBalance, privacyFee] = await privacySend.getPoolStats();
    
    console.log("\n📊 Privacy Pool Stats:");
    console.log("- Total Transfers:", totalTransfers.toString());
    console.log("- Total Volume:", ethers.formatEther(totalVolume), "S");
    console.log("- Contract Balance:", ethers.formatEther(contractBalance), "S");
    console.log("- Privacy Fee:", (Number(privacyFee) / 100).toString(), "%");
    
    console.log("\n🚀 Simple anonymous sending ready!");
    console.log("🔗 Add this to your frontend:", privacySendAddress);
    
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