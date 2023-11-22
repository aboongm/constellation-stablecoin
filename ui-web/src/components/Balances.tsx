import React, { useEffect, useState } from 'react';
import { useAccount, useToken } from 'wagmi';
import abiCoinGold from "../../abi/abi-CoinGold.json"
import abiCoinDollar from "../../abi/abi-CoinDollar.json"
import { publicClient } from '../utils/client';
import styles from "../styles/Home.module.css";

const tokenContracts = {
    CoinGold: '0x712D272A886dCa26D712C274E4b32179e80F5B54',
    CoinDollar: '0x4fe3E18a4c2292E126b67F8C00D4BEb2115274AB',
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
    console.log("Account Address: ", accountAddress);
    
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
                console.log("CoinGold: ", balanceCoinGold);
                console.log("CoinDollar: ", balanceCoinDollar);
                

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
        <div style={{ display: 'flex', minWidth: '320px', margin: '0 auto', flexDirection: 'column', alignItems: 'center' }}>
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
