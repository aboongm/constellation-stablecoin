import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Example parameters for the CoinGold constructor
  const name = "CoinGold";
  const symbol = "CNGD";
  const _dataFeedAddress = "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea";
  // Deploy the CoinGold contract with the specified parameters
  const CoinGold = await ethers.getContractFactory("CoinGold");
  const token = await CoinGold.deploy(name, symbol, _dataFeedAddress);

  // Get the contract address from the deployed contract instance
  const contractAddress = await token.getAddress();
  console.log("Token address:", contractAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
