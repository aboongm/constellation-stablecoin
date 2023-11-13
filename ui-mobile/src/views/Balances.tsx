import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import cngd from '../../assets/images/cngd_icon.png';
import cndo from '../../assets/images/cndo_icon.png';
import { W3mButton, useWeb3Modal } from '@web3modal/wagmi-react-native';
import { FlexView } from '@web3modal/ui-react-native';
import { useAccount, useToken } from 'wagmi';

const tokenContracts = {
  CoinGold: '0x628a290dF6B99a17593168460a269643A0D7BD5F',
  CoinDollar: '0x1aC143a58e143EF29D119a4e0c1cA147aea4E15f',
  // Add more tokens as needed
};

const Balances = () => {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});

  const coinGoldToken = useToken({ address: tokenContracts.CoinGold });
//   console.log('coinGoldToken', coinGoldToken);

  const coinDollarToken = useToken({ address: tokenContracts.CoinDollar });
//   console.log('coinDollarToken', coinDollarToken);

  useEffect(() => {
    console.log('tokenBalances: ', tokenBalances);

    const fetchTokenBalances = async () => {
      try {
        const balances: { [key: string]: string } = {};

        if (coinGoldToken.isSuccess) {
          balances.CoinGold = coinGoldToken.data.totalSupply.formatted;
        }

        if (coinDollarToken.isSuccess) {
          balances.CoinDollar = coinDollarToken.data.totalSupply.formatted;
        }
        console.log("balances", balances);
        
        setTokenBalances(balances);
      } catch (error) {
        console.error('Error fetching token balances:', error);
      }
    };

    if (isConnected) {
      fetchTokenBalances();
    }

    console.log('tokenBalances later: ', tokenBalances);
  },  [isConnected, coinGoldToken.isSuccess, coinGoldToken.data, coinDollarToken.isSuccess, coinDollarToken.data]);

  return isConnected ? (
    <View style={styles.textContainer}>
      <View>
        <Text style={styles.text}>Address:</Text>
        <Text style={{ ...styles.text, marginBottom: 10 }} variant="large-600">
          <FlexView style={styles.buttonContainer}>
            <W3mButton balance="show" />
          </FlexView>
        </Text>
      </View>
      <View>
        <Text style={styles.text}>CoinGold Balance:</Text>
        <View style={styles.coin}>
          <Image source={cngd} style={styles.image} />
          <Text style={styles.text}>{tokenBalances.CoinGold}</Text>
          <Text style={styles.text}>CNGD</Text>
        </View>
      </View>
      <View>
        <Text style={styles.text}>CoinDollar Balance:</Text>
        <View style={styles.coin}>
          <Image source={cndo} style={styles.image} />
          <Text style={styles.text}>{tokenBalances.CoinDollar}</Text>
          <Text style={styles.text}>CNDO</Text>
        </View>
      </View>
    </View>
  ) : (
    // JSX for when not connected
    <FlexView style={styles.buttonContainer}>
      <W3mButton balance="show" />
    </FlexView>
  );
};

export default Balances;

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
    paddingBottom: 20,
  },
  textContainer: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    color: '#00aaff',
  },
  image: {
    width: 16,
    height: 16,
    borderRadius: 50,
    borderColor: 'lightblue',
    borderWidth: 1,
    backgroundColor: 'gold',
  },
  coin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
});
