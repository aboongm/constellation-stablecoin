import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, Alert, Platform } from 'react-native';
import {
  useAccount,
  usePrepareSendTransaction,
  useSendTransaction,
  useWaitForTransaction,
} from 'wagmi';
import { Button } from '@web3modal/ui-react-native';
import { parseEther } from 'viem/utils';
import { useDebounce } from 'use-debounce';

export const Transfer = () => {
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const { isConnected } = useAccount();
  const [toAddress, setToAddress] = useState('');
  const [debouncedTo] = useDebounce(toAddress, 500)

  const [amount, setAmount] = useState('');
  const [debouncedAmount] = useDebounce(amount, 500)

  const [selectedToken, setSelectedToken] = useState('CNGD');
  const [scanning, setScanning] = useState(false);
  const [scannedAddress, setScannedAddress] = useState('');

  useEffect(() => {
    if (scannedAddress) {
      setToAddress(scannedAddress);
      setScannedAddress('');
      setScanning(false);
    }
  }, [scannedAddress]);

  const { config } = usePrepareSendTransaction({
    to: debouncedTo,
    value: debouncedAmount ? parseEther(debouncedAmount) : undefined,
    token: selectedToken,
  })
  const { data, sendTransaction } = useSendTransaction(config)
  console.log("data: ", data)

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return isConnected ? (
    <View style={{ ...styles.container, flex: 3 }}>
      
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={toAddress}
          onChangeText={(text) => setToAddress(text)}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0.5"
          value={amount}
          onChangeText={(text) => setAmount(text)}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          disabled={isLoading || !amount || !toAddress || !sendTransaction} 
          onPress={() => sendTransaction()} 
          style={styles.button}
        >
          Transfer
        </Button>
      </View>
    </View>
  ) : null;
};

// export default Transfer;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#dddddd',
    gap: 14,
    borderRadius: 20,
    // Shadow properties for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 4,
  },

  inputContainer: {
    width: '100%',
    // marginBottom: 20,
  },

  input: {
    height: 40,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dddddd',
  },

  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
    // paddingBottom: 20,
  },

  button: {
    padding: 10,
    backgroundColor: '#00aaff',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    borderRadius: 6,
  },
});
