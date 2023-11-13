import '@walletconnect/react-native-compat';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import {
  createWeb3Modal,
  defaultWagmiConfig,
  Web3Modal,
  W3mButton,
} from '@web3modal/wagmi-react-native';
import { FlexView, Text } from '@web3modal/ui-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Sentry from '@sentry/react-native';

import { WagmiConfig } from 'wagmi';
import {
  sepolia,
  arbitrum,
  mainnet,
  polygon,
  avalanche,
  bsc,
  optimism,
  gnosis,
  zkSync,
  zora,
  base,
  celo,
  aurora,
} from 'wagmi/chains';
import { ENV_PROJECT_ID, ENV_SENTRY_DSN } from '@env';
import { SignMessage } from './views/SignMessage';
import { SendTransaction } from './views/SendTransaction';
import { ReadContract } from './views/ReadContract';


import Balances from './views/Balances';

if (!__DEV__ && ENV_SENTRY_DSN) {
  Sentry.init({
    dsn: ENV_SENTRY_DSN,
  });
}

// 1. Get projectId
const projectId = "778ab3a036060b46ad14bab5c834c5a0";

// 2. Create config
const metadata = {
  name: 'Web3Modal + wagmi',
  description: 'Web3Modal + wagmi',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'w3mwagmisample://',
  },
};

const clipboardClient = {
  setString: async (value: string) => {
    Clipboard.setString(value);
  },
};

const chains = [
  sepolia,
  mainnet,
  polygon,
  avalanche,
  arbitrum,
  bsc,
  optimism,
  gnosis,
  zkSync,
  zora,
  base,
  celo,
  aurora,
];

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({
  projectId,
  chains,
  wagmiConfig,
  clipboardClient,
});

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <WagmiConfig config={wagmiConfig}>
      <SafeAreaView style={[styles.container, isDarkMode && styles.dark]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={{...styles.container, flex: 3}}>
          <Text style={{...styles.title, color: "gold", fontWeight: "900"}} variant="large-600">
            Gold Backed Stablecoin
          </Text>
          <Text style={{...styles.subTitle, color: "#00aaff", fontWeight: "900"}} variant="large-400">
            Constellation Hackathon
          </Text>
        </View>

        <View style={{...styles.container, flex: 5}}>
          <Balances />
        </View>

        <View style={{...styles.container, flex: 4 }}>
          <View style={styles.buttonContainer}>
            <Text style={styles.button} variant="large-600">
              Transfer CoinGold
            </Text>
            <Text style={styles.button} variant="large-600">
              Transfer CoinDollar
            </Text>
          </View>
        </View>
        {/* <FlexView style={styles.buttonContainer}>
          <W3mButton balance="show" />
          <SignMessage />
          <SendTransaction />
          <ReadContract />
        </FlexView> */}
        
        <Web3Modal />
      </SafeAreaView>
    </WagmiConfig>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderWidth: 1,
    borderColor: "lightblue",
    gap: 14
  },
  
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: 'flex-end',
    gap: 10,
    width: "100%",
    paddingBottom: 20
  },
  dark: {
    backgroundColor: '#141414',
  },
  title: {
    fontSize: 28,
  },
  subTitle: {
    fontSize: 20,
  },
 
  button: {
    padding: 10, 
    backgroundColor: '#00aaff', 
    width: "100%", 
    textAlign: 'center',
    color: "#fff",
    borderRadius: 6
  }
});

export default App;
