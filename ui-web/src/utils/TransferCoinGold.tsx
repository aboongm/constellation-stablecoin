import { ethers } from "ethers";
import abiCoinGold from "../../../artifacts/contracts/CoinGold.sol/CoinGold.json"

export async function TransferCoinGold(recipientAddress: string, amount: string, isConnected: boolean) {

  const tokenAddress = import.meta.env.VITE_COINGOLD_ADDRESS; 
  const tokenAbi = abiCoinGold.abi; 
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  const signer = await provider.getSigner();
  // console.log("Account:", await signer.getAddress());

  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

  const amountToSend = ethers.parseUnits(amount, 18);
  try {
    const balance = await tokenContract.balanceOf(signer)
    // console.log("balance: ", balance);
    const totalSupply = await tokenContract.totalSupply()
    // console.log("totalSupply: ", totalSupply);

    const estimatedGas = await tokenContract.transfer.estimateGas(recipientAddress, amountToSend)
    // console.log("amountToSend", amountToSend);

    const gasPrice = (await provider.getFeeData())?.gasPrice
    let gasValue;
    if (gasPrice !== null && gasPrice !== undefined) {
      gasValue = ethers.formatEther(gasPrice * estimatedGas);
    } else {
      console.error('Gas price is null or undefined');
    }

    const userConfirmation = window.confirm(`Transaction Details:\nRecipient: ${recipientAddress}\nAmount: ${amount.toString()} COINGOLD\nGas Estimate: ${estimatedGas}\nGas Fee: ${gasValue} ETH\n\nConfirm Transaction?`);

    if (userConfirmation) {
      const transaction = await tokenContract.transfer(recipientAddress, amountToSend);
      // console.log("Transaction hash:", transaction.hash);
      await transaction.wait();
      alert("Transfer successful!");
    } else {
      console.log("Transaction canceled by the user.");
    }
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}



