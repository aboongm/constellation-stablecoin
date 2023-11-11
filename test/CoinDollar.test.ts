import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

import { CoinGold, CoinDollar, MockChainlinkPriceFeed } from "../typechain-types";

describe("CoinDollar", function () {
  let mockPriceFeed: MockChainlinkPriceFeed;
  let coinDollar: CoinDollar;
  let coinGold: CoinGold;
  let ownerAddress: string;
  // let goldReserveStatement: BigNumberish

  this.beforeEach(async () => {
    ownerAddress = await (await ethers.provider.getSigner(0)).address;

    const MockPriceFeedFactory = await ethers.getContractFactory(
      "MockChainlinkPriceFeed"
    );
    mockPriceFeed = await MockPriceFeedFactory.deploy(2000 * 1e8);
    let goldReserveStatement = BigInt(1000e18);

    const CoinGoldFactory = await ethers.getContractFactory("CoinGold");
    coinGold = await CoinGoldFactory.deploy(
      "CoinGold",
      "CNGD",
      goldReserveStatement,
      mockPriceFeed.target
    );
    
    await coinGold.mintCoinGold(await coinGold.goldAmtReserveStatement())
    
    const CoinDollarFactory = await ethers.getContractFactory("CoinDollar");
    coinDollar = await CoinDollarFactory.deploy(
      "CoinDollar",
      "CNDO",
      coinGold.target,
      mockPriceFeed.target
    );

    await coinDollar.waitForDeployment();
  });

  it("should set the initial values correctly", async () => {
    expect(await coinDollar.name()).to.equal("CoinDollar");
    expect(await coinDollar.symbol()).to.equal("CNDO");
    expect(await coinDollar.coinGold()).to.equal(await coinGold.getAddress());
    
    const price = await mockPriceFeed.latestRoundData()
    expect(await coinDollar.getGoldPrice()).to.equal(await price[1]);
    expect(await coinDollar.owner()).to.equal((await ethers.provider.getSigner(0)).address);
    expect(await coinDollar.reserveRatio()).to.equal(20);
  });

  it("should mint tokens when called by the owner", async () => {
    const mintAmount = ethers.parseEther("0.001"); 
    await coinDollar.connect(await ethers.provider.getSigner(0)).mint(mintAmount);

    // Check the owner's balance after minting
    const ownerBalance = await coinDollar.balanceOf(ownerAddress);
    expect(ownerBalance).to.equal(mintAmount);

    // Verify that the total supply of Xehn tokens has increased
    const totalSupply = await coinDollar.totalSupply();
    expect(totalSupply).to.equal(mintAmount);
  });

  it("should burn tokens when called by the owner", async () => {
    const initialBalance = 1000; // Initial balance for the owner
    await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialBalance);

    const burnAmount = 200; // You can choose the amount to burn
    await coinDollar.connect(await ethers.provider.getSigner(0)).burn(burnAmount);

    const ownerBalance = await coinDollar.balanceOf(ownerAddress);
    expect(ownerBalance).to.equal(initialBalance - burnAmount);

    const totalSupply = await coinDollar.totalSupply();
    expect(totalSupply).to.equal(initialBalance - burnAmount);
  });

  it("should get the gold price from the price feed", async () => {
    const goldPrice = await coinDollar.getGoldPrice();
    expect(goldPrice).to.be.above(0);
  });

  describe("adjustSupply", async () => {
    it("should increase supply when total capitalization of CoinGold is greater CoinDollar supply", async () => {
      const initialSupply = await coinDollar.totalSupply();
      const totalCapitalizationCoinGold = await coinGold.totalCapitalization();
      const usdTotalCapitalization = (totalCapitalizationCoinGold/ BigInt(1e8))
      
      expect(usdTotalCapitalization).to.be.greaterThan(initialSupply);

      await coinDollar.adjustSupply();
      const updatedSupply = await coinDollar.totalSupply()
      expect(updatedSupply).to.be.greaterThan(initialSupply);
      expect(updatedSupply).to.equal(usdTotalCapitalization)
    });
    
    // it("should not change supply when total capitalization is equal", async () => {
    //   const initialGoldPrice = await mockSana.getChainlinkDataFeedLatestAnswer()
    //   const initialCapitalizationSana = await mockSana.totalCapitalization();
    //   await xehn.adjustSupply();
    //   const initialSupplyXehn = await xehn.totalSupply()

    //   // set value of Gold price to lower
    //   await mockPriceFeed.setLatestPrice(1500); 
    //   const currentCapitalization = await mockSana.totalCapitalization()
      
    //   // generate xehn again when the xehn total supply and sana total capitalization are equal
    //   await xehn.adjustSupply();
    //   expect(await xehn.totalSupply()).to.equal(await initialSupplyXehn)
    // });
    
    it("should burn tokens when total supply is greater than 2x total capitalization", async () => {
      const initialGoldPrice = await coinGold.getChainlinkDataFeedLatestAnswer()
      const initialCapitalizationCoinGold = await coinGold.totalCapitalization();
      await coinDollar.adjustSupply();
      const initialSupplyCoinDollar = await coinDollar.totalSupply()

      // set value of Gold price to lower
      await mockPriceFeed.setLatestPrice(900); 
      const currentCapitalization = await coinGold.totalCapitalization()
      
      // burn coindollar
      await coinDollar.adjustSupply()
      expect(await initialSupplyCoinDollar).to.greaterThan(await coinDollar.totalSupply() )
    });
  })

  describe("Ownership test", async () => {
    it("should not allow non-owners to mint tokens", async () => {
      const nonOwner = await ethers.provider.getSigner(1);
      const mintAmount = ethers.parseEther("0.001");
      await expect(coinDollar.connect(nonOwner).mint(mintAmount)).to.be.revertedWith("Only the owner can call this function");
    });
    
    it("should not allow non-owners to burn tokens", async () => {
      const nonOwner = await ethers.provider.getSigner(1);
      const burnAmount = ethers.parseEther("0.001");
      await expect(coinDollar.connect(nonOwner).burn(burnAmount)).to.be.revertedWith("Only the owner can call this function");
    });    
  })

  describe("Reentrant attacks", async () => {
    it("should prevent reentrant attacks", async () => {
      // // Deploy a malicious contract for the attack
      // const maliciousContractFactory = await ethers.getContractFactory("MaliciousContract");
      // const maliciousContract = await maliciousContractFactory.deploy(xehn.address);
    
      // // Prepare the malicious contract to perform a reentrant attack
      // await maliciousContract.prepareReentrantAttack();
    
      // // Call the malicious contract's attack function
      // await maliciousContract.executeReentrantAttack();
    
      // // Check the state of Xehn after the attack
      // const xehnBalance = await xehn.balanceOf(ownerAddress);
      // // Perform assertions to ensure that Xehn's state is not affected by the attack
    });   
  })
  
  describe("Gas consumption", async () => {
    it("should measure the gas consumption of minting tokens", async () => {
      const ownerSigner = await ethers.provider.getSigner(0); 
      const mintAmount = ethers.parseEther("1");
    
      // Measure the gas used when calling the mint function
      const tx = await coinDollar.connect(ownerSigner).mint(mintAmount);
      const receipt = await tx.wait();
      const gasUsed = await receipt?.gasUsed
    
      console.log("Gas used for minting:", gasUsed);
    });
    
    it("should measure the gas consumption of burning tokens", async () => {
      const ownerSigner = await ethers.provider.getSigner(0); 
      const burnAmount = ethers.parseEther("0.5");
    
      // Mint some tokens before burning them
      await coinDollar.connect(ownerSigner).mint(burnAmount);
    
      // Measure the gas used when calling the burn function
      const tx = await coinDollar.connect(ownerSigner).burn(burnAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed
    
      console.log("Gas used for burning:", gasUsed);
    });

    it("should measure the gas consumption of adjustSupply function", async () => {
      const ownerSigner = await ethers.provider.getSigner(0);
      const tx = await coinDollar.adjustSupply();
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed
      console.log("Gas used for adjustSupply:", gasUsed);
    });
  })

  describe("Chainlink Keepers Integration Tests", function () {

    beforeEach(async function () {
      // Deploy MockChainlinkPriceFeed and set an initial valid price
      const MockPriceFeedFactory = await ethers.getContractFactory("MockChainlinkPriceFeed");
      mockPriceFeed = await MockPriceFeedFactory.deploy(2000 * 1e8); // Example: setting initial price as 2000
  });

    it("should trigger upkeep when CoinDollar supply is too low", async function () {
      // Set the gold price to make CoinGold's total capitalization greater than CoinDollar's total supply
      const requiredGoldPrice = await calculateRequiredGoldPriceForSupplyIncrease(coinGold, coinDollar);
      await mockPriceFeed.setLatestPrice(BigInt(requiredGoldPrice) * BigInt(1e8)); 
  
      // Check if upkeep is needed
      const [upkeepNeeded] = await coinDollar.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);
  
      // Perform upkeep and verify supply increases
      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.performUpkeep("0x");
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.above(initialSupply);
    });
  
    /* it("should trigger upkeep when CoinDollar supply is too high", async function () {
      // Set the gold price to make CoinDollar's total supply more than double of CoinGold's total capitalization
      const requiredGoldPrice = await calculateRequiredGoldPriceForSupplyDecrease(coinGold, coinDollar);
      await mockPriceFeed.setLatestPrice(BigInt(requiredGoldPrice) * BigInt(1e8)); 

      // Check if upkeep is needed
      const [upkeepNeeded] = await coinDollar.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);
  
      // Perform upkeep and verify supply decreases
      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.performUpkeep("0x");
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.below(initialSupply);
    }); */

    it("should trigger upkeep when CoinDollar supply is too high", async function () {
      // First, ensure CoinDollar's total supply is more than double the total capitalization of CoinGold
      // This may need to mint CoinDollar tokens or adjust the gold price to achieve this
      // Example: mint a large amount of CoinDollar tokens
      const largeMintAmount = ethers.parseEther("1000000000"); // Large mint amount
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(largeMintAmount);

      // Lower the gold price to ensure the total capitalization of CoinGold is less than half of CoinDollar's supply
      const reducedGoldPrice = BigInt(1000 * 1e8); // Lowered gold price
      await mockPriceFeed.setLatestPrice(reducedGoldPrice);

      // Check if upkeep is needed
      const [upkeepNeeded] = await coinDollar.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);

      // Perform upkeep and verify supply decreases
      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.performUpkeep("0x");
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.below(initialSupply);
  }); 
  
  });
  
  // Helper functions to calculate the required gold price for triggering supply increase or decrease
  async function calculateRequiredGoldPriceForSupplyIncrease(coinGold: CoinGold, coinDollar: CoinDollar) {
    const totalSupplyCoinGold = await coinGold.totalSupply();
    const totalSupplyCoinDollar = await coinDollar.totalSupply();
    // Calculate the gold price required to make CoinGold's capitalization greater than CoinDollar's supply
    return totalSupplyCoinDollar / totalSupplyCoinGold;
  }
  
  async function calculateRequiredGoldPriceForSupplyDecrease(coinGold: CoinGold, coinDollar: CoinDollar) {
    const totalSupplyCoinGold = await coinGold.totalSupply();
    const totalSupplyCoinDollar = await coinDollar.totalSupply();
    // Calculate the gold price required to make CoinDollar's supply more than double of CoinGold's capitalization
    return (totalSupplyCoinDollar / (BigInt(2) * totalSupplyCoinGold));
  }
  
  
});
