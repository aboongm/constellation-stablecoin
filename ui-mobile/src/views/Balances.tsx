import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import cngd from '../../assets/images/cngd_icon.png';
import cndo from '../../assets/images/cndo_icon.png';
import { W3mButton, useWeb3Modal } from '@web3modal/wagmi-react-native';
import { FlexView } from '@web3modal/ui-react-native';
import { useAccount, useToken } from 'wagmi';
import { publicClient } from '../utils/client';
import abiCoinGold from "../../abi/abi-CoinGold.json"
import abiCoinDollar from "../../abi/abi-CoinDollar.json"

const tokenContracts = {
  CoinGold: '0x628a290dF6B99a17593168460a269643A0D7BD5F',
  CoinDollar: '0x1aC143a58e143EF29D119a4e0c1cA147aea4E15f',
  // Add more tokens as needed
};

export const Balances = () => {
  const { address: accountAddress, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [tokenSupply, setTokenSupply] = useState<{ [key: string]: string }>({});
  const [coinGoldBalance, setCoinGoldBalance] = useState<string>('0');
  const [coinDollarBalance, setCoinDollarBalance] = useState<string>('0');

  const coinGoldToken = useToken({ address: tokenContracts.CoinGold });

  const coinDollarToken = useToken({ address: tokenContracts.CoinDollar });

  useEffect(() => {

    const fetchTokenSupply = async () => {
      try {
        const supply: { [key: string]: string } = {};

        if (coinGoldToken.isSuccess) {
          supply.CoinGold = coinGoldToken.data.totalSupply.formatted;
        }

        if (coinDollarToken.isSuccess) {
          supply.CoinDollar = coinDollarToken.data.totalSupply.formatted;
        }

        const balanceCoinGold  = await publicClient.readContract({
          address: tokenContracts.CoinGold,
          abi: abiCoinGold.abi,
          functionName: 'balanceOf',
          args: [accountAddress]
        })

        const balanceCoinDollar  = await publicClient.readContract({
          address: tokenContracts.CoinDollar,
          abi: abiCoinDollar.abi,
          functionName: 'balanceOf',
          args: [accountAddress]
        })

        
        if (balanceCoinGold ) {
          const humanReadableCoinGoldBalance = (parseFloat(balanceCoinGold) / 1e18).toFixed(4)
          setCoinGoldBalance(humanReadableCoinGoldBalance.toString());
        }
        if (balanceCoinDollar ) {
          const humanReadableCoinDollarBalance = (parseFloat(balanceCoinDollar) / 1e18).toFixed(4)
          setCoinDollarBalance(humanReadableCoinDollarBalance.toString())
        }
        // console.log("supply: ", supply);
        
        setTokenSupply(supply);
      } catch (error) {
        console.error('Error fetching token supply:', error);
      }
    };

    if (isConnected) {
      fetchTokenSupply();
    }

  },  [isConnected, coinGoldToken.isSuccess, coinGoldToken.data, coinDollarToken.isSuccess, coinDollarToken.data, accountAddress]);

  return isConnected ? (
    <View style={{...styles.container, flex: 6}}>
    <View style={styles.textContainer}>
    <View style={{borderWidth: 1}}>
        <View>
          <Text style={styles.text}>CoinGold Address:</Text>
          <View style={styles.coin}>
            <Text style={styles.text}>{tokenContracts.CoinGold}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.text}> CoinGoldTotalSupply:</Text>
          <View style={styles.coin}>
            <Image source={cndo} style={styles.image} />
            <Text style={styles.text}>{tokenSupply.CoinGold}</Text>
            <Text style={styles.text}>CNGD</Text>
          </View>
        </View>
      </View> 

      <View style={{borderWidth: 1}}>
        <View>
          <Text style={styles.text}>CoinDollar Address:</Text>
          <View style={styles.coin}>
            <Text style={styles.text}>{tokenContracts.CoinDollar}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.text}>CoinDollar TotalSupply:</Text>
          <View style={styles.coin}>
            <Image source={cndo} style={styles.image} />
            <Text style={styles.text}>{tokenSupply.CoinDollar}</Text>
            <Text style={styles.text}>CNDO</Text>
          </View>
        </View>
      </View> 

      <View style={{borderWidth: 1}}>
        <View>
          <Text style={styles.text}>NativeCoin Address & Balance:</Text>
            <FlexView style={styles.buttonContainer}>
              <W3mButton balance="show" />
            </FlexView>
          </View>
        <View>
          <Text style={styles.text}>CoinGold Balance:</Text>
          <View style={styles.coin}>
            <Image source={cngd} style={styles.image} />
            <Text style={styles.text}>{coinGoldBalance}</Text>
            <Text style={styles.text}>CNGD</Text>
          </View>
        </View>
        <View>
          <Text style={styles.text}>CoinDollar Balance:</Text>
          <View style={styles.coin}>
            <Image source={cndo} style={styles.image} />
            <Text style={styles.text}>{coinDollarBalance}</Text>
            <Text style={styles.text}>CNDO</Text>
          </View>
        </View>
      </View>      
    </View>
    </View>
  ) : (
    // JSX for when not connected
    <View style={{...styles.container, flex: 5}}>
    <FlexView style={styles.buttonContainer}>
      <W3mButton balance="show" />
    </FlexView>
    </View>
  );
};

// export default supply;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderWidth: 1,
        borderColor: "#dddddd",
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
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
