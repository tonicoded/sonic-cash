const { ethers } = require("hardhat");

async function main() {
    console.log("🌪️  Deploying SonicTornado to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicTornado
    const SonicTornado = await ethers.getContractFactory("SonicTornado");
    const tornado = await SonicTornado.deploy();
    
    await tornado.waitForDeployment();
    const tornadoAddress = await tornado.getAddress();
    
    console.log("✅ SonicTornado deployed to:", tornadoAddress);
    
    // Log supported denominations
    const denom01 = await tornado.DENOMINATION_01();
    const denom1 = await tornado.DENOMINATION_1();
    const denom10 = await tornado.DENOMINATION_10();
    const denom100 = await tornado.DENOMINATION_100();
    
    console.log("\n📊 Supported Denominations:");
    console.log("- 0.1 S:", ethers.formatEther(denom01));
    console.log("- 1 S:", ethers.formatEther(denom1));
    console.log("- 10 S:", ethers.formatEther(denom10));
    console.log("- 100 S:", ethers.formatEther(denom100));
    
    // Get relayer fee
    const relayerFee = await tornado.relayerFeePercent();
    console.log("\n🔧 Relayer Fee:", (Number(relayerFee) / 100).toString(), "%");
    
    console.log("\n🚀 Contract ready for private transactions!");
    console.log("🔗 Add this to your frontend:", tornadoAddress);
    
    return {
        tornado: tornadoAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });