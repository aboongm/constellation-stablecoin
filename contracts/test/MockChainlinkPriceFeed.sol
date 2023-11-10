// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockChainlinkPriceFeed {
    int private latestPrice;

    constructor(int _initialPrice) {
        latestPrice = _initialPrice;
    }

    function setLatestPrice(int _price) external {
        latestPrice = _price;
    }

    function latestRoundData() external view returns (int, int, uint, uint, uint) {
        return (0, latestPrice, 0, 0, 0);
    }
}
