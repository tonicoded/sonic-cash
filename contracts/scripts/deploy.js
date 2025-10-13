const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Deploying Sonic Privacy Pool contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "S");
    
    // Deploy Poseidon hasher contracts
    console.log("\n📝 Deploying Poseidon hashers...");
    const PoseidonT3 = await ethers.getContractFactory("PoseidonT3");
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.waitForDeployment();
    const poseidonT3Address = await poseidonT3.getAddress();
    console.log("✅ PoseidonT3 deployed to:", poseidonT3Address);
    
    const PoseidonT4 = await ethers.getContractFactory("PoseidonT4");
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.waitForDeployment();
    const poseidonT4Address = await poseidonT4.getAddress();
    console.log("✅ PoseidonT4 deployed to:", poseidonT4Address);
    
    // Deploy Verifier contract
    console.log("\n🔍 Deploying Verifier...");
    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log("✅ Verifier deployed to:", verifierAddress);
    
    // Deploy PrivacyPool contract
    console.log("\n🏊 Deploying PrivacyPool...");
    const PrivacyPool = await ethers.getContractFactory("PrivacyPool");
    const privacyPool = await PrivacyPool.deploy(verifierAddress);
    await privacyPool.waitForDeployment();
    const privacyPoolAddress = await privacyPool.getAddress();
    console.log("✅ PrivacyPool deployed to:", privacyPoolAddress);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const denomination = await privacyPool.DENOMINATION();
    const treelevels = await privacyPool.TREE_LEVELS();
    const contractVerifierAddress = await privacyPool.verifier();
    
    console.log("📊 Contract configuration:");
    console.log("  - Denomination:", ethers.formatEther(denomination), "S");
    console.log("  - Tree levels:", treelevels.toString());
    console.log("  - Verifier address:", contractVerifierAddress);
    console.log("  - Current root:", await privacyPool.getRoot());
    console.log("  - Deposit count:", await privacyPool.getDepositCount());
    
    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number((await deployer.provider.getNetwork()).chainId),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            PoseidonT3: {
                address: poseidonT3Address,
                txHash: poseidonT3.deploymentTransaction().hash
            },
            PoseidonT4: {
                address: poseidonT4Address,
                txHash: poseidonT4.deploymentTransaction().hash
            },
            Verifier: {
                address: verifierAddress,
                txHash: verifier.deploymentTransaction().hash
            },
            PrivacyPool: {
                address: privacyPoolAddress,
                txHash: privacyPool.deploymentTransaction().hash
            }
        }
    };
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    // Generate frontend environment variables
    const envContent = `# Auto-generated deployment configuration
NEXT_PUBLIC_PRIVACY_POOL_ADDRESS=${privacyPoolAddress}
NEXT_PUBLIC_VERIFIER_ADDRESS=${verifierAddress}
NEXT_PUBLIC_POSEIDON_T3_ADDRESS=${poseidonT3Address}
NEXT_PUBLIC_POSEIDON_T4_ADDRESS=${poseidonT4Address}
NEXT_PUBLIC_NETWORK=${hre.network.name}
NEXT_PUBLIC_CHAIN_ID=${(await deployer.provider.getNetwork()).chainId}
`;
    
    const frontendEnvFile = path.join(__dirname, '../../frontend/.env.local');
    fs.writeFileSync(frontendEnvFile, envContent);
    console.log(`✅ Frontend environment variables saved to: ${frontendEnvFile}`);
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Verify contracts on block explorer");
    console.log("2. Update circuit compilation to include new addresses");
    console.log("3. Test deposit/withdraw flow");
    console.log("4. Deploy frontend to Vercel");
    
    // Wait for block confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    await privacyPool.deploymentTransaction().wait(5);
    console.log("✅ Contracts confirmed on blockchain");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });