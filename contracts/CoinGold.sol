// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract CoinGold is ERC20, AccessControl {
    // uint256 public goldAmtReserveStatement;  // number of grams of gold from monthly statement
    AggregatorV3Interface internal dataFeed; // Chainlink Aggregator for XAU/USD
    address public owner;

    address private coinDollar;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");


    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

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

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); 
        _grantRole(ADMIN_ROLE, msg.sender);  

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

    // Mint new CoinGold tokens backed by physical gold
    function mintCoinGold(uint256 ouncesOfGold) external onlyRole(MINTER_ROLE) {
        // Mint the corresponding CoinGold tokens directly based on ouncesOfGold
        require(ouncesOfGold > 0, "Mint amount must be greater than zero");
        _mint(msg.sender, ouncesOfGold);
        emit Mint(msg.sender, ouncesOfGold); 
    }

    function burnCoinGold(uint256 amount) external onlyRole(MINTER_ROLE) {
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
        return uint256(latestGoldPrice / 1e8) * totalSupplyCoinGold;
    }
    
   /*  // Add other functions and modifiers as needed to meet requirements
    function setCoinDollarAddress(address _coinDollar) external onlyRole(ADMIN_ROLE) {
        coinDollar = _coinDollar;
    }
 */

    function transferFromUser(address user, address recipient, uint256 amount) external onlyRole(MINTER_ROLE) {
        _transfer(user, recipient, amount);
    }


    function transferCoinGold(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function grantMinterRole(address account) public {
        _grantRole(MINTER_ROLE, account);
    }

    function revokeMinterRole(address account) public {
        _revokeRole(MINTER_ROLE, account);
    } 

}


