import React, { useState } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { useAccount, useSendTransaction } from 'wagmi';
import { Button } from '@web3modal/ui-react-native';
import { parseEther } from 'viem/utils';

const Transfer = () => {
  const [requestModalVisible, setRequetsModalVisible] = useState(false);
  const { isConnected } = useAccount();
  const [toAddress, setToAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const { data, isLoading, isSuccess, isError, sendTransaction } =
    useSendTransaction({
      to: toAddress,
      value: parseEther(transferAmount),
      data: '0x', // to make it work with some wallets
    });

  const transfer = () => {
    sendTransaction();
    setRequetsModalVisible(true);
  };

  return isConnected ? (
    <View style={{ ...styles.container, flex: 4 }}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Recipient Address"
          value={toAddress}
          onChangeText={(text) => setToAddress(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Transfer Amount"
          value={transferAmount}
          onChangeText={(text) => setTransferAmount(text)}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button disabled={isLoading} onPress={transfer} style={styles.button}>
          Transfer
        </Button>
      </View>
    </View>
  ) : null;
};

export default Transfer;

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
    marginBottom: 20,
  },

  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
  },

  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
    paddingBottom: 20,
  },

  button: {
    padding: 10,
    backgroundColor: '#00aaff',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    borderRadius: 6,
  },
});
