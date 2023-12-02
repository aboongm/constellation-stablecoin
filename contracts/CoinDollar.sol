// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CoinGold} from "./CoinGold.sol"; 
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CoinDollar is ERC20, AutomationCompatibleInterface, AccessControl {
    CoinGold public coinGold; 
    AggregatorV3Interface internal goldPriceFeed; 
    address public owner;
    uint256 public lastAdjustmentTimestamp;
    uint256 public reserveRatio; 
    uint256 public maximumBackingValue; 
    uint256 public minimumBackingValue; 
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event AdjustSupply(uint256 newSupply);
    
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
        reserveRatio = 20;
        maximumBackingValue = coinGold.totalCapitalization();
        minimumBackingValue = maximumBackingValue / 2;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); 
    }

    function getGoldPrice() public view returns (uint256) {
        (
            ,
            /* uint80 roundID */ int256 price /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */,
            ,
            ,

        ) = goldPriceFeed.latestRoundData();
        require(price > 0, "Invalid gold price");
        return uint256(price);
    }

    function getGoldCoinTotalCapitalization() external view returns (uint256) {
        return coinGold.totalCapitalization();
    }

    function transferCoinGoldFromUser(address user, address recipient, uint256 amount) external {
        coinGold.transferFromUser(user, recipient, amount);
    }

    function mintCoinGold(uint256 ouncesOfGold) public {
        coinGold.mintCoinGold(ouncesOfGold);
    }

    function burnCoinGold(uint256 amount) public {
        coinGold.burnCoinGold(amount);
    }

    function transferCoinGold(address to, uint256 amount) public {
        coinGold.transferCoinGold(to, amount);
    }

    function adjustSupplyInternal() internal {
        uint256 currentGoldPrice = uint256(getGoldPrice());
        require(currentGoldPrice > 0, "Invalid gold price");

        uint256 totalCapitalizationCoinGold = currentGoldPrice * coinGold.totalSupply() / 1e8;

        if (totalCapitalizationCoinGold > totalSupply()) {
            uint256 additionalSupply = uint256(totalCapitalizationCoinGold) - totalSupply();
            _mint(msg.sender, additionalSupply);
        } else if (totalSupply() > 2 * totalCapitalizationCoinGold) {
            uint256 targetSupply = 2 * totalCapitalizationCoinGold;
            uint256 amountToBurn = totalSupply() - targetSupply;

            if (amountToBurn > 0) {
                uint256 maxBurnAmount = (totalSupply() * reserveRatio) / 100;
                amountToBurn = (amountToBurn > maxBurnAmount)
                    ? maxBurnAmount
                    : amountToBurn;

                if (balanceOf(owner) >= amountToBurn) {
                    _burn(owner, amountToBurn);
                }
            }
        }

        lastAdjustmentTimestamp = block.timestamp;
        uint256 newSupply = totalSupply(); 
        emit AdjustSupply(newSupply); 
    }

    function mint(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(msg.sender, amount);
        emit Mint(msg.sender, amount);
    }

    function burn(uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 totalCapitalizationCoinGold = (getGoldPrice()) * coinGold.totalSupply() / 1e8;
        bool isSupplyTooHigh = totalSupply() > 2 * totalCapitalizationCoinGold;
        bool isSupplyTooLow = totalSupply() < totalCapitalizationCoinGold;

        upkeepNeeded = isSupplyTooHigh || isSupplyTooLow;
        return (upkeepNeeded, performData);
    }
    
     function performUpkeep(bytes calldata) external override {
        adjustSupplyInternal();
    }

    function adjustSupply() external onlyRole(ADMIN_ROLE) {
        adjustSupplyInternal();
    }

    function transferCoinDollar(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }

    function grantMinterRoleInCoinGold() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!coinGold.hasRole(coinGold.MINTER_ROLE(), address(this)), "CoinDollar already has MINTER_ROLE in CoinGold");
        coinGold.grantMinterRole(address(this));
    }

    function revokeMinterRoleInCoinGold() public onlyRole(DEFAULT_ADMIN_ROLE) {
        coinGold.revokeMinterRole(address(this));
    } 
}
