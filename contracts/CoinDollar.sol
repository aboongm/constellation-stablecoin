// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CoinGold} from "./CoinGold.sol"; // Import the CoinGold token contract

contract Xehn is ERC20 {
    CoinGold public coinGold; // Reference to the CoinGOld token contract
    AggregatorV3Interface internal goldPriceFeed; // Chainlink Aggregator for XAU/USD
    address public owner;
    uint256 public lastAdjustmentTimestamp;
    uint256 public reserveRatio; // Reserve ratio in percentage (60% reserve)
    uint256 public maximumBackingValue; // 100% USD value of CoinGoldCOIN
    uint256 public minimumBackingValue; // 50% USD value of CoinGoldCOIN

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _coinGoldAddress,
        address _goldPriceFeed
    ) ERC20(name, symbol) {
        owner = msg.sender;
        coinGold = CoinGold(_coinGoldAddress);
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
        lastAdjustmentTimestamp = block.timestamp;
        reserveRatio = 20; // 20% reserve
        maximumBackingValue = coinGold.totalCapitalization();
        minimumBackingValue = maximumBackingValue / 2;
    }

    function getGoldPrice() public view returns (int256) {
        (
            ,
            /* uint80 roundID */ int256 price /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */,
            ,
            ,

        ) = goldPriceFeed.latestRoundData();
        return price;
    }

    function adjustSupply() external onlyOwner {
        // Calculate the change in the value of gold and adjust supply accordingly
        uint256 currentGoldPrice = uint256(getGoldPrice());
        require(currentGoldPrice > 0, "Invalid gold price");

        uint256 totalCapitalizationCoinGold = (currentGoldPrice / 1e8) *
            coinGold.totalSupply();

        if (totalCapitalizationCoinGold > totalSupply()) {
            // Increase the supply to match the increased INR value of CoinGold
            uint256 additionalSupply = uint256(totalCapitalizationCoinGold) -
                totalSupply();
            _mint(msg.sender, additionalSupply);
        } else if (totalSupply() > 2 * totalCapitalizationCoinGold) {
            // Calculate the amount to burn to meet the 2x target
            uint256 targetSupply = 2 * totalCapitalizationCoinGold;
            uint256 amountToBurn = totalSupply() - targetSupply;

            // Check if the amount to burn is within the owner's reserve
            if (amountToBurn > 0) {
                uint256 maxBurnAmount = (totalSupply() * reserveRatio) / 100;
                amountToBurn = (amountToBurn > maxBurnAmount)
                    ? maxBurnAmount
                    : amountToBurn;

                // Check if the owner has enough tokens for burning
                if (balanceOf(owner) >= amountToBurn) {
                    // Burn the owner's tokens
                    _burn(owner, amountToBurn);
                }
            }
        }

        lastAdjustmentTimestamp = block.timestamp;
    }

    function mint(uint256 amount) external onlyOwner {
        // Mint function for XEHN
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) external onlyOwner {
        // Burn function for XEHN
        _burn(msg.sender, amount);
    }
}
