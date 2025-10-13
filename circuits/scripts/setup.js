const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔧 Setting up PLONK trusted setup for Sonic Privacy Pool...");
    
    const buildDir = path.join(__dirname, "../build");
    const circuitName = "withdrawal";
    
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }
    
    try {
        // Download Powers of Tau file if not exists
        const ptauFile = path.join(buildDir, "pot12_final.ptau");
        if (!fs.existsSync(ptauFile)) {
            console.log("📥 Downloading Powers of Tau file...");
            // For MVP, we'll create a smaller ceremony file
            // In production, use proper ceremony from https://github.com/iden3/snarkjs
            console.log("⚠️  Using development Powers of Tau (NOT FOR PRODUCTION)");
            
            // Generate a simple ptau for development
            await snarkjs.powersOfTau.newAccumulator(curve, 12, ptauFile);
            console.log("✅ Development ptau created");
        }
        
        const r1csFile = path.join(buildDir, `${circuitName}.r1cs`);
        const zkeyFile = path.join(buildDir, `${circuitName}_final.zkey`);
        const vkeyFile = path.join(buildDir, "verification_key.json");
        
        if (!fs.existsSync(r1csFile)) {
            console.log("❌ R1CS file not found. Please run circuit compilation first:");
            console.log("   cd circuits && ./compile.sh");
            return;
        }
        
        // PLONK setup
        console.log("🔐 Running PLONK setup...");
        await snarkjs.plonk.setup(r1csFile, ptauFile, zkeyFile);
        console.log("✅ PLONK setup completed");
        
        // Export verification key
        console.log("🔑 Exporting verification key...");
        const vKey = await snarkjs.zKey.exportVerificationKey(zkeyFile);
        fs.writeFileSync(vkeyFile, JSON.stringify(vKey, null, 2));
        console.log("✅ Verification key exported");
        
        // Generate test proof to verify everything works
        console.log("🧪 Generating test proof...");
        const inputFile = path.join(__dirname, "../test/input.json");
        const wasmFile = path.join(buildDir, `${circuitName}_js/${circuitName}.wasm`);
        const witnessFile = path.join(buildDir, "witness.wtns");
        const proofFile = path.join(buildDir, "proof.json");
        const publicFile = path.join(buildDir, "public.json");
        
        if (!fs.existsSync(inputFile)) {
            console.log("⚠️  Test input file not found, skipping test proof generation");
            return;
        }
        
        // Generate witness
        const input = JSON.parse(fs.readFileSync(inputFile));
        await snarkjs.wtns.calculate(input, wasmFile, witnessFile);
        
        // Generate proof
        const { proof, publicSignals } = await snarkjs.plonk.prove(zkeyFile, witnessFile);
        
        // Save proof and public signals
        fs.writeFileSync(proofFile, JSON.stringify(proof, null, 2));
        fs.writeFileSync(publicFile, JSON.stringify(publicSignals, null, 2));
        
        // Verify proof
        const verified = await snarkjs.plonk.verify(vKey, publicSignals, proof);
        
        if (verified) {
            console.log("✅ Test proof verified successfully!");
        } else {
            console.log("❌ Test proof verification failed");
        }
        
        console.log("\n📦 Setup completed! Generated files:");
        console.log(`  - ${zkeyFile} (proving key)`);
        console.log(`  - ${vkeyFile} (verification key)`);
        console.log(`  - ${proofFile} (test proof)`);
        console.log(`  - ${publicFile} (test public signals)`);
        
        console.log("\n🎯 Next steps:");
        console.log("1. Generate Solidity verifier: npm run circuits:verifier");
        console.log("2. Deploy contracts with new verifier");
        console.log("3. Test end-to-end flow");
        
    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    }
}

// Handle curve import for snarkjs compatibility
let curve;
try {
    curve = await import("ffjavascript").then(mod => mod.getCurveFromName("bn128"));
} catch (e) {
    // Fallback for older versions
    const circomlib = require("circomlib");
    curve = circomlib.bn128;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}