import styles from './styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { SendTransaction } from "./components/SendTransaction";
import Balances from './components/Balances';

function App() {
  const { isConnected } = useAccount();

  return isConnected ? (
    <div className={styles.container}>
      <main className={styles.main}>
        <ConnectButton />

        <div className={styles.title}>
          <h4 style={{
            margin: 4, color: '#5f5959'
          }}>Constellation Hackathon:</h4>
          <a href="https://github.com/aboongm/constellation-stablecoin" >Gold Backed Stablecoin</a>
        </div>

        <div className={styles.grid}>
          <Balances />
        </div>

        <div className={styles.grid}>
          <div className={styles.card} >
            <SendTransaction />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a href="https://github.com/aboongm/constellation-stablecoin" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by Ranjit & Yingjie
        </a>
      </footer>
    </div>
  ) : (
    <div className={styles.container}>
      <main className={styles.main}>
        <ConnectButton />
      </main>
    </div>
  );
}

export default App;
