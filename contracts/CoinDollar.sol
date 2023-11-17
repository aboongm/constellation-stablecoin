// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CoinGold} from "./CoinGold.sol"; // Import the CoinGold token contract
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CoinDollar is ERC20, AutomationCompatibleInterface, AccessControl {
    CoinGold public coinGold; // Reference to the CoinGold token contract
    AggregatorV3Interface internal goldPriceFeed; // Chainlink Aggregator for XAU/USD
    address public owner;
    uint256 public lastAdjustmentTimestamp;
    uint256 public reserveRatio; // Reserve ratio in percentage (60% reserve)
    uint256 public maximumBackingValue; // 100% USD value of CoinGold
    uint256 public minimumBackingValue; // 50% USD value of CoinGold

    // int256 public lastGoldPrice;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");



    // event ExchangeGoldToDollar(address indexed from, uint256 amount);

    /* modifier onlyCoinGold() {
        require(msg.sender == address(coinGold), "Caller is not CoinGold");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }  */

    constructor(
        string memory name,
        string memory symbol,
        address _coinGoldAddress,
        address _goldPriceFeed
    ) ERC20(name, symbol) {
        owner = msg.sender;
        coinGold = CoinGold(_coinGoldAddress);

        // coinGold.grantMinterRole(address(this));

        goldPriceFeed = AggregatorV3Interface(_goldPriceFeed);
        lastAdjustmentTimestamp = block.timestamp;
        reserveRatio = 20; // 20% reserve
        maximumBackingValue = coinGold.totalCapitalization();
        minimumBackingValue = maximumBackingValue / 2;

        // lastGoldPrice = uint256(getGoldPrice());

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); 

        // coinGold.grantMinterRole(address(this));

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

    function mintCoinGold(uint256 gramsOfGold) public {
        coinGold.mintCoinGold(gramsOfGold);
    }

    function burnCoinGold(uint256 amount) public {
        coinGold.burnCoinGold(amount);
    }

    function transferCoinGold(address to, uint256 amount) public {
        coinGold.transferCoinGold(to, amount);
    }


   function adjustSupplyInternal() internal {
        // Calculate the change in the value of gold and adjust supply accordingly
        uint256 currentGoldPrice = uint256(getGoldPrice());
        require(currentGoldPrice > 0, "Invalid gold price");

        uint256 totalCapitalizationCoinGold = (getGoldPrice() / 1e8) * coinGold.totalSupply();

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

    // CoinDollar public coinDollar;

    /* function setCoinGoldContract(address _coinGold) external onlyOwner {
        coinGoldContract = _coinGold;
    } */

    /* function mintFromCoinGold(
        address to,
        uint256 amount
    ) external onlyCoinGold {
        _mint(to, amount);
    } */

    /* function setCoinDollarContract(address _coinDollar) external onlyOwner {
        coinDollar = CoinDollar(_coinDollar);
    } */ 
    

    /* function exchangeGoldToDollar(uint256 coinGoldAmount) public {
        require(coinGold.balanceOf(msg.sender) >= coinGoldAmount, "Insufficient CoinGold balance");

        // Transfer CoinGold from the user to this contract
        coinGold.transferFromUser(msg.sender, address(this), coinGoldAmount);

        // Calculate the equivalent amount of CoinDollar
        uint256 coinDollarAmount = calculateCoinDollarAmount(coinGoldAmount);

        // Transfer CoinDollar to the user
        transfer(msg.sender, coinDollarAmount);

        emit ExchangeGoldToDollar(msg.sender, coinGoldAmount);
    }

    // Function to calculate the amount of CoinDollar based on the amount of CoinGold
    function calculateCoinDollarAmount(uint256 coinGoldAmount) private view returns (uint256) {
        (, int256 goldPrice, , , ) = goldPriceFeed.latestRoundData();
        require(goldPrice > 0, "Invalid gold price"); 

        // Example calculation: You might need to adjust the formula based on your tokenomics
        uint256 coinDollarAmount = (coinGoldAmount * uint256(goldPrice)) / 1e8;
        return coinDollarAmount;
    } */

    function mint(uint256 amount) external onlyRole(MINTER_ROLE) {
        // Mint function for CoinDollar
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) external onlyRole(MINTER_ROLE) {
        // Burn function for CoinDollar
        _burn(msg.sender, amount);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 totalCapitalizationCoinGold = (getGoldPrice() / 1e8) * coinGold.totalSupply();
        bool isSupplyTooHigh = totalSupply() > 2 * totalCapitalizationCoinGold;
        bool isSupplyTooLow = totalSupply() < totalCapitalizationCoinGold;

        upkeepNeeded = isSupplyTooHigh || isSupplyTooLow;
        return (upkeepNeeded, performData);
    }
    
     function performUpkeep(bytes calldata) external override {
        adjustSupplyInternal();
    }

    // Change visibility of adjustSupply to internal and rename to avoid conflict with performUpkeep
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

        // Grant MINTER_ROLE to this contract (CoinDollar) in CoinGold
        coinGold.grantMinterRole(address(this));
    }

    function revokeMinterRoleInCoinGold() public onlyRole(DEFAULT_ADMIN_ROLE) {
        coinGold.revokeMinterRole(address(this));
    } 
}
