import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Example parameters for the CoinGold constructor
  const name = "CoinDollar";
  const symbol = "CNDO";
  const _coinGoldAddress = "0xf3d11AA834bD6FA6800d207a063Cc7465191Be0f";
  const _dataFeedAddress = "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea";
  // Deploy the CoinGold contract with the specified parameters
  const CoinDollar = await ethers.getContractFactory("CoinDollar");
  const token = await CoinDollar.deploy(name, symbol, _coinGoldAddress, _dataFeedAddress);

  // Get the contract address from the deployed contract instance
  const contractAddress = await token.getAddress();
  console.log("Token address:", contractAddress);
  // deployed CoinDollar Address: 0xB3CF538702D285E3070660C09f6C830757837E47
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
