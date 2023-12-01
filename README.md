# Gold-Backed Stablecoin Project

## Overview

Welcome to the Gold-Backed Stablecoin Project, where we introduce a unique stablecoin backed by real, physical gold. Our approach involves creating a gold token that directly represents ownership of physical gold. Subsequently, these gold tokens are utilized to back our stablecoin, providing a robust and tangible foundation for the stability of the digital currency.

## Table of Contents

- [Introduction](#gold-backed-stablecoin-project)
- [How It Works](#how-it-works)
- [Features](#features)
- [Usage](#usage)
- [Installation](#installation)
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
2. Install dependencies: `yarn install`
3. Compile the smart contracts: `yarn hardhat compile`
4. To run the test: `yarn hardhat test`
3. Deploy the smart contracts: 

    3.a. Create your own .env file for using your own private key and infura api
    - `yarn hardhat run ./script/deployCoinGold.ts --network sepolia`
    
    3.b. on .env, the deployed CoinGold address should be updated.
    - `yarn hardhat run ./script/deployCoinDollar.ts --network sepolia`

    

4. Interact with the stablecoin through your preferred wallet or application.
