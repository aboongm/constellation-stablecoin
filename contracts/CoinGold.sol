// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract CoinGold is ERC20, AccessControl {
    AggregatorV3Interface internal dataFeed; 
    address public owner;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address _dataFeedAddress
    ) ERC20(name, symbol) {
        dataFeed = AggregatorV3Interface(
            _dataFeedAddress
        );
        owner = msg.sender;
        _mint(msg.sender,1000*1e18);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); 
        _grantRole(ADMIN_ROLE, msg.sender);  

    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        (
            , int answer, , ,
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function mintCoinGold(uint256 ouncesOfGold) external onlyRole(MINTER_ROLE) {
        require(ouncesOfGold > 0, "Mint amount must be greater than zero");
        _mint(msg.sender, ouncesOfGold);
        emit Mint(msg.sender, ouncesOfGold); 
    }

    function burnCoinGold(uint256 amount) external onlyRole(MINTER_ROLE) {
        require(amount > 0, "Burn amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient CoinGold balance");

        _burn(msg.sender, amount);
         emit Burn(msg.sender, amount); 
    }

    function totalCapitalization() public view returns (uint256) {
        (, int latestGoldPrice, , , ) = dataFeed.latestRoundData();
        require(latestGoldPrice > 0, "Invalid gold price");

        uint256 totalSupplyCoinGold = totalSupply();
        return uint256(latestGoldPrice / 1e8) * totalSupplyCoinGold;
    }
    
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


