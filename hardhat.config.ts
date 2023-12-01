import dotenv from "dotenv"
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const INFURA_API_KEY = process.env.INFURA_API_KEY || "8158ae5ca93b4957aeabdcdae087ec69";

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY ||
  "69dc40a89741c07cf37dc2a2de9be0a4c5e17f66ff74e8e045372321471492ca";
  

const config: HardhatUserConfig = {
  solidity: {
    compilers: [ {version: "0.8.20"}, {version: "0.8.19"}]
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`, 
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;


