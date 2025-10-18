const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying SonicPrivacyProV2 to Sonic Testnet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy SonicPrivacyProV2
    const SonicPrivacyProV2 = await ethers.getContractFactory("SonicPrivacyProV2");
    const privacyProV2 = await SonicPrivacyProV2.deploy();
    
    await privacyProV2.waitForDeployment();
    const privacyProV2Address = await privacyProV2.getAddress();
    
    console.log("✅ SonicPrivacyProV2 deployed to:", privacyProV2Address);
    
    // Test the contract
    console.log("\n🧪 Testing contract...");
    
    try {
        const [totalTransfers, totalVolume, contractBalance, privacyFee, totalPaymentRequests, totalFees] = await privacyProV2.getPoolStats();
        
        console.log("📊 V2 Contract Stats:");
        console.log("- Total Transfers:", totalTransfers.toString());
        console.log("- Total Volume:", ethers.formatEther(totalVolume), "S");
        console.log("- Contract Balance:", ethers.formatEther(contractBalance), "S");
        console.log("- Privacy Fee:", (Number(privacyFee) / 100).toString(), "%");
        console.log("- Payment Requests:", totalPaymentRequests.toString());
        console.log("- Total Fees:", ethers.formatEther(totalFees), "S");
        
        // Test creating a payment request
        console.log("\n🧪 Testing payment request creation...");
        const testRecipient = "0x742d35Cc6634C0532925a3b8D1f0Aa063DB1aac0"; // Random test address
        const testAmount = ethers.parseEther("1.0");
        
        const tx = await privacyProV2.createPaymentRequest(testRecipient, testAmount);
        const receipt = await tx.wait();
        
        console.log("✅ Test payment request created!");
        console.log("- Transaction hash:", receipt.hash);
        
        // Get the event to see the deposit address
        const event = receipt.logs.find(log => {
            try {
                const decoded = privacyProV2.interface.parseLog(log);
                return decoded.name === 'PaymentRequestCreated';
            } catch {
                return false;
            }
        });
        
        if (event) {
            const decoded = privacyProV2.interface.parseLog(event);
            console.log("- Request ID:", decoded.args.requestId);
            console.log("- Unique Deposit Address:", decoded.args.depositAddress);
            console.log("- Recipient:", decoded.args.recipient);
            console.log("- Amount:", ethers.formatEther(decoded.args.amount), "S");
        }
        
        console.log("\n✅ V2 contract is working perfectly!");
        
    } catch (error) {
        console.log("❌ Contract test failed:", error.message);
    }
    
    console.log("\n🎯 NEW V2 FEATURES:");
    console.log("🔐 Unique Deposit Addresses - Each payment gets its own address");
    console.log("🛡️ Enhanced Privacy - No transaction data needed");
    console.log("⚡ Auto-Detection - Payments processed automatically");
    console.log("📊 Better Tracking - Full payment request lifecycle");
    
    console.log("\n🔗 V2 Contract Address:", privacyProV2Address);
    
    return {
        privacyProV2: privacyProV2Address
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });