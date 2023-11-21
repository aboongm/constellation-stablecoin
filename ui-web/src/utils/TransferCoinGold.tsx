import { ethers } from "ethers";
import abiCoinGold from "../../abi/abi-CoinGold.json";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

// Contract address and ABI of the token
const tokenAddress = "0x628a290dF6B99a17593168460a269643A0D7BD5F"; // Replace with the actual token contract address
const tokenAbi = abiCoinGold.abi; // Replace with the actual token ABI

// Your wallet's private key and Infura provider
const privateKey = "69dc40a89741c07cf37dc2a2de9be0a4c5e17f66ff74e8e045372321471492ca"; // Replace with your private key
const API_KEY = "8158ae5ca93b4957aeabdcdae087ec69"; // Replace with your Infura API key

// const provider = new ethers.providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`);
const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`)
const wallet = new ethers.Wallet(privateKey, provider);

// The contract instance of the token
const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);
// const balance = await provider.getBalance("0x2A3D579c2Ca96a9D26FCf3c9Bf05Dc09C16cF89f")

export async function TransferCoinGold(recipientAddress: string, amount: string, isConnected: boolean) {
  const amountToSend = ethers.parseUnits(amount, 18);
  try {
    const balance = await tokenContract.balanceOf(wallet.address)
    console.log("balance: ", balance);
    const totalSupply = await tokenContract.totalSupply()
    console.log("totalSupply: ", totalSupply);
    
    // Estimate gas for the transaction
    const estimatedGas = await tokenContract.transfer.estimateGas(recipientAddress, amountToSend)
    
    // Display the gas estimate to the user
    const gasPrice = (await provider.getFeeData()).gasPrice
    const gasValue = ethers.formatEther(gasPrice * estimatedGas);
    
    // // Ask for user confirmation with gas information
    const userConfirmation = window.confirm(`Transaction Details:\nRecipient: ${recipientAddress}\nAmount: ${amount.toString()} COINGOLD\nGas Estimate: ${estimatedGas}\nGas Fee: ${gasValue} ETH\n\nConfirm Transaction?`);

    if (userConfirmation) {
        // console.log(tokenContract.getChainlinkDataFeedLatestAnswer())
      // Send the transaction
      const transaction = await tokenContract.transfer(recipientAddress, amountToSend);
      console.log("Transaction hash:", transaction.hash);
      await transaction.wait();
      alert("Transfer successful!");
    } else {
      console.log("Transaction canceled by the user.");
    }
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}



