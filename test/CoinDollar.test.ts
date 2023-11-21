import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

import { CoinGold, CoinDollar, MockChainlinkPriceFeed } from "../typechain-types";
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

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
      // goldReserveStatement,
      mockPriceFeed.target
    );
    
    // await coinGold.mintCoinGold(await coinGold.goldAmtReserveStatement())
    
    const CoinDollarFactory = await ethers.getContractFactory("CoinDollar");
    coinDollar = await CoinDollarFactory.deploy(
      "CoinDollar",
      "CNDO",
      coinGold.target,
      mockPriceFeed.target
    );

    await coinDollar.waitForDeployment();
    await coinDollar.grantMinterRole(ownerAddress);
    // await coinDollar.grantAdminRole(owner.address);
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
    it("should increase supply when total capitalization of CoinGold is greater than CoinDollar supply", async () => {
      // Mint some CoinDollar tokens to set an initial supply
      const initialMintAmount = ethers.parseEther("0.0001");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);

      const mintAmountCoinGold = 1000000; 
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);
  
      // Adjust CoinGold total supply or mock price feed to ensure capitalization is greater
      // Adjusting CoinGold supply or gold price as needed...
  
      const initialSupply = await coinDollar.totalSupply();
      const totalCapitalizationCoinGold = await coinDollar.getGoldCoinTotalCapitalization();
  
      expect(totalCapitalizationCoinGold).to.be.greaterThan(initialSupply);
  
      await coinDollar.adjustSupply();
      const updatedSupply = await coinDollar.totalSupply();
      expect(updatedSupply).to.be.greaterThan(initialSupply);
    });
  
    it("should burn tokens when total supply is greater than 2x total capitalization of CoinGold", async () => {
      // First, mint a large amount of CoinDollar tokens to ensure its supply is more than double the total capitalization of CoinGold
      const mintAmountCoinDollar = ethers.parseEther("1");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(mintAmountCoinDollar);
  
      const initialSupply = await coinDollar.totalSupply();
  
      await coinDollar.adjustSupply();
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.lessThan(initialSupply);
    });
  
    it("should not change supply if conditions for adjustment are not met", async () => {
      const initialMintAmount = ethers.parseEther("0.0001");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);

      const mintAmountCoinGold = 300; 
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);
      
      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.adjustSupply();
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.equal(initialSupply);
    });

    it("should not change supply when total capitalization is equal to CoinDollar supply", async () => {
      const initialMintAmount = ethers.parseEther("0.0001");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);

      const mintAmountCoinGold = 500; 
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);

      const initialSupply = await coinDollar.totalSupply();
      const totalCapitalizationCoinGold = await coinDollar.getGoldCoinTotalCapitalization();
  
      await coinDollar.adjustSupply();
  
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.equal(initialSupply);
    });

    it("should increase supply at just above the exact threshold for increase", async () => {
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(1000);
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(ethers.parseEther("1"));
    
      const initialSupply = await coinDollar.totalSupply();
      const thresholdPrice = await calculateRequiredGoldPriceForSupplyIncrease(coinGold, coinDollar);
    
      // Increase the gold price slightly above the threshold
      const adjustedPrice = thresholdPrice + BigInt(1);
      await mockPriceFeed.setLatestPrice(adjustedPrice);
      await coinDollar.adjustSupply();
    
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.greaterThan(initialSupply);
    });    
    
    it("should decrease supply at just below the exact threshold for decrease", async () => {
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(1000);
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(ethers.parseEther("10"));
    
      const initialSupply = await coinDollar.totalSupply();
      const thresholdPrice = await calculateRequiredGoldPriceForSupplyDecrease(coinGold, coinDollar);
    
      // Decrease the gold price slightly below the threshold
      const adjustedPrice = thresholdPrice - BigInt(1);
      await mockPriceFeed.setLatestPrice(adjustedPrice);
      await coinDollar.adjustSupply();
    
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.lessThan(initialSupply);
    });
    
  })

  describe("Role-based Access Control Tests", function () {
    it("should only allow MINTER_ROLE to mint tokens", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      const mintAmount = ethers.parseEther("1");
      await coinDollar.revokeRole(MINTER_ROLE, nonMinter.address);
      await expect(
        coinDollar.connect(nonMinter).mintCoinGold(mintAmount)
      ).to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-MINTER_ROLE from minting tokens", async () => {
      const [_, nonMinter] = await ethers.getSigners();
      const mintAmount = ethers.parseUnits("1", 18);
  
      await expect(coinDollar.connect(nonMinter).mint(mintAmount))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });
    
    it("should only allow MINTER_ROLE to burn tokens", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      const burnAmount = ethers.parseEther("10");
      await coinDollar.revokeRole(MINTER_ROLE, nonMinter.address);
      await expect(
        coinDollar.connect(nonMinter).burnCoinGold(burnAmount)
      ).to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });

    it("should prevent non-MINTER_ROLE from burning tokens", async () => {
      const [_, nonMinter] = await ethers.getSigners();
      const burnAmount = ethers.parseUnits("1", 18);
  
      await expect(coinDollar.connect(nonMinter).burn(burnAmount))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });
    
    it("should have correct owner and roles assigned", async () => {
      const contractOwner = await coinDollar.owner();
      expect(contractOwner).to.equal(ownerAddress);
    
      const isOwnerAdmin = await coinDollar.hasRole(ADMIN_ROLE, contractOwner);
      expect(isOwnerAdmin).to.be.true;
    
      const isOwnerMinter = await coinDollar.hasRole(MINTER_ROLE, contractOwner);
      expect(isOwnerMinter).to.be.true;
    });

    it("should correctly grant MINTER_ROLE to an account", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      // Initially, the nonMinter should not have the MINTER_ROLE
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.false;
  
      // Grant MINTER_ROLE to the nonMinter
      await coinDollar.connect(await ethers.provider.getSigner(0)).grantMinterRole(nonMinter.address);
  
      // The nonMinter should now have the MINTER_ROLE
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.true;
    });

    it("should correctly revoke MINTER_ROLE from an account", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      // First, ensure nonMinter has the MINTER_ROLE
      await coinDollar.connect(await ethers.provider.getSigner(0)).grantMinterRole(nonMinter.address);
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.true;
  
      // Now, revoke MINTER_ROLE from the nonMinter
      await coinDollar.connect(await ethers.provider.getSigner(0)).revokeMinterRole(nonMinter.address);
  
      // The nonMinter should no longer have the MINTER_ROLE
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.false;
    });

    it("should allow only ADMIN_ROLE to grant MINTER_ROLE", async () => {
      const [admin, other] = await ethers.getSigners();
      await expect(coinDollar.connect(admin).grantMinterRole(other.address))
        .to.emit(coinDollar, "RoleGranted")
        .withArgs(MINTER_ROLE, other.address, admin.address);
    });
  
    it("should prevent non-ADMIN_ROLE from granting MINTER_ROLE", async () => {
      const [admin, other] = await ethers.getSigners();
      await expect(coinDollar.connect(other).grantMinterRole(admin.address))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });
  
    it("should allow only ADMIN_ROLE to revoke MINTER_ROLE", async () => {
      const [admin, minter] = await ethers.getSigners();
      // Ensure minter has the role first
      await coinDollar.connect(admin).grantMinterRole(minter.address);
      await expect(coinDollar.connect(admin).revokeMinterRole(minter.address))
        .to.emit(coinDollar, "RoleRevoked")
        .withArgs(MINTER_ROLE, minter.address, admin.address);
    });
  
    it("should prevent non-ADMIN_ROLE from revoking MINTER_ROLE", async () => {
      const [admin, minter, other] = await ethers.getSigners();
      // Ensure minter has the role first
      await coinDollar.connect(admin).grantMinterRole(minter.address);
      await expect(coinDollar.connect(other).revokeMinterRole(minter.address))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });

    it("should handle multiple roles per account correctly", async () => {
      const [owner] = await ethers.getSigners();
  
      // Initially, the owner should have both ADMIN_ROLE and MINTER_ROLE
      expect(await coinDollar.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await coinDollar.hasRole(MINTER_ROLE, owner.address)).to.be.true;
  
      // Revoke the MINTER_ROLE and check if ADMIN_ROLE is still intact
      await coinDollar.revokeMinterRole(owner.address);
  
      // The owner should still have ADMIN_ROLE
      expect(await coinDollar.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
  
      // The owner should no longer have MINTER_ROLE
      expect(await coinDollar.hasRole(MINTER_ROLE, owner.address)).to.be.false;
    });

    it("should emit RoleGranted event when a role is granted", async () => {
      const [admin, newMember] = await ethers.getSigners();
      await expect(coinDollar.connect(admin).grantMinterRole(newMember.address))
        .to.emit(coinDollar, "RoleGranted")
        .withArgs(MINTER_ROLE, newMember.address, admin.address);
    });

    it("should emit RoleRevoked event when a role is revoked", async () => {
      const [admin, member] = await ethers.getSigners();
      // First, grant the role
      await coinDollar.connect(admin).grantMinterRole(member.address);
      // Then, revoke the role
      await expect(coinDollar.connect(admin).revokeMinterRole(member.address))
        .to.emit(coinDollar, "RoleRevoked")
        .withArgs(MINTER_ROLE, member.address, admin.address);
    });
    
  });

  /* describe("Ownership test", async () => {
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
  }) */

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
      const mintAmountCoinGold = ethers.parseEther("1");
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);

      // Mint CoinDollar tokens
      const mintAmountCoinDollar = ethers.parseEther("0.5"); // Ensure this amount results in a lower total capitalization
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(mintAmountCoinDollar);
      
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

    it("should trigger upkeep when CoinDollar supply is too high", async function () {
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
