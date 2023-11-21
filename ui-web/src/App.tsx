import styles from './styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SendTransaction } from "./components/SendTransaction";

function App() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>
          Constellation Hackathon: <a href="https://github.com/aboongm/constellation-stablecoin">Gold Backed Stablecoin</a>
        </h1>

        <div className={styles.grid}>
          <div className={styles.card} >
            <SendTransaction />
          </div>

          {/* <a className={styles.card} href="https://rainbowkit.com">
            <h2>RainbowKit Documentation &rarr;</h2>
            <p>Learn how to customize your wallet connection flow.</p>
          </a> */}

        </div>
      </main>

      <footer className={styles.footer}>
        <a href="https://github.com/aboongm/constellation-stablecoin" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by Ranjit & Yingjie
        </a>
      </footer>
    </div>
  );
}

export default App;
