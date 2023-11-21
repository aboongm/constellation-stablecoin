import React, { useEffect, useState } from 'react';
import { useAccount, useToken } from 'wagmi';
import abiCoinGold from "../../abi/abi-CoinGold.json"
import abiCoinDollar from "../../abi/abi-CoinDollar.json"
import { publicClient } from '../utils/client';
import styles from "../styles/Home.module.css";

const tokenContracts = {
    CoinGold: '0xa143fcE4b63BB3e56F4f621349df09B53Bf8e3B8',
    CoinDollar: '0x14496062DD4a45F00D644791b5C02bdcf9A7187D',
    // Add more tokens as needed
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

                if (coinGoldToken.isSuccess) {
                    const formattedCoinGoldSupply = parseFloat(coinGoldToken.data.totalSupply.formatted).toFixed(4);
                    supply.CoinGold = formattedCoinGoldSupply;
                    // supply.CoinGold = coinGoldToken.data.totalSupply.formatted;
                }

                if (coinDollarToken.isSuccess) {
                    const formattedCoinDollarSupply = parseFloat(coinDollarToken.data.totalSupply.formatted).toFixed(4);
                    supply.CoinDollar = formattedCoinDollarSupply;
                    // supply.CoinDollar = coinDollarToken.data.totalSupply.formatted;
                }

                const balanceCoinGold = await publicClient.readContract({
                    address: tokenContracts.CoinGold,
                    abi: abiCoinGold.abi,
                    functionName: 'balanceOf',
                    args: [accountAddress]
                })

                const balanceCoinDollar = await publicClient.readContract({
                    address: tokenContracts.CoinDollar,
                    abi: abiCoinDollar.abi,
                    functionName: 'balanceOf',
                    args: [accountAddress]
                })


                if (balanceCoinGold) {
                    const humanReadableCoinGoldBalance = (parseFloat(balanceCoinGold) / 1e18).toFixed(4)
                    setCoinGoldBalance(humanReadableCoinGoldBalance.toString());
                }
                if (balanceCoinDollar) {
                    // const humanReadableCoinDollarBalance = (parseFloat(balanceCoinDollar) / 1e18).toFixed(4)
                    const humanReadableCoinDollarBalance = (parseFloat(balanceCoinDollar) / 1e18).toFixed(4)
                    setCoinDollarBalance(humanReadableCoinDollarBalance.toString())
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
        <div>
            <div>
                <h3 style={{ marginLeft: "1rem", color: '#5f5959'}}>CoinGold</h3>
                <div className={styles.card}>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>Address:</p>
                        <button onClick={() => toggleExpandedAddress('CoinGold')} style={{ borderRadius: 4, borderColor: 'lightgrey' }}>
                            <p >{renderAddress(tokenContracts.CoinGold, 'CoinGold')}</p>
                        </button>
                    </div>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>TotalSupply:</p>
                        <p>{tokenSupply.CoinGold}</p>
                        <p>CNGD</p>
                    </div>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>MyBalance  :</p>
                        <p>{coinGoldBalance}</p>
                        <p>CNGD</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 style={{ marginLeft: "1rem", color: '#5f5959'}}>CoinDollar</h3>
                <div className={styles.card}>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>Address:</p>
                        <button onClick={() => toggleExpandedAddress('CoinDollar')} style={{ borderRadius: 4, borderColor: 'lightgrey' }}>
                            <p >{renderAddress(tokenContracts.CoinDollar, 'CoinDollar')}</p>
                        </button>
                    </div>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>TotalSupply:</p>
                        <p>{tokenSupply.CoinDollar}</p>
                        <p>CNDO</p>
                    </div>
                    <div style={{display: 'flex', gap: 10}}>
                        <p>MyBalance :</p>
                        <p>{coinDollarBalance}</p>
                        <p>CNDO</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
