import React, { useEffect, useState } from 'react';
import { useAccount, useToken } from 'wagmi';
import { publicClient } from '../utils/client';
import styles from "../styles/Home.module.css";
import abiCoinGold from "../../../artifacts/contracts/CoinGold.sol/CoinGold.json"
import abiCoinDollar from "../../../artifacts/contracts/CoinDollar.sol/CoinDollar.json"

const tokenContracts = {
    CoinGold: import.meta.env.VITE_COINGOLD_ADDRESS,
    CoinDollar: import.meta.env.VITE_COINDOLLAR_ADDRESS,
};

export default function Balances() {
    const { address: accountAddress, isConnected } = useAccount();
    const [tokenSupply, setTokenSupply] = useState<{ [key: string]: string }>({});
    const [coinGoldBalance, setCoinGoldBalance] = useState<string>('0');
    const [coinDollarBalance, setCoinDollarBalance] = useState<string>('0');
    const [expandedAddress, setExpandedAddress] = useState<string | null>(null);
    const coinGoldToken = useToken({ address: tokenContracts.CoinGold });
    const coinDollarToken = useToken({ address: tokenContracts.CoinDollar });

    const renderAddress = (address: string, token: string) => {
        if (!address) return '';
        return expandedAddress === token ? address : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const toggleExpandedAddress = (token: string) => {
        setExpandedAddress(expandedAddress === token ? null : token);
    };

    useEffect(() => {

        const fetchTokenSupply = async () => {
            try {
                const supply: { [key: string]: string } = {};

                if (coinGoldToken.isSuccess && coinGoldToken.data && coinGoldToken.data.totalSupply) {
                    const formattedCoinGoldSupply = parseFloat(coinGoldToken.data.totalSupply.formatted).toFixed(4);
                    supply.CoinGold = formattedCoinGoldSupply;
                }

                if (coinDollarToken.isSuccess && coinDollarToken.data && coinDollarToken.data.totalSupply) {
                    const formattedCoinDollarSupply = parseFloat(coinDollarToken.data.totalSupply.formatted).toFixed(4);
                    supply.CoinDollar = formattedCoinDollarSupply;
                }

                let balanceCoinGold: bigint;

                try {
                    const result = await publicClient.readContract({
                        address: tokenContracts.CoinGold,
                        abi: abiCoinGold.abi,
                        functionName: 'balanceOf',
                        args: [accountAddress]
                    });

                    if (typeof result === 'bigint') {
                        balanceCoinGold = result;
                    } else if (typeof result === 'string') {
                        balanceCoinGold = BigInt(result);
                    } else {
                        throw new Error('Unexpected return type');
                    }

                    const humanReadableCoinGoldBalance = (Number(balanceCoinGold) / 1e18).toFixed(4)
                    setCoinGoldBalance(humanReadableCoinGoldBalance);
                } catch (error) {
                    console.error('Error fetching balanceCoinGold:', error);
                }

                let balanceCoinDollar: bigint;

                try {
                    const result = await publicClient.readContract({
                        address: tokenContracts.CoinDollar,
                        abi: abiCoinDollar.abi,
                        functionName: 'balanceOf',
                        args: [accountAddress]
                    });

                    if (typeof result === 'bigint') {
                        balanceCoinDollar = result;
                    } else if (typeof result === 'string') {
                        balanceCoinDollar = BigInt(result);
                    } else {
                        throw new Error('Unexpected return type');
                    }

                    const humanReadableCoinDollarBalance = (Number(balanceCoinDollar) / 1e18).toFixed(4)
                    setCoinDollarBalance(humanReadableCoinDollarBalance);
                } catch (error) {
                    console.error('Error fetching balanceCoinDollar:', error);
                }

                setTokenSupply(supply);
            } catch (error) {
                console.error('Error fetching token supply:', error);
            }
        };

        if (isConnected) {
            fetchTokenSupply();
        }

    }, [isConnected, coinGoldToken.isSuccess, coinGoldToken.data, coinDollarToken.isSuccess, coinDollarToken.data, accountAddress]);


    return (
        <div style={{ display: 'flex', minWidth: '320px', margin: '0 auto', flexDirection: 'column', alignItems: 'center' }}>
            <div>
                <h3 style={{ marginLeft: "1rem", color: '#5f5959' }}>CoinGold</h3>
                <div className={styles.card}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>Address:</p>
                        <button onClick={() => toggleExpandedAddress('CoinGold')} style={{ borderRadius: 4, borderColor: 'lightgrey' }}>
                            <p >{renderAddress(tokenContracts.CoinGold, 'CoinGold')}</p>
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>TotalSupply:</p>
                        <p>{tokenSupply.CoinGold}</p>
                        <p>CNGD</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>MyBalance  :</p>
                        <p>{coinGoldBalance}</p>
                        <p>CNGD</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 style={{ marginLeft: "1rem", color: '#5f5959' }}>CoinDollar</h3>
                <div className={styles.card}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>Address:</p>
                        <button onClick={() => toggleExpandedAddress('CoinDollar')} style={{ borderRadius: 4, borderColor: 'lightgrey' }}>
                            <p >{renderAddress(tokenContracts.CoinDollar, 'CoinDollar')}</p>
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>TotalSupply:</p>
                        <p>{tokenSupply.CoinDollar}</p>
                        <p>CNDO</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <p>MyBalance :</p>
                        <p>{coinDollarBalance}</p>
                        <p>CNDO</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
