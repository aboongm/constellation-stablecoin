import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { TransferCoinDollar } from '../utils/TransferCoinDollar';
import { TransferCoinGold } from '../utils/TransferCoinGold';

export function SendTransaction() {
  const { isConnected } = useAccount();
  const [coinType, setCoinType] = useState('CoinGold'); 
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  const onCoinTypeChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setCoinType(event.target.value);
  };

  const onRecipientAddressChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setRecipientAddress(event.target.value);
  };

  const onAmountChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setAmount(event.target.value);
  };

  const onPress = (e: { preventDefault: () => void; }) => {
    e.preventDefault()
    
    console.log('onPress: ', coinType, recipientAddress, amount);

    if (coinType === "CoinGold" && recipientAddress && amount) {
      TransferCoinGold(recipientAddress, amount, isConnected);
    } else if (coinType === "CoinDollar" && recipientAddress && amount) {
      TransferCoinDollar(recipientAddress, amount, isConnected);
    }
  };

  return (
    <form style={{ display: 'flex', minWidth: '320px', margin: '0 auto', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', width: '100%' }}>
      <select
        value={coinType}
        onChange={onCoinTypeChange}
        style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          borderRadius: '5px', 
          width: '100%', 
          boxSizing: 'border-box', 
          color: '#5f5959', 
          borderColor: '#aba7a7', 
          borderWidth: 1,
          borderStyle: 'solid'  
        }}
      >
        <option value="CoinGold">CoinGold</option>
        <option value="CoinDollar">CoinDollar</option>
      </select>
      <input
        type="text"
        value={recipientAddress}
        onChange={onRecipientAddressChange}
        aria-label="Recipient"
        placeholder="Recipient Address"
        style={{
          marginBottom: '10px', 
          padding: '8px', 
          borderRadius: '5px', 
          width: '100%', 
          boxSizing: 'border-box', 
          color: '#5f5959', 
          borderColor: '#aba7a7', 
          borderWidth: 1,
          borderStyle: 'solid'  
        }}
      />
      <input
        type="text"
        value={amount}
        onChange={onAmountChange}
        aria-label="Amount"
        placeholder="Amount"
        style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          borderRadius: '5px', 
          width: '100%', 
          boxSizing: 'border-box', 
          color: '#5f5959', 
          borderColor: '#aba7a7', 
          borderWidth: 1,
          borderStyle: 'solid'
         }}
      />
    </div>
    <button
      onClick={onPress}
      style={{
        padding: '10px 20px',
        borderRadius: '5px',
        backgroundColor: '#0e76fd',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        width: '100%', 
        boxSizing: 'border-box',
      }}
    >
      Transfer
    </button>
  </form>
  
  );
}

