// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol";


contract CoinGold is ERC20 {
    // uint256 public goldAmtReserveStatement;  // number of grams of gold from monthly statement
    AggregatorV3Interface internal dataFeed; // Chainlink Aggregator for XAU/USD
    address public owner;

    address private coinDollar;

    // bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");


    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

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

        // _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // _grantRole(ADMIN_ROLE, msg.sender);
        // _grantRole(MINTER_ROLE, msg.sender);
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
        _mint(msg.sender, gramsOfGold * 1e18);
        emit Mint(msg.sender, gramsOfGold * 1e18); // Emit the Mint event here
    }

    // Burn CoinGold tokens when required, only callable by the ow0x80aC9A24c136cc2E722521f899951F6065aAB77aner
    function burnCoinGold(uint256 amount) external onlyOwner {
        // Implement logic to burn CoinGold tokens when needed
        // Make sure to check if the contract has sufficient balance for burning
        require(amount > 0, "Burn amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient CoinGold balance");

        // Implement the burning mechanism
        _burn(msg.sender, amount * 1e18);
         emit Burn(msg.sender, amount * 1e18); // Emit the Burn event here
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
    
    // Add other functions and modifiers as needed to meet requirements
    function setCoinDollarAddress(address _coinDollar) external onlyOwner{
        coinDollar=_coinDollar;
    } 

    function transferFromUser(address user, address recipient, uint256 amount) external {
        require(msg.sender == coinDollar, "Unauthorized");
        _transfer(user, recipient, amount);
    }

     function transferCoinGold(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /* function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, account);
    }

    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, account);
    } */

}
