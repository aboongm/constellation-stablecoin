// require("dotenv").config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

// Go to https://infura.io, sign up, create a new API key
// in its dashboard, and replace "KEY" with it
const INFURA_API_KEY = "8158ae5ca93b4957aeabdcdae087ec69";

// Replace this private key with your Sepolia account private key
// To export your private key from Coinbase Wallet, go to
// Settings > Developer Settings > Show private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const SEPOLIA_PRIVATE_KEY =
// "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"
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
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`, // Mainnet Infura URL
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;


