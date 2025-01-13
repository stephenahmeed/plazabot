## PLAZA FINANCE BOT

Plaza is a platform for on-chain bonds and leverage on Base.

Plaza is a platform for programmable derivatives built as a set of Solidity smart contracts on Base. It offers two core products: bondETH and levETH, which are programmable derivatives of a pool of ETH liquid staking derivatives (LSTs) and liquid restaking derivatives (LRTs) such as wstETH. Users can deposit an underlying pool asset like wstETH and receive levETH or bondETH in return, which are represented as ERC20 tokens. These tokens are composable with protocols such as DEXes, lending markets, restaking platforms, etc.

![banner](image/image.png)

- Website [https://testnet.plaza.finance/](https://testnet.plaza.finance/rewards/k41VvSZQ9ErS)
- Twitter [@plaza_finance](https://x.com/plaza_finance)

## Update 
- for now we need to manually claim eth base sepolia testnet
- claim faucet eth here https://www.alchemy.com/faucets/base-sepolia
- bridge : https://testnets.superbridge.app/base-sepolia
- distribute eth base sepolia to all wallets in wallets.json
- ```bash
   npm run faucet
   ```
- thats it now you can rerun bot again, `npm run start`

- must reinstall dependencies after `git pull` : `npm install` 
- auto send now being sent from wallet to wallet, not from main wallet to all wallets.

## Features

- **Auto Daily Transaction**
- **Auto Get Faucets**
- **Auto Generate New Wallets**
- **Send Fund To Existing Address**
- **All Wallets information Saved In wallets.json** 


## Requirements

- **Node.js**: Ensure you have Node.js installed.
- **npm**: Ensure you have npm installed.
- **Wallets must have $1 in eth/base/arb mainnet to get faucet**
- **Use feature auto send to send fund to existing wallet:** send `0.0003` eth for each addr

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/stephenahmeed/plazabot.git
   cd plazabot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup: to create new wallets
   ```bash
   npm run create
   ```

4. Additional Feature: 

- send fund to existing address

    ```bash
    npm run autosend
    ```
- use proxy: its optional, paste proxy in the proxy.txt file. 1 proxy per line.
    ```bash
    nano proxy.txt
    ```
    format : `http://user:password@ip:port`

5. Run The Script:
   ```bash
   npm run start
   ```

## Join My Airdrop Channel For Upcoming Update: https://t.me/sabbirofficialairdrop
