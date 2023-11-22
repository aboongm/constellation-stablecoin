import { ethers } from "ethers";
import abiCoinGold from "../../abi/abi-CoinGold.json";

export async function TransferCoinGold(recipientAddress: string, amount: string, isConnected: boolean) {

  // Contract address and ABI of the token
  const tokenAddress = "0x712D272A886dCa26D712C274E4b32179e80F5B54"; // Replace with the actual token contract address
  const tokenAbi = abiCoinGold.abi; // Replace with the actual token ABI
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // It will prompt user for account connections if it isnt connected
  const signer = await provider.getSigner();
  console.log("Account:", await signer.getAddress());

  // The contract instance of the token using the signer
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

  const amountToSend = ethers.parseUnits(amount, 18);
  try {
    const balance = await tokenContract.balanceOf(signer)
    console.log("balance: ", balance);
    const totalSupply = await tokenContract.totalSupply()
    console.log("totalSupply: ", totalSupply);

    // Estimate gas for the transaction
    const estimatedGas = await tokenContract.transfer.estimateGas(recipientAddress, amountToSend)
    console.log("amountToSend", amountToSend);

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

    // // Ask for user confirmation with gas information
    const userConfirmation = window.confirm(`Transaction Details:\nRecipient: ${recipientAddress}\nAmount: ${amount.toString()} COINGOLD\nGas Estimate: ${estimatedGas}\nGas Fee: ${gasValue} ETH\n\nConfirm Transaction?`);

    if (userConfirmation) {
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



