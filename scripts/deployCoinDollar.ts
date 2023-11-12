import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Example parameters for the CoinGold constructor
  const name = "CoinDollar";
  const symbol = "CNDO";
  const coinGoldAddress = "0xc001b21Ee181614Bb167120a63f17D3A37d755a8";
  const _dataFeedAddress = "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea";
  // Deploy the CoinGold contract with the specified parameters
  const CoinDollar = await ethers.getContractFactory("CoinDollar");
  const token = await CoinDollar.deploy(name, symbol, coinGoldAddress, _dataFeedAddress);

  // Get the contract address from the deployed contract instance
  const contractAddress = await token.getAddress();
  console.log("Token address:", contractAddress);
  // deployed CoinDollar Address: 0x1aC143a58e143EF29D119a4e0c1cA147aea4E15f
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
