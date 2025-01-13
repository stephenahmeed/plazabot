import fs from 'fs';
import readline from 'readline';
import log from './logger.js';
import { ethers } from 'ethers';

export async function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
export function readProxyFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const proxyArray = data.split('\n').map(line => line.trim()).filter(line => line);
        if (proxyArray.length === 0) {
            log.warn('No proxies found in the file.');
        }
        return proxyArray;
    } catch (error) {
        log.error('Error reading proxy file:', error);
        return [];
    }
}

// Read wallets from wallets.json
export function readWallets() {
    if (fs.existsSync("wallets.json")) {
        const data = fs.readFileSync("wallets.json");
        return JSON.parse(data);
    } else {
        log.info("No wallets found in wallets.json");
        return [];
    }
}

// Function to send fund to a wallet
export async function sendFaucet(faucetAmount, addressRecipient, pvkey) {
    log.info(`Sending Faucet ${faucetAmount} To Address ${addressRecipient}`);
    try {
        const provider = new ethers.JsonRpcProvider('https://base.llamarpc.com');
        const wallet = new ethers.Wallet(pvkey, provider);
        const feeData = await provider.getFeeData();

        const tx = {
            to: addressRecipient,
            value: ethers.parseEther(faucetAmount),
            gasLimit: 21000,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || feeData.gasPrice,
            maxFeePerGas: feeData.maxFeePerGas || feeData.gasPrice
        };

        const txResponse = await wallet.sendTransaction(tx);
        log.info(`Transaction sent to ${addressRecipient}: https://basescan.org/tx/${txResponse.hash}`);

        await txResponse.wait();
        return txResponse.hash;
    } catch (error) {
        log.error("Error sending faucet:", error);
        return null;
    }
}