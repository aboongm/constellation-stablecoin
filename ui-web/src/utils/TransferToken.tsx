import { ethers } from "ethers";
import abiCoinDollar from "../../abi/abi-CoinDollar.json";
import { formatEther } from "viem";

// Contract address and ABI of the token
const tokenAddress = "0x4fe3E18a4c2292E126b67F8C00D4BEb2115274AB"; // Replace with the actual token contract address
const tokenAbi = abiCoinDollar.abi; // Replace with the actual token ABI

// Your wallet's private key and Infura provider
const privateKey = "69dc40a89741c07cf37dc2a2de9be0a4c5e17f66ff74e8e045372321471492ca"; // Replace with your private key
const API_KEY = "8158ae5ca93b4957aeabdcdae087ec69"; // Replace with your Infura API key

// const provider = new ethers.providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`);
const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`)
const wallet = new ethers.Wallet(privateKey, provider);

// The contract instance of the token
const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);
// const totalSupply = await tokenContract.totalSupply()

export async function TransferToken(recipientAddress: string, amount: string, isConnected: boolean) {
  const amountToSend = ethers.parseUnits(amount, 18);
  try {
    const balance = await tokenContract.balanceOf(wallet.address)
    console.log("balance: ", balance);
    const totalSupply = await tokenContract.totalSupply()
    console.log("totalSupply: ", totalSupply);

    if (balance < amountToSend) {
      alert("Insufficient balance for the transfer.");
      return;
    }
    // Estimate gas for the transaction
    const estimatedGas = await tokenContract.transferCoinGold.estimateGas(recipientAddress, amountToSend)

    // Display the gas estimate to the user
    const gasPrice = (await provider.getFeeData())?.gasPrice
    let gasValue;
    if (gasPrice !== null && gasPrice !== undefined) {
      gasValue = ethers.formatEther(gasPrice * estimatedGas);
      // Use gasValue here or perform further operations
    } else {
      // Handle the case where gasPrice is null or undefined
      console.error('Gas price is null or undefined');
    }

    // Ask for user confirmation with gas information
    const userConfirmation = window.confirm(`Transaction Details:\nRecipient: ${recipientAddress}\nAmount: ${amount.toString()} COINDOLLAR\nGas Estimate: ${estimatedGas}\nGas Fee: ${gasValue} ETH\n\nConfirm Transaction?`);

    if (userConfirmation) {
      // Send the transaction
      const transaction = await tokenContract.transfer(recipientAddress, amountToSend);
      console.log("Transaction hash: ", transaction.hash);
      await transaction.wait();
      alert("Transfer successful!");
      // console.log(await tokenContract.transferCoinDollar(recipientAddress, amountToSend))
    } else {
      console.log("Transaction canceled by the user.");
    }
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}

