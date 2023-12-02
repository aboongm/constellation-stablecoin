import { ethers } from "ethers";
import abiCoinDollar from "../../../artifacts/contracts/CoinDollar.sol/CoinDollar.json"



export async function TransferCoinDollar(recipientAddress: string, amount: string, isConnected: boolean) {
  const tokenAddress = import.meta.env.VITE_COINDOLLAR_ADDRESS;
  const tokenAbi = abiCoinDollar.abi;

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

    if (balance < amountToSend) {
      alert("Insufficient balance for the transfer.");
      return;
    }

    const estimatedGas = await tokenContract.transfer.estimateGas(recipientAddress, amountToSend)
    // console.log("estimated gas: ", estimatedGas);


    const gasPrice = (await provider.getFeeData())?.gasPrice
    let gasValue;
    if (gasPrice !== null && gasPrice !== undefined) {
      gasValue = ethers.formatEther(gasPrice * estimatedGas);
    } else {
      console.error('Gas price is null or undefined');
    }

    const userConfirmation = window.confirm(`Transaction Details:\nRecipient: ${recipientAddress}\nAmount: ${amount.toString()} COINDOLLAR\nGas Estimate: ${estimatedGas}\nGas Fee: ${gasValue} ETH\n\nConfirm Transaction?`);

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

