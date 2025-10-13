// ZK Proof generation for Sonic Privacy Pool

class ZKProofGenerator {
    constructor() {
        this.wasmBuffer = null;
        this.zkey = null;
        this.isInitialized = false;
    }

    // Initialize the proof generator by loading WASM and proving key
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Loading WASM and proving key...');
            
            // Load the WASM file
            const wasmResponse = await fetch('./circuits/test_circuit.wasm');
            this.wasmBuffer = await wasmResponse.arrayBuffer();
            
            // Load the proving key
            const zkeyResponse = await fetch('./circuits/test_circuit_final.zkey');
            this.zkey = await zkeyResponse.arrayBuffer();
            
            this.isInitialized = true;
            console.log('ZK proof generator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ZK proof generator:', error);
            throw new Error('Could not load ZK proving files. Make sure WASM and zkey files are available.');
        }
    }

    // Generate a withdrawal proof
    async generateWithdrawProof(secret, nullifier, recipientAddress) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('Generating withdrawal proof...');
            
            // Convert inputs to proper format
            const input = {
                secret: secret.toString(),
                nullifier: nullifier.toString(),
                recipient: this.addressToFieldElement(recipientAddress)
            };

            console.log('Proof inputs:', input);

            // Generate witness and proof
            const { proof, publicSignals } = await window.snarkjs.groth16.fullProve(
                input,
                this.wasmBuffer,
                this.zkey
            );

            console.log('Proof generated successfully');
            console.log('Proof:', proof);
            console.log('Public signals:', publicSignals);

            return {
                proof: this.formatProofForContract(proof),
                publicSignals: publicSignals
            };

        } catch (error) {
            console.error('Proof generation failed:', error);
            throw new Error('Failed to generate ZK proof: ' + error.message);
        }
    }

    // Convert Ethereum address to field element (simplified)
    addressToFieldElement(address) {
        // Remove 0x prefix and convert to bigint
        const addressBigInt = BigInt(address);
        return addressBigInt.toString();
    }

    // Format proof for smart contract call
    formatProofForContract(proof) {
        return {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
            c: [proof.pi_c[0], proof.pi_c[1]]
        };
    }

    // Parse note format: sonic-0x[secret]-0x[nullifier]
    parseNote(note) {
        try {
            if (!note.startsWith('sonic-')) {
                throw new Error('Invalid note format');
            }

            // Remove sonic- prefix
            const withoutPrefix = note.substring(6);
            
            // Split by - to get secret and nullifier
            const parts = withoutPrefix.split('-');
            if (parts.length !== 2) {
                throw new Error('Invalid note format: expected secret-nullifier');
            }

            const secret = parts[0].startsWith('0x') ? parts[0].substring(2) : parts[0];
            const nullifier = parts[1].startsWith('0x') ? parts[1].substring(2) : parts[1];

            return {
                secret: BigInt('0x' + secret).toString(),
                nullifier: BigInt('0x' + nullifier).toString()
            };
        } catch (error) {
            throw new Error('Invalid note format. Expected: sonic-0x[secret]-0x[nullifier]');
        }
    }
}

// Export for use in HTML
window.ZKProofGenerator = ZKProofGenerator;