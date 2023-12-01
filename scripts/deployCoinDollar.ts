import { ethers } from 'hardhat';
import fs from 'fs'
import { promisify} from 'util'
import dotenv from "dotenv"
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const name = "CoinDollar";
  const symbol = "CNDO";
  const _coinGoldAddress = process.env.COINGOLD_ADDRESS || "0x712D272A886dCa26D712C274E4b32179e80F5B54";
  const _dataFeedAddress = "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea";
  
  const CoinDollar = await ethers.getContractFactory("CoinDollar");
  const token = await CoinDollar.deploy(name, symbol, _coinGoldAddress, _dataFeedAddress);

  const contractAddress = await token.getAddress();
  console.log("CoinDollar address:", contractAddress);

  let addresses = [
    `COINDOLLAR_ADDRESS=${await token.getAddress()}`,
  ]
  const data = '\n' + addresses.join('\n')

  const writeFile = promisify(fs.appendFile);
  const filePath = '.env';
  return writeFile(filePath, data)
      .then(() => {
        console.log('Addresses recorded.');
      })
      .catch((error) => {
        console.error('Error logging addresses:', error);
        throw error;
      });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
