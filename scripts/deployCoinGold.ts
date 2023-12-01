import { ethers } from 'hardhat';
import fs from 'fs'
import { promisify} from 'util'

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const name = "CoinGold";
  const symbol = "CNGD";
  const _dataFeedAddress = "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea";
  const CoinGold = await ethers.getContractFactory("CoinGold");
  const token = await CoinGold.deploy(name, symbol, _dataFeedAddress);

  const contractAddress = await token.getAddress();
  console.log("CoinGold address:", contractAddress);

  let addresses = [
    `COINGOLD_ADDRESS=${await token.getAddress()}`,
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
