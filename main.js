import axios from 'axios';
import { readWallets, readProxyFile } from "./utils/script.js";
import banner from "./utils/banner.js";
import log from "./utils/logger.js";
import performTransactions from './utils/transactions.js';
import { mintNft, signMessage } from './contract.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const reffCode = `bfc7b70e-66ad-4524-9bb6-733716c4da94`;
const proxyPath = 'proxy.txt';
const decimal = 1000000000000000000;

const headers = {
    'Content-Type': 'application/json',
    'Referer': 'https://testnet.plaza.finance/',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'x-plaza-api-key': reffCode,
    'x-plaza-vercel-server': 'undefined',
};

const createAxiosInstance = (proxyUrl = null) => {
    const baseURL = 'https://api.plaza.finance/';

    if (proxyUrl) {
        const agent = new HttpsProxyAgent(proxyUrl);

        return axios.create({
            baseURL,
            headers,
            httpAgent: agent,
            httpsAgent: agent,
        });
    } else {
        return axios.create({
            baseURL,
            headers,
        });
    }
};
const getFaucet = async (address, proxyUrl) => {
    const axiosInstance = createAxiosInstance(proxyUrl);
    try {
        const response = await axiosInstance.post('/faucet/queue', { address });
        log.info(`Faucet Response: Success`);
        return 'success';
    } catch (error) {
        log.error(`Error when claim faucet: ${error.response?.data?.message || error.message}`);
        return null;
    }
};

const fetchUser = async (address, proxyUrl) => {
    const axiosInstance = createAxiosInstance(proxyUrl);
    try {
        const response = await axiosInstance.get(`/user?user=${address}`);
        return response.data;
    } catch (error) {
        log.error(`Error fetching user: ${error.response?.data?.message || error.message}`);
        return null;
    }
};

const claimRequest = async (address, proxyUrl) => {
    const axiosInstance = createAxiosInstance(proxyUrl);
    try {
        const response = await axiosInstance.post(`/referrals/claim`, { address, code: 'JL4590xVLSix' });
        return response.data;
    } catch (error) {
        return null;
    }
};

const fetchUserBalance = async (address, proxyUrl) => {
    const axiosInstance = createAxiosInstance(proxyUrl);
    try {
        const response = await axiosInstance.get(`/user/balances`, {
            params: { networkId: 84532, user: address },
        });
        return response.data;
    } catch (error) {
        log.error(`Error fetching balance: ${error.response?.data?.message || error.message}`);
        return null;
    }
};
const getSign = async (level, user, signature, proxyUrl) => {
    const axiosInstance = createAxiosInstance(proxyUrl);
    try {
        const response = await axiosInstance.post('/gamification/claim-level-rewards', { level, user, signature });
        return response.data.signature;
    } catch (error) {
        log.error(`Error when getting signature: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.message === 'User already claimed the reward') {
            return 'claimed';
        }
        return null;
    }
};

const claimNftReward = async ({
    points,
    nftType,
    requiredPoints,
    wallet,
    proxy,
    claimedState,
}) => {
    const walletKey = wallet.address.toLowerCase();
    if (claimedState[walletKey][`nft${nftType}`]) {
        return;
    }

    if (points < requiredPoints) {
        return;
    }

    log.info(`=== Claiming NFT ${nftType} Rewards for Address: ${wallet.address} ===`);
    const signWallet = await signMessage(wallet.privateKey);
    const signature = await getSign(nftType, wallet.address, signWallet, proxy);

    if (signature && signature !== 'claimed') {
        const mintResult = await mintNft(wallet.privateKey, signature);
        if (mintResult) {
            log.info(`=== NFT ${nftType} Successfully Claimed ===`);
            claimedState[walletKey][`nft${nftType}`] = true;
        } else {
            log.error(`=== Failed to Claim NFT ${nftType} ===`);
        }
    } else if (signature === 'claimed') {
        claimedState[walletKey][`nft${nftType}`] = true;
    }
};

const main = async () => {
    log.warn(banner);
    const wallets = readWallets();
    const proxyList = readProxyFile(proxyPath);
    let index = 0;
    const claimedState = {};

    while (true) {
        for (const wallet of wallets) {
            const walletKey = wallet.address.toLowerCase();
            claimedState[walletKey] = claimedState[walletKey] || { nft1: false, nft3: false, nft5: false };
            const proxy = proxyList.length > 0 ? proxyList[index % proxyList.length] : null;
            log.warn(`Running Using Proxy: ${proxy || 'No Proxy'}`);
            try {
                await claimRequest(wallet.address, proxy);

                const profile = await fetchUser(wallet.address, proxy);
                const level = profile?.level || 0;
                const points = profile?.points || 0;
                log.info(`=== Address: ${wallet.address} | Level: ${level} | Points: ${points} ===`);

                log.info(`=== Checking NFT Rewards ===`);
                await claimNftReward({
                    points,
                    nftType: 1,
                    requiredPoints: 50,
                    wallet,
                    proxy,
                    claimedState,
                });

                await claimNftReward({
                    points,
                    nftType: 3,
                    requiredPoints: 200,
                    wallet,
                    proxy,
                    claimedState,
                });

                await claimNftReward({
                    points,
                    nftType: 5,
                    requiredPoints: 500,
                    wallet,
                    proxy,
                    claimedState,
                });

                if (!claimedState[walletKey].nft1 && !claimedState[walletKey].nft3) {
                    log.info(`=== No NFT Rewards For This Address ===`);
                } else {
                    log.info(`=== NFT Rewards Already Claimed For This Address ===`);
                }

                const balances = await fetchUserBalance(wallet.address, proxy);
                const balance = parseInt(balances[0]?.balanceRaw, 10) / decimal || 0;
                log.info(`=== Address: ${wallet.address} | wstETH Balance : ${balance} ===\n`);

                if (balance > 0.02) {
                    log.info(`Starting Perform Transactions for address: ${wallet.address}`);
                    await performTransactions(wallet.privateKey, 0);
                    await performTransactions(wallet.privateKey, 1);

                    log.info('Cooldowns 10 seconds before continuing...\n');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                } else {
                    log.info(`=== Not Enough wstETH, Trying to Claim Faucet ===`);
                    const faucet = await getFaucet(wallet.address, proxy);
                    await new Promise(resolve => setTimeout(resolve, 15000));

                    if (faucet === 'success') {
                        log.info(`Starting Perform Transactions for address: ${wallet.address}`);
                        await performTransactions(wallet.privateKey, 0);
                        await performTransactions(wallet.privateKey, 1);
                        log.info('Cooldowns 10 seconds before continuing...\n');
                        await new Promise(resolve => setTimeout(resolve, 10000));
                    }
                }
                index++;
            } catch (err) {
                console.error(err);
            }
        }
        log.info('Sleeping for 24 hours...');
        await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
    }
};
// run
main();
