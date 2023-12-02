import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, toBigInt } from "ethers";
import {
  CoinGold,
  MockChainlinkPriceFeed,
} from "../typechain-types";
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

describe("CoinGold", function () {
  let name: string;
  let symbol: string;
  let mockPriceFeed: MockChainlinkPriceFeed;
  let coingold: CoinGold;
  let owner: Signer;
  let user: Signer;

  this.beforeEach(async () => {
    name = "CoinGold Token";
    symbol = "CNGD";
    [owner, user] = await ethers.getSigners();

    const MockPriceFeedFactory = await ethers.getContractFactory(
      "MockChainlinkPriceFeed"
    );
    mockPriceFeed = await MockPriceFeedFactory.deploy(2000);

    const CoinGoldFactory = await ethers.getContractFactory("CoinGold");
    coingold = await CoinGoldFactory.deploy(
      name,
      symbol,
      mockPriceFeed.target
    );

    await coingold.waitForDeployment();
    await coingold.connect(owner).grantMinterRole(owner.getAddress());
  });

  it("Deployment Test", async () => {
    expect(coingold.getAddress()).to.not.equal(0);
  });

  it("Owner Assignment", async () => {
    const owner = await coingold.owner();
    expect(owner).to.equal((await ethers.provider.getSigner(0)).address);
  });

  it("Minting and Burning CoinGold Tokens", async () => {
    const initialBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    const mintAmount = ethers.parseEther("0.001");
    
    await coingold.mintCoinGold(mintAmount);
    const updatedBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    expect(updatedBalance).to.equal(initialBalance + mintAmount);

    const burnAmount = ethers.parseEther("0.0005"); 
    await coingold.burnCoinGold(burnAmount);
    const newBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    expect(newBalance).to.equal(updatedBalance - burnAmount);
  });

  it("Total Capitalization Calculation", async () => {
    const totalSupply = await coingold.totalSupply();
    const latestGoldPrice = await coingold.getChainlinkDataFeedLatestAnswer();
    const goldPriceInTokenDecimals = latestGoldPrice * (ethers.parseUnits("1", 10)); 
    const expectedTotalCapitalization = totalSupply * (goldPriceInTokenDecimals) / (ethers.parseUnits("1", 18));
    const actualTotalCapitalization = await coingold.totalCapitalization();
    expect(actualTotalCapitalization.toString()).to.equal(expectedTotalCapitalization.toString());
  });
  
  it("Minting emits Mint event and increases balance", async () => {
    const ownerAddress = await owner.getAddress();
    const initialBalance = await coingold.balanceOf(ownerAddress);
    const mintAmount = ethers.parseUnits("1", 18);
  
    await expect(coingold.connect(owner).mintCoinGold(mintAmount))
      .to.emit(coingold, "Mint")
      .withArgs(ownerAddress, mintAmount);
  
    const updatedBalance = await coingold.balanceOf(ownerAddress);
    expect(updatedBalance).to.equal(initialBalance + mintAmount);
  });
  
  it("Burning emits Burn event and decreases balance", async () => {
    const ownerAddress = await owner.getAddress();
    const mintAmount = ethers.parseUnits("1", 18);
    await coingold.connect(owner).mintCoinGold(mintAmount);
  
    const initialBalance = await coingold.balanceOf(ownerAddress);
    const burnAmount = ethers.parseUnits("0.5", 18);
  
    await expect(coingold.connect(owner).burnCoinGold(burnAmount))
      .to.emit(coingold, "Burn")
      .withArgs(ownerAddress, burnAmount);
  
    const finalBalance = await coingold.balanceOf(ownerAddress);
    expect(finalBalance).to.equal(initialBalance - burnAmount);
  });
  
  it("Chainlink Data Feed Integration", async () => {
    const latestGoldPrice = await coingold.getChainlinkDataFeedLatestAnswer();
    expect(latestGoldPrice).to.be.gt(0);
  });

  it("Error Handling", async () => {
    const initialBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    const burnAmount = initialBalance + ethers.parseEther("0.1"); 
    await expect(coingold.burnCoinGold(burnAmount)).to.be.revertedWith(
      "Insufficient CoinGold balance"
    );
  });

  it("Gas Consumption Test for Minting and Burning CoinGold Tokens", async () => {
    const mintAmount = ethers.parseEther("0.001");
    const mintTx = await coingold.mintCoinGold(mintAmount);
    const receiptMint = await mintTx.wait(); 
    const burnAmount = ethers.parseEther("0.0005");
    const burnTx = await coingold.burnCoinGold(burnAmount);
    const receiptBurn = await burnTx.wait(); 

    const mintGasUsed = receiptMint?.gasUsed;
    const burnGasUsed = receiptBurn?.gasUsed;

    expect(mintGasUsed).to.be.lte(100000); 
    expect(burnGasUsed).to.be.lte(100000); 
  });

  it("should transfer tokens and emit Transfer event on transferCoinGold", async () => {
    const [owner, recipient] = await ethers.getSigners();
    const transferAmount = ethers.parseUnits("5", 18);
  
    await coingold.connect(owner).mintCoinGold(transferAmount);
  
    await expect(coingold.connect(owner).transferCoinGold(recipient.address, transferAmount))
      .to.emit(coingold, "Transfer")
      .withArgs(owner.address, recipient.address, transferAmount);
  
    const recipientBalance = await coingold.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(transferAmount);
  });

  it("should revert when transferring tokens to a zero address", async () => {
    const [owner] = await ethers.getSigners();
    const transferAmount = ethers.parseUnits("1", 18);

    await coingold.connect(owner).mintCoinGold(transferAmount);

    await expect(coingold.connect(owner).transferCoinGold("0x0000000000000000000000000000000000000000", transferAmount))
      .to.be.revertedWithCustomError(coingold, "ERC20InvalidReceiver");
  });

  it("should revert when transferring more tokens than the balance", async () => {
    const [owner, recipient] = await ethers.getSigners();
    const initialBalance = await coingold.balanceOf(owner.address);
    const transferAmount = initialBalance + (ethers.parseUnits("1", 18)); 
  
    await expect(coingold.connect(owner).transferCoinGold(recipient.address, transferAmount))
      .to.be.revertedWithCustomError(coingold, "ERC20InsufficientBalance");
  });
  
  describe("Role-based Access Control Tests", function () {
    it("should only allow MINTER_ROLE to mint tokens", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      const mintAmount = ethers.parseEther("1");
      await coingold.connect(owner).revokeRole(MINTER_ROLE, nonMinter.address);
      await expect(
        coingold.connect(nonMinter).mintCoinGold(mintAmount)
      ).to.be.revertedWithCustomError(coingold, "AccessControlUnauthorizedAccount");
    });
    
    it("should only allow MINTER_ROLE to burn tokens", async () => {
      const nonMinter = await ethers.provider.getSigner(1);
      const burnAmount = ethers.parseEther("10");
      await coingold.connect(owner).revokeRole(MINTER_ROLE, nonMinter.address);
      await expect(
        coingold.connect(nonMinter).burnCoinGold(burnAmount)
      ).to.be.revertedWithCustomError(coingold, "AccessControlUnauthorizedAccount");
    });
    
    it("should have correct owner and roles assigned", async () => {
      const contractOwner = await coingold.owner();
      expect(contractOwner).to.equal(await owner.getAddress());
    
      const isOwnerAdmin = await coingold.hasRole(ADMIN_ROLE, contractOwner);
      expect(isOwnerAdmin).to.be.true;
    
      const isOwnerMinter = await coingold.hasRole(MINTER_ROLE, contractOwner);
      expect(isOwnerMinter).to.be.true;
    });
    
    it("should correctly assign and revoke a role", async () => {
      const nonOwner = (await ethers.getSigners())[1];
      const nonOwnerAddress = await nonOwner.getAddress();
    
      await coingold.connect(owner).grantRole(MINTER_ROLE, nonOwnerAddress);
      expect(await coingold.hasRole(MINTER_ROLE, nonOwnerAddress)).to.be.true;
    
      await coingold.connect(owner).revokeRole(MINTER_ROLE, nonOwnerAddress);
      expect(await coingold.hasRole(MINTER_ROLE, nonOwnerAddress)).to.be.false;
    });
    
    it("should handle multiple roles per account correctly", async () => {
      const multiRoleUser = (await ethers.getSigners())[1];
      const multiRoleUserAddress = await multiRoleUser.getAddress();
    
      await coingold.connect(owner).grantRole(MINTER_ROLE, multiRoleUserAddress);
      await coingold.connect(owner).grantRole(ADMIN_ROLE, multiRoleUserAddress);
    
      const hasMinterRole = await coingold.hasRole(MINTER_ROLE, multiRoleUserAddress);
      const hasAdminRole = await coingold.hasRole(ADMIN_ROLE, multiRoleUserAddress);
      expect(hasMinterRole && hasAdminRole).to.be.true;
    
      await coingold.connect(owner).revokeRole(MINTER_ROLE, multiRoleUserAddress);
      expect(await coingold.hasRole(ADMIN_ROLE, multiRoleUserAddress)).to.be.true;
    });
    
    it("should not revert when granting or revoking a non-existent role", async () => {
      const nonExistentRole = ethers.id("NON_EXISTENT_ROLE");
      const randomAccount = (await ethers.getSigners())[1];
    
      await expect(
        coingold.connect(owner).grantRole(nonExistentRole, randomAccount.getAddress())
      ).not.to.be.reverted;
    
      await expect(
        coingold.connect(owner).revokeRole(nonExistentRole, randomAccount.getAddress())
      ).not.to.be.reverted;
    });

    it("should emit events on role changes", async () => {
      const newMinter = (await ethers.getSigners())[1];
      const newMinterAddress = await newMinter.getAddress();
    
      await expect(coingold.connect(owner).grantRole(MINTER_ROLE, newMinterAddress))
        .to.emit(coingold, "RoleGranted")
        .withArgs(MINTER_ROLE, newMinterAddress, await owner.getAddress());
    
      await expect(coingold.connect(owner).revokeRole(MINTER_ROLE, newMinterAddress))
        .to.emit(coingold, "RoleRevoked")
        .withArgs(MINTER_ROLE, newMinterAddress, await owner.getAddress());
    });

    it("should allow MINTER_ROLE to transfer tokens using transferFromUser", async () => {
      const [owner, user, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseUnits("10", 18);
    
      await coingold.connect(owner).mintCoinGold(transferAmount);
      await coingold.connect(owner).transferCoinGold(user.address, transferAmount);
    
      await expect(coingold.connect(owner).transferFromUser(user.address, recipient.address, transferAmount))
        .to.emit(coingold, "Transfer")
        .withArgs(user.address, recipient.address, transferAmount);
    
      const recipientBalance = await coingold.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(transferAmount);
    });

    it("should not allow non-MINTER_ROLE to use transferFromUser", async () => {
      const [, user, nonMinter, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseUnits("5", 18);
  
      await expect(coingold.connect(nonMinter).transferFromUser(user.address, recipient.address, transferAmount))
        .to.be.revertedWithCustomError(coingold, "AccessControlUnauthorizedAccount")
        .withArgs(nonMinter.address, MINTER_ROLE);
    });

  });
  
  describe("Edge cases test", async () => {
    it("should revert when minting zero tokens", async () => {
      await expect(coingold.mintCoinGold(0)).to.be.revertedWith(
        "Mint amount must be greater than zero"
      );
    });

    it("should revert when burning zero tokens", async () => {
      await expect(coingold.burnCoinGold(0)).to.be.revertedWith(
        "Burn amount must be greater than zero"
      );
    });

    it("should handle invalid data from Chainlink Price Feed", async () => {
      await mockPriceFeed.setLatestPrice(-1);

      await expect(coingold.totalCapitalization()).to.be.revertedWith(
        "Invalid gold price"
      );
    });
  });
});
