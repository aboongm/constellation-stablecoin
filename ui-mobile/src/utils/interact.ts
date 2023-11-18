import abiCoinDollar from "../../abi/abi-CoinDollar.json"
import { readContract, prepareWriteContract, writeContract } from '@wagmi/core';
import { useAccount } from "wagmi";

// Assuming you have the contract's ABI and address
const CoinDollarAddress = '0xa143fcE4b63BB3e56F4f621349df09B53Bf8e3B8';

// Replace with the actual ABI and contract address
const contractABI = abiCoinDollar.abi; // Your provided ABI
const contractAddress = CoinDollarAddress; // Your actual contract address

async function getLatestAnswer() {
  const data = await readContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getChainlinkDataFeedLatestAnswer',
  });

  // Perform the read operation
//   const result = await data.waitForResponse();
  // 'result' will contain the value returned by getChainlinkDataFeedLatestAnswer
  console.log('Latest Answer:', data);
}

// Example parameters for transfer: sending 100 tokens to 'recipientAddress'
// const recipientAddress = '0x...'; // Replace with the recipient's address

export async function transferTokens(recipientAddress: string, amount: Number) {
    const { address: accountAddress, isConnected } = useAccount();
    const userAddress = accountAddress; 

    if (isConnected) {
        console.log("transferTokens Called!");
        
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress, // Contract address
                abi: contractABI,
                functionName: 'transferCoinGold',
                args: [recipientAddress, amount], // Parameters for the transferFromUser function
              });
          
            // Perform the token transfer using writeContract
            const { hash } = await writeContract(request);
            // 'hash' will contain the transaction hash once the transfer is sent
            console.log('Transaction Hash:', hash);
        } catch (error) {
            console.log(error)
        }
    }
}

// Call the functions
// getLatestAnswer();
// transferTokens();
