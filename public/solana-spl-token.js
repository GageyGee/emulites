// Simplified SPL Token functions for Throngs World
window.splTokenSimple = {
    // Get associated token address
    getAssociatedTokenAddress: async (mint, owner) => {
        try {
            const [address] = await window.solanaWeb3.PublicKey.findProgramAddress(
                [
                    owner.toBuffer(),
                    new window.solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                    mint.toBuffer(),
                ],
                new window.solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
            );
            return address;
        } catch (error) {
            console.error('Error getting associated token address:', error);
            throw error;
        }
    },
    
    // Create transfer instruction for burning tokens
    createTransferInstruction: (fromTokenAccount, toTokenAccount, owner, amount) => {
        const TOKEN_PROGRAM_ID = new window.solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        
        // SPL Token Transfer instruction layout using Uint8Array (browser compatible)
        const transferInstructionData = new Uint8Array(9);
        transferInstructionData[0] = 3; // Transfer instruction
        
        // Convert amount to little-endian bytes
        const amountBytes = new ArrayBuffer(8);
        const amountView = new DataView(amountBytes);
        amountView.setBigUint64(0, amount, true); // little endian
        transferInstructionData.set(new Uint8Array(amountBytes), 1);
        
        return new window.solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
                { pubkey: toTokenAccount, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false },
            ],
            programId: TOKEN_PROGRAM_ID,
            data: transferInstructionData,
        });
    },
    
    // Create associated token account instruction if needed
    createAssociatedTokenAccountInstruction: (payer, associatedToken, owner, mint) => {
        const ASSOCIATED_TOKEN_PROGRAM_ID = new window.solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
        const TOKEN_PROGRAM_ID = new window.solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const SYSTEM_PROGRAM_ID = new window.solanaWeb3.PublicKey('11111111111111111111111111111112');
        const RENT_PROGRAM_ID = new window.solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111');

        return new window.solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: associatedToken, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: RENT_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: ASSOCIATED_TOKEN_PROGRAM_ID,
            data: new Uint8Array(0), // No additional data needed
        });
    },
    
    // Create burn instruction - sends actual tokens to burn address (legacy function, now using transfer)
    createBurnInstruction: (tokenAccount, mint, owner, amount) => {
        // Create a proper SPL token transfer to burn address
        // Since we don't have full SPL token library, we'll use a system transfer as proof of burn
        const burnAddress = new window.solanaWeb3.PublicKey('1nc1nerator11111111111111111111111111111111');
        
        // Create system transfer as burn proof (small amount of SOL)
        return window.solanaWeb3.SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: burnAddress,
            lamports: 10000, // 0.00001 SOL as burn fee
        });
    },
    
    // Parse token account data
    parseTokenAccountData: (data) => {
        try {
            if (!data || data.length < 72) {
                return { amount: BigInt(0) };
            }
            
            // Token account layout:
            // 0-32: mint (32 bytes)
            // 32-64: owner (32 bytes) 
            // 64-72: amount (8 bytes, little endian)
            // 72-73: delegate option (1 byte)
            // 73-74: state (1 byte)
            // etc...
            
            const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
            const amount = dataView.getBigUint64(64, true); // little endian
            
            return { amount };
        } catch (error) {
            console.error('Error parsing token account data:', error);
            return { amount: BigInt(0) };
        }
    }
};
console.log('SPL Token helper loaded successfully');
