// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CoinDollar} from "./CoinDollar.sol"; // Import the CoinGold token contract

contract CoinGold is ERC20 {
    // uint256 public goldAmtReserveStatement;  // number of grams of gold from monthly statement
    AggregatorV3Interface internal dataFeed; // Chainlink Aggregator for XAU/USD
    address public owner;

    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event ExchangeGoldToDollar(address indexed from, uint256 amount);
    CoinDollar public coinDollar;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

     /**
     * Network: Sepolia
     * Aggregator: XAU/USD
     * Address: 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea
     */
    constructor(
        string memory name,
        string memory symbol,
        address _dataFeedAddress
    ) ERC20(name, symbol) {
        dataFeed = AggregatorV3Interface(
            _dataFeedAddress
        );
        owner = msg.sender;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    // Mint new SANCoinGoldA tokens backed by physical gold
    function mintCoinGold(uint256 gramsOfGold) external onlyOwner {
        // Mint the corresponding CoinGold tokens directly based on gramsOfGold
        require(gramsOfGold > 0, "Mint amount must be greater than zero");
        _mint(msg.sender, gramsOfGold);
        emit Mint(msg.sender, gramsOfGold); // Emit the Mint event here
    }

    // Burn CoinGold tokens when required, only callable by the owner
    function burnCoinGold(uint256 amount) external onlyOwner {
        // Implement logic to burn CoinGold tokens when needed
        // Make sure to check if the contract has sufficient balance for burning
        require(amount > 0, "Burn amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient CoinGold balance");

        // Implement the burning mechanism
        _burn(msg.sender, amount);
         emit Burn(msg.sender, amount); // Emit the Burn event here
    }

    // Calculate the total capitalization of the tokens
    function totalCapitalization() public view returns (uint256) {
        // Fetch the latest answer from the Chainlink XAU/USD Aggregator
        (, int latestGoldPrice, , , ) = dataFeed.latestRoundData();
        require(latestGoldPrice > 0, "Invalid gold price");

        // Calculate the total capitalization of all CoinGold tokens
        uint256 totalSupplyCoinGold = totalSupply();
        return uint256(latestGoldPrice) * totalSupplyCoinGold;
    }
    
    // Add other functions and modifiers as needed to meet your requirements

     // Function to set the CoinDollar contract address
    function setCoinDollarContract(address _coinDollar) external onlyOwner {
        coinDollar = CoinDollar(_coinDollar);
    }

    function exchangeGoldToDollar(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient CoinGold balance");

        // Burn CoinGold
        _burn(msg.sender, amount);

        // Calculate the amount of CoinDollar to mint
        uint256 coinDollarAmount = calculateCoinDollarAmount(amount);

        // Mint CoinDollar
        coinDollar.mintFromCoinGold(msg.sender, coinDollarAmount);

        emit ExchangeGoldToDollar(msg.sender, amount);
    }

    // Function to calculate the amount of CoinDollar based on the amount of CoinGold
    function calculateCoinDollarAmount(uint256 coinGoldAmount) private view returns (uint256) {
        (, int256 goldPrice, , , ) = dataFeed.latestRoundData();
        require(goldPrice > 0, "Invalid gold price");

        // Example calculation: You might need to adjust the formula based on your tokenomics
        uint256 coinDollarAmount = (coinGoldAmount * uint256(goldPrice)) / 1e8;
        return coinDollarAmount;
    }
}
