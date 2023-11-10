// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract CoinGold is ERC20 {
    uint256 public goldAmtReserveStatement;  // number of grams of gold from monthly statement
    AggregatorV3Interface internal dataFeed; // Chainlink Aggregator for XAU/USD
    address public owner;

    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event ExchangeGoldToDollar(address indexed from, uint256 amount);

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
        uint256 _goldAmtReserveStatement,
        address _dataFeedAddress
    ) ERC20(name, symbol) {
        goldAmtReserveStatement = _goldAmtReserveStatement;
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

    // Function to provide monthly or quarterly gold holding statement
    // Add logic to verify and generate proof of gold reserves
    function provideGoldHoldingStatement() external onlyOwner {
        // Implement proof of gold reserves logic here
    }

    // Mint new SANCoinGoldA tokens backed by physical gold
    function mintCoinGold(uint256 gramsOfGold) external onlyOwner {
        // Mint the corresponding CoinGold tokens directly based on gramsOfGold
        _mint(msg.sender, gramsOfGold);
        emit Mint(msg.sender, gramsOfGold); // Emit the Mint event here
    }

    // Burn CoinGold tokens when required, only callable by the owner
    function burnCoinGold(uint256 amount) external onlyOwner {
        // Implement logic to burn CoinGold tokens when needed
        // Make sure to check if the contract has sufficient balance for burning
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

    function exchangeGoldToDollar(uint256 amount) public{
        require(balanceOf(msg.sender)>=amount,"Insufficient CoinGold balance to redeem");

        _burn(msg.sender,amount);

        emit ExchangeGoldToDollar(msg.sender,amount);
    }
}
