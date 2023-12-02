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
      mockPriceFeed.target
    );
    
    const CoinDollarFactory = await ethers.getContractFactory("CoinDollar");
    coinDollar = await CoinDollarFactory.deploy(
      "CoinDollar",
      "CNDO",
      coinGold.target,
      mockPriceFeed.target
    );

    await coinDollar.waitForDeployment();
    await coinDollar.grantMinterRole(ownerAddress);
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

    const ownerBalance = await coinDollar.balanceOf(ownerAddress);
    expect(ownerBalance).to.equal(mintAmount);

    const totalSupply = await coinDollar.totalSupply();
    expect(totalSupply).to.equal(mintAmount);
  });

  it("should burn tokens when called by the owner", async () => {
    const initialBalance = 1000; 
    await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialBalance);

    const burnAmount = 200; 
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

  it("should emit a Mint event when tokens are minted", async () => {
    const mintAmount = ethers.parseEther("0.001");
    await expect(coinDollar.connect(await ethers.provider.getSigner(0)).mint(mintAmount))
      .to.emit(coinDollar, "Mint")
      .withArgs(ownerAddress, mintAmount);
  });

  it("should emit a Burn event when tokens are burned", async () => {
    const initialBalance = 1000;
    await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialBalance);
  
    const burnAmount = 200;
    await expect(coinDollar.connect(await ethers.provider.getSigner(0)).burn(burnAmount))
      .to.emit(coinDollar, "Burn")
      .withArgs(ownerAddress, burnAmount);
  });
  
  describe("adjustSupply", async () => {
    it("should increase supply when total capitalization of CoinGold is greater than CoinDollar supply", async () => {
      const initialMintAmount = ethers.parseEther("0.0001");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);

      const mintAmountCoinGold = 1000000000000; 
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);
  
      const initialSupply = await coinDollar.totalSupply();
      const totalCapitalizationCoinGold = await coinDollar.getGoldCoinTotalCapitalization();
  
      expect(totalCapitalizationCoinGold).to.be.greaterThan(initialSupply);
  
      await coinDollar.adjustSupply();
      const updatedSupply = await coinDollar.totalSupply();
      expect(updatedSupply).to.be.greaterThan(initialSupply);
    });
  
    it("should burn tokens when total supply is greater than 2x total capitalization of CoinGold", async () => {
      const initialMintAmount = ethers.parseEther("1000"); 
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);
    
      const lowGoldPrice = ethers.parseUnits("1", "wei"); 
      await mockPriceFeed.setLatestPrice(lowGoldPrice);
    
      const initialSupply = await coinDollar.totalSupply();
    
      await coinDollar.adjustSupply();
    
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.below(initialSupply);
    });
    
    it("should not change supply when total capitalization is equal to CoinDollar supply", async () => {
      const initialMintAmount = ethers.parseEther("100000000");
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(initialMintAmount);

      const initialSupply = await coinDollar.totalSupply();
      const totalCapitalizationCoinGold = await coinDollar.getGoldCoinTotalCapitalization();
  
      await coinDollar.adjustSupply();
  
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.equal(initialSupply);
    });

    it("should increase supply at just above the exact threshold for increase", async () => {
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(500 * 1e8);
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(ethers.parseEther("0.0001"));
    
      const initialSupply = await coinDollar.totalSupply();
      const thresholdPrice = await calculateRequiredGoldPriceForSupplyIncrease(coinGold, coinDollar);
    
      const adjustedPrice = thresholdPrice + BigInt(1);
      await mockPriceFeed.setLatestPrice(adjustedPrice * BigInt(1e8));
      await coinDollar.adjustSupply();
    
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.greaterThan(initialSupply);
    });    
    
    it("should decrease supply at just below the exact threshold for decrease", async () => {
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(ethers.parseEther("2000000"));
    
      const initialSupply = await coinDollar.totalSupply();
      const thresholdPrice = await calculateRequiredGoldPriceForSupplyDecrease(coinGold, coinDollar);
    
      const adjustedPrice = thresholdPrice - BigInt(1);
      await mockPriceFeed.setLatestPrice(adjustedPrice * BigInt(1e8));
      await coinDollar.adjustSupply();
    
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.lessThan(initialSupply);
    });

    it("should emit an AdjustSupply event when conditions are met", async () => {
      const [owner] = await ethers.getSigners();
    
      const currentGoldPrice = await coinDollar.getGoldPrice();
      const totalCapitalizationCoinGold = currentGoldPrice / BigInt(1e8) * await coinGold.totalSupply();
    
      const initialSupply = await coinDollar.totalSupply();
      expect(initialSupply).to.be.lessThan(totalCapitalizationCoinGold);
    
      const expectedNewSupply = totalCapitalizationCoinGold;
    
      await expect(coinDollar.connect(owner).adjustSupply())
        .to.emit(coinDollar, "AdjustSupply")
        .withArgs(expectedNewSupply);
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
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.false;
  
      await coinDollar.connect(await ethers.provider.getSigner(0)).grantMinterRole(nonMinter.address);
  
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.true;
    });

    it("should correctly revoke MINTER_ROLE from an account", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      await coinDollar.connect(await ethers.provider.getSigner(0)).grantMinterRole(nonMinter.address);
      expect(await coinDollar.hasRole(MINTER_ROLE, nonMinter.address)).to.be.true;
  
      await coinDollar.connect(await ethers.provider.getSigner(0)).revokeMinterRole(nonMinter.address);
  
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
      await coinDollar.connect(admin).grantMinterRole(minter.address);
      await expect(coinDollar.connect(admin).revokeMinterRole(minter.address))
        .to.emit(coinDollar, "RoleRevoked")
        .withArgs(MINTER_ROLE, minter.address, admin.address);
    });
  
    it("should prevent non-ADMIN_ROLE from revoking MINTER_ROLE", async () => {
      const [admin, minter, other] = await ethers.getSigners();
      await coinDollar.connect(admin).grantMinterRole(minter.address);
      await expect(coinDollar.connect(other).revokeMinterRole(minter.address))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    });

    it("should handle multiple roles per account correctly", async () => {
      const [owner] = await ethers.getSigners();
  
      expect(await coinDollar.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await coinDollar.hasRole(MINTER_ROLE, owner.address)).to.be.true;
  
      await coinDollar.revokeMinterRole(owner.address);
  
      expect(await coinDollar.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
  
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
      await coinDollar.connect(admin).grantMinterRole(member.address);
      await expect(coinDollar.connect(admin).revokeMinterRole(member.address))
        .to.emit(coinDollar, "RoleRevoked")
        .withArgs(MINTER_ROLE, member.address, admin.address);
    });

    it("should handle transferring roles between accounts", async () => {
      const [admin, oldAccount, newAccount] = await ethers.getSigners();
    
      await coinDollar.grantMinterRole(oldAccount.address);
      expect(await coinDollar.hasRole(MINTER_ROLE, oldAccount.address)).to.be.true;
    
      await coinDollar.revokeMinterRole(oldAccount.address);
      await coinDollar.grantMinterRole(newAccount.address);
    
      expect(await coinDollar.hasRole(MINTER_ROLE, oldAccount.address)).to.be.false;
    
      expect(await coinDollar.hasRole(MINTER_ROLE, newAccount.address)).to.be.true;
    
      const mintAmount = ethers.parseEther("1");
      await expect(coinDollar.connect(oldAccount).mint(mintAmount))
        .to.be.revertedWithCustomError(coinDollar, "AccessControlUnauthorizedAccount");
    
      await expect(coinDollar.connect(newAccount).mint(mintAmount))
        .not.to.be.reverted;
    });
  });

  describe("Gas consumption", async () => {
    it("should measure the gas consumption of minting tokens", async () => {
      const ownerSigner = await ethers.provider.getSigner(0); 
      const mintAmount = ethers.parseEther("1");
    
      const tx = await coinDollar.connect(ownerSigner).mint(mintAmount);
      const receipt = await tx.wait();
      const gasUsed = await receipt?.gasUsed
    
      console.log("Gas used for minting:", gasUsed);
    });
    
    it("should measure the gas consumption of burning tokens", async () => {
      const ownerSigner = await ethers.provider.getSigner(0); 
      const burnAmount = ethers.parseEther("0.5");
    
      await coinDollar.connect(ownerSigner).mint(burnAmount);
    
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
      const MockPriceFeedFactory = await ethers.getContractFactory("MockChainlinkPriceFeed");
      mockPriceFeed = await MockPriceFeedFactory.deploy(2000 * 1e8); 
  });

    it("should trigger upkeep when CoinDollar supply is too low", async function () {
      const mintAmountCoinGold = ethers.parseEther("1");
      await coinGold.connect(await ethers.provider.getSigner(0)).mintCoinGold(mintAmountCoinGold);

      const mintAmountCoinDollar = ethers.parseEther("0.5"); 
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(mintAmountCoinDollar);
      
      const requiredGoldPrice = await calculateRequiredGoldPriceForSupplyIncrease(coinGold, coinDollar);
      await mockPriceFeed.setLatestPrice(BigInt(requiredGoldPrice) * BigInt(1e8)); 
  
      const [upkeepNeeded] = await coinDollar.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);
  
      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.performUpkeep("0x");
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.above(initialSupply);
    });

    it("should trigger upkeep when CoinDollar supply is too high", async function () {
      const largeMintAmount = ethers.parseEther("1000000000"); 
      await coinDollar.connect(await ethers.provider.getSigner(0)).mint(largeMintAmount);

      const reducedGoldPrice = BigInt(1000 * 1e8); 
      await mockPriceFeed.setLatestPrice(reducedGoldPrice);

      const [upkeepNeeded] = await coinDollar.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(true);

      const initialSupply = await coinDollar.totalSupply();
      await coinDollar.performUpkeep("0x");
      const newSupply = await coinDollar.totalSupply();
      expect(newSupply).to.be.below(initialSupply);
  }); 
  });
  
  async function calculateRequiredGoldPriceForSupplyIncrease(coinGold: CoinGold, coinDollar: CoinDollar) {
    const totalSupplyCoinGold = await coinGold.totalSupply();
    const totalSupplyCoinDollar = await coinDollar.totalSupply();
    return totalSupplyCoinDollar / totalSupplyCoinGold;
  }
  
  async function calculateRequiredGoldPriceForSupplyDecrease(coinGold: CoinGold, coinDollar: CoinDollar) {
    const totalSupplyCoinGold = await coinGold.totalSupply();
    const totalSupplyCoinDollar = await coinDollar.totalSupply();
    return (totalSupplyCoinDollar / (BigInt(2) * totalSupplyCoinGold));
  }
});
