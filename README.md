# Gold-Backed Stablecoin Project

## Overview

Welcome to the Gold-Backed Stablecoin Project, where we introduce a unique stablecoin backed by real, physical gold. Our approach involves creating a gold token that directly represents ownership of physical gold. Subsequently, these gold tokens are utilized to back our stablecoin, providing a robust and tangible foundation for the stability of the digital currency.

## Table of Contents

- [Introduction](#gold-backed-stablecoin-project)
- [How It Works](#how-it-works)
- [Features](#features)
- [Usage](#usage) / [Installation](#usage)
- [Contributing](#contributing)
- [License](#license)

## How It Works

### 1. Gold Token Creation

We start by creating a unique gold token that is directly backed by physical gold. Each token represents a claim to a portion of real gold stored securely.

### 2. Stablecoin Backing

These gold tokens are then utilized as collateral to back our stablecoin. The stablecoin's value is pegged to the value of the underlying gold, providing a stable and reliable digital currency.

### 3. Dynamic Backing Ratio

To account for variations in the price of gold, our stablecoin maintains a dynamic backing ratio. The backing can range from 100% to 50%, depending on the fluctuations in the market price of gold. This adaptive approach ensures the stability of the stablecoin in various market conditions.

## Features

- **Gold-Backed Stability:** Benefit from the stability of physical gold, providing a reliable foundation for the stablecoin.
  
- **Dynamic Backing Ratio:** The stablecoin adjusts its backing ratio based on the market price of gold, ensuring adaptability to changing market conditions.

- **Transparency:** All transactions and gold holdings are transparently recorded on the blockchain for public verification.

- **Decentralized Security:** Built on a decentralized blockchain for enhanced security and trustless operation.

## Usage

To start using our Gold-Backed Stablecoin, follow these simple steps:

1. Clone the repository: `git clone https://github.com/aboongm/constellation-stablecoin.git`
2. `cd constellation-stablecoin`
3. Install dependencies: `yarn install`
4. Compile the smart contracts: `yarn hardhat compile`
5. To run the test: `yarn hardhat test`
6. Deploy the smart contracts: 

    6.a. Create your own .env file for using your own private key and infura api
    - `yarn hardhat run ./script/deployCoinGold.ts --network sepolia`
    
    6.b. on .env, the deployed CoinGold address should be updated.
    - `yarn hardhat run ./script/deployCoinDollar.ts --network sepolia`

7. Implement Chainlink Automation:

    7.a. Go to this website `https://automation.chain.link` 

    7.b. Connect to your `metamask wallet`

    7.c. Select `Sepolia network`

    7.d. Click `Register new Upkeep`

    7.e. Select `custom logic` and click `next`

    7.f. Get your CoinDollar address from .env and paste it on `Target contract address` input field

    7.g. Fill the `Upkeep name` input field with your chosen name

    7.h. Deposit LINK to your Upkeep. Select an amount that will satisfy multiple performances to start.(5 LINKs or more)

    7.i. Click that `Register Upkeep` button and confirm the transaction.Wait until your transaction has been confirmed on-chain.
    
    7.j. Click `View Upkeep`

8. To interact with the react frontend 

   (NOTE: generate abis and contract addresses from previous steps before starting the react frontend)

    8.a. cd `ui-web`

    8.b. `yarn` to add the dependencies

    8.c. Create `.env` file in ui-web folder, and copy the token addresses from `.env` in hardhat root. Prefix the variable names with `VITE_` 

    8.d. `yarn run dev` to start the ui.

    8.e. Go to a browser and open `http://localhost:5173/`

    8.f. You should be seeing the details of CoinGold and CoinDollar.

    8.g. To test `Transfer` functionality, use your signer private key with the token balances to sign in to your metamask wallet.

    8.h. Then transfer some token to any wallet address.
