import { ethers } from 'ethers';
import log from "./logger.js";

// Configuration
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const contractAddress = '0x47129e886b44B5b8815e6471FCD7b31515d83242';
const explorer = 'https://sepolia.basescan.org/tx/'
const ApproveAmount = ethers.parseUnits('10000', 'ether');
const depositAmount = ethers.parseUnits('0.01', 'ether');
const minAmount = ethers.parseUnits('0.00001', 'ether');
const tokens = [
    { address: '0x13e5fb0b6534bb22cbc59fae339dbbe0dc906871', name: 'wstETH' },
    { address: '0x1aC493C87a483518642f320Ba5b342c7b78154ED', name: 'bondETH' },
    { address: '0x975f67319f9DA83B403309108d4a8f84031538A6', name: 'levETH' },
];

// ERC20 ABI
const erc20ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function",
        "stateMutability": "nonpayable"
    },
    {
        "constant": true,
        "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function",
        "stateMutability": "view"
    }
];
// Redeem and Deposit ABI
const redeemABI = [
    {
        inputs: [
            { internalType: 'uint8', name: 'tokenType', type: 'uint8' },
            { internalType: 'uint256', name: 'depositAmount', type: 'uint256' },
            { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
        ],
        name: 'redeem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

const createABI = [
    {
        inputs: [
            { internalType: 'uint8', name: 'tokenType', type: 'uint8' },
            { internalType: 'uint256', name: 'depositAmount', type: 'uint256' },
            { internalType: 'uint256', name: 'minAmount', type: 'uint256' },
        ],
        name: 'create',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

// Function to check and approve a token
const approveTokenIfNeeded = async (wallet, tokenAddress, tokenName) => {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
        const allowance = await tokenContract.allowance(wallet.address, contractAddress);

        if (allowance > depositAmount) {
            return;
        }

        const tx = await tokenContract.approve(contractAddress, ApproveAmount);
        await tx.wait();
        log.info(`Approval transaction for ${tokenName} confirmed ${explorer}${tx.hash}`);
    } catch (error) {
        log.error(`Error approving ${tokenName}:`, error);
    }
};

// Updated approveAllTokens function
const approveAllTokens = async (wallet) => {
    for (const token of tokens) {
        await approveTokenIfNeeded(wallet, token.address, token.name);
    }
};

// Deposit and Redeem Functions
const deposit = async (contract, tokenType) => {
    try {
        const tx = await contract.create(tokenType, depositAmount, minAmount);

        await tx.wait();
        log.info(`Deposit transaction confirmed ${explorer}${tx.hash}`);
    } catch (error) {
        log.error('Error in Deposit:', error);
    }
};

const redeem = async (contract, tokenType) => {
    try {
        const tx = await contract.redeem(tokenType, depositAmount, minAmount, {
            gasLimit: '0x493e0',
        });
        await tx.wait();
        log.info(`Redeem transaction confirmed. ${explorer}${tx.hash}`);
    } catch (error) {
        log.error('Error in redeem:', error);
    }
};

// Run Transactions
const runTransactions = async (privateKey, tokenType) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, [...redeemABI, ...createABI], wallet);

    await approveAllTokens(wallet);

    log.info(`Address ${wallet.address} Executing deposit...`);
    await deposit(contract, tokenType);

    log.info(`Address ${wallet.address} Executing redeem...`);
    await redeem(contract, tokenType);
};

export default runTransactions;
