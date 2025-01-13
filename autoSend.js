import { sendFaucet, askQuestion, readWallets } from "./utils/script.js";
import banner from "./utils/banner.js";
import log from "./utils/logger.js";

async function faucet() {
    log.warn(banner);
    log.warn(`=== This Script for Base Mainnet auto send ===`);
    log.warn(`This script will distribute funds (ETH) from your main wallet to multiple wallets in the wallets.json file.`);
    log.warn(`Ensure you have sufficient ETH in your main wallet to cover the transaction fees and the total amount being distributed.`);

    const wallets = readWallets();
    if (wallets.length === 0) {
        log.error(`No wallets found in wallets.json. Please add wallets to proceed.`);
        return;
    }
    log.info(`Loaded ${wallets.length} wallets from the file.`);

    // input on faucet amount
    const faucetAmount = await askQuestion('Enter the amount of ETH to send to each wallet (e.g., 0.0003): ');
    const amount = parseFloat(faucetAmount);
    if (isNaN(amount) || amount <= 0) {
        log.error(`Invalid amount entered. Please provide a valid positive number.`);
        return;
    }
    log.info(`You have chosen to send ${faucetAmount} ETH to each wallet.`);

    // Ask for the private key of the sender wallet
    const pvKey = await askQuestion('Enter the private key of the wallet that has ETH on Base Mainnet:\nThis wallet will be used for the initial transfer: ');
    if (!pvKey) {
        log.error(`No private key provided. Please provide a valid private key to proceed.`);
        return;
    };
    log.info(`Private key provided. Proceeding with the setup.`);

    // Confirm the total ETH being sent
    const totalAmount = amount * wallets.length;
    log.warn(`You are about to send a total of ${totalAmount} ETH to ${wallets.length} wallets.`);
    const isConfirmed = await askQuestion(`Are you sure you want to proceed with this operation? (y/n): `);

    if (isConfirmed.toLowerCase() !== 'y') {
        log.warn(`Operation canceled by the user.`);
        return;
    }

    // Start sending funds
    log.info(`=== Initiating Fund Distribution ===`);
    try {
        // Send funds to the first wallet using the main private key
        log.info(`Sending ${totalAmount} ETH to the first wallet (${wallets[0].address}) from your main wallet.`);
        const sendtoWallet = await sendFaucet(totalAmount.toFixed(6).toString(), wallets[0].address, pvKey);

        if (!sendtoWallet) {
            log.error(`Failed to send funds to the first wallet`);
            return;
        } else {
            log.info(`Successfully sent ${totalAmount} ETH to ${wallets[0].address}.`);
        }

        // Make other transfers from wallet to wallet
        for (let i = 0; i < wallets.length - 1; i++) {
            const senderWallet = wallets[i];
            const receiptWallet = wallets[i + 1];
            const amountToSend = amount * (wallets.length - (i + 1));

            log.info(`=== Transferring ${amountToSend} ETH from wallet ${senderWallet.address} to wallet ${receiptWallet.address} ===`);
            const sendToWallets = await sendFaucet(amountToSend.toFixed(6).toString(), receiptWallet.address, senderWallet.privateKey);
            if (!sendToWallets) {
                log.error(`Failed to send funds to ${receiptWallet.address}`);
                return;
            } else {
                log.info(`Successfully transferred ${amountToSend} ETH to ${receiptWallet.address} from ${senderWallet.address}.`);
            }
        }

        log.info(`=== Fund Distribution Complete ===`);
        log.info(`All wallets have been funded successfully!`);
    } catch (error) {
        log.error(`An error occurred during the operation: ${error.message}`);
    }
}

faucet();
