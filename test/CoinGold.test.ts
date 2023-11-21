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
    // await coingold.connect(owner).grantAdminRole(owner.address);
  });

  // Deployment Test:
  it("Deployment Test", async () => {
    // Check if the contract is deployed without errors
    expect(coingold.getAddress()).to.not.equal(0);
  });

  it("Owner Assignment", async () => {
    // Check if the owner is correctly set to the deployer's address
    const owner = await coingold.owner();
    expect(owner).to.equal((await ethers.provider.getSigner(0)).address);
  });

  it("Minting and Burning CoinGold Tokens", async () => {
    // // Mint some CoinGold tokens and check if balances are updated correctly
    const initialBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    // Convert the JavaScript number to a BigNumber representing Ether (assuming ethAmount is in Ether)
    const mintAmount = ethers.parseEther("0.001");
    await coingold.mintCoinGold(mintAmount);
    const updatedBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    expect(updatedBalance).to.equal(initialBalance + mintAmount);

    // Burn some CoinGold tokens and verify total supply decreases
    const burnAmount = ethers.parseEther("0.0005"); // Burning 0.0005 Ether
    await coingold.burnCoinGold(burnAmount);
    const newBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    expect(newBalance).to.equal(updatedBalance - burnAmount);
  });

  

  it("Total Capitalization Calculation", async () => {
    // Call the totalCapitalization function and verify the calculation
    const totalSupply = await coingold.totalSupply();
    const latestGoldPrice = await coingold.getChainlinkDataFeedLatestAnswer();
    const totalCapitalization = await coingold.totalCapitalization();
    expect(totalCapitalization).to.equal(totalSupply * latestGoldPrice);
  });


  // Add new test for mint event
  it("Minting emits Mint event and increases balance", async () => {
    const [owner] = await ethers.getSigners();
    const mintAmount = ethers.parseUnits("1", 18); // Adjust token decimals if necessary

    await expect(coingold.mintCoinGold(mintAmount))
      .to.emit(coingold, "Mint")
      .withArgs(owner.address, mintAmount);

    const updatedBalance = await coingold.balanceOf(owner.address);
    expect(updatedBalance).to.equal(mintAmount);
  });

  // Add new test for burn event
  it("Burning emits Burn event and decreases balance", async () => {
    const [owner] = await ethers.getSigners();
    // Make sure to use the BigNumber type provided by ethers
    const mintAmount = ethers.parseUnits("1", 18); // Mint some tokens first
    await coingold.mintCoinGold(mintAmount);

    const burnAmount = ethers.parseUnits("0.5", 18); // Then burn some of them
    await expect(coingold.burnCoinGold(burnAmount))
      .to.emit(coingold, "Burn")
      .withArgs(owner.address, burnAmount);

    const finalBalance = await coingold.balanceOf(owner.address);
    // Use the BigNumber 'sub' function for subtraction
    expect(finalBalance).to.equal(mintAmount - burnAmount);
  });

  // Test Chainlink Data Feed Integration
  it("Chainlink Data Feed Integration", async () => {
    // Test the getChainlinkDataFeedLatestAnswer function
    const latestGoldPrice = await coingold.getChainlinkDataFeedLatestAnswer();
    expect(latestGoldPrice).to.be.gt(0);
  });

  // Test Error Handling
  it("Error Handling", async () => {
    // Test error scenarios, such as trying to burn more tokens than the balance
    const initialBalance = await coingold.balanceOf(
      (
        await ethers.provider.getSigner(0)
      ).address
    );
    const burnAmount = initialBalance + ethers.parseEther("0.1"); // Attempt to burn more tokens than the balance
    await expect(coingold.burnCoinGold(burnAmount)).to.be.revertedWith(
      "Insufficient CoinGold balance"
    );
  });

  it("Gas Consumption Test for Minting and Burning CoinGold Tokens", async () => {
    // Mint some CoinGold tokens and check if balances are updated correctly
    const mintAmount = ethers.parseEther("0.001");
    const mintTx = await coingold.mintCoinGold(mintAmount);
    const receiptMint = await mintTx.wait(); // Wait for the transaction to be mined

    const burnAmount = ethers.parseEther("0.0005");
    const burnTx = await coingold.burnCoinGold(burnAmount);
    const receiptBurn = await burnTx.wait(); // Wait for the transaction to be mined

    // Get gas consumption information from the transactions
    const mintGasUsed = receiptMint?.gasUsed;
    const burnGasUsed = receiptBurn?.gasUsed;

    // Assert that gas usage is within an acceptable range
    expect(mintGasUsed).to.be.lte(100000); // Set an appropriate limit based on your contract complexity
    expect(burnGasUsed).to.be.lte(100000); // Set an appropriate limit based on your contract complexity
  });

  // These are new tests
  it("should transfer tokens and emit Transfer event on transferCoinGold", async () => {
    const [owner, recipient] = await ethers.getSigners();
    const transferAmount = ethers.parseUnits("5", 18);
  
    // Mint tokens first
    await coingold.connect(owner).mintCoinGold(transferAmount);
  
    // Transfer tokens and expect a Transfer event
    await expect(coingold.connect(owner).transferCoinGold(recipient.address, transferAmount))
      .to.emit(coingold, "Transfer")
      .withArgs(owner.address, recipient.address, transferAmount);
  
    const recipientBalance = await coingold.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(transferAmount);
  });

  it("should revert when transferring tokens to a zero address", async () => {
    const [owner] = await ethers.getSigners();
    const transferAmount = ethers.parseUnits("1", 18);

    // Mint tokens first
    await coingold.connect(owner).mintCoinGold(transferAmount);

    // Attempt to transfer to a zero address
    await expect(coingold.connect(owner).transferCoinGold("0x0000000000000000000000000000000000000000", transferAmount))
      .to.be.revertedWithCustomError(coingold, "ERC20InvalidReceiver");
  });

  it("should revert when transferring more tokens than the balance", async () => {
    const [owner, recipient] = await ethers.getSigners();
    const transferAmount = ethers.parseUnits("1", 18);

    // Attempt to transfer more tokens than balance (without minting first)
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
    
    it("should allow only ADMIN_ROLE to set coinDollar address", async () => {
      const nonAdmin = (await ethers.getSigners())[1];
      const newAddress = ethers.Wallet.createRandom().address;
      await coingold.connect(owner).revokeRole(ADMIN_ROLE, nonAdmin.address);
    
      await expect(
        coingold.connect(nonAdmin).setCoinDollarAddress(newAddress)
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
    
      // Grant a role to a non-owner account and check if the role is correctly assigned
      await coingold.connect(owner).grantRole(MINTER_ROLE, nonOwnerAddress);
      expect(await coingold.hasRole(MINTER_ROLE, nonOwnerAddress)).to.be.true;
    
      // Revoke the role and check if it is correctly removed
      await coingold.connect(owner).revokeRole(MINTER_ROLE, nonOwnerAddress);
      expect(await coingold.hasRole(MINTER_ROLE, nonOwnerAddress)).to.be.false;
    });
    
    it("should handle multiple roles per account correctly", async () => {
      const multiRoleUser = (await ethers.getSigners())[1];
      const multiRoleUserAddress = await multiRoleUser.getAddress();
    
      // Grant both MINTER_ROLE and ADMIN_ROLE to the same account
      await coingold.connect(owner).grantRole(MINTER_ROLE, multiRoleUserAddress);
      await coingold.connect(owner).grantRole(ADMIN_ROLE, multiRoleUserAddress);
    
      // Check if the account has both roles
      const hasMinterRole = await coingold.hasRole(MINTER_ROLE, multiRoleUserAddress);
      const hasAdminRole = await coingold.hasRole(ADMIN_ROLE, multiRoleUserAddress);
      expect(hasMinterRole && hasAdminRole).to.be.true;
    
      // Revoke one role and check if the other is still intact
      await coingold.connect(owner).revokeRole(MINTER_ROLE, multiRoleUserAddress);
      expect(await coingold.hasRole(ADMIN_ROLE, multiRoleUserAddress)).to.be.true;
    });
    
    it("should not revert when granting or revoking a non-existent role", async () => {
      const nonExistentRole = ethers.id("NON_EXISTENT_ROLE");
      const randomAccount = (await ethers.getSigners())[1];
    
      // Grant a non-existent role
      await expect(
        coingold.connect(owner).grantRole(nonExistentRole, randomAccount.getAddress())
      ).not.to.be.reverted;
    
      // Revoke a non-existent role
      await expect(
        coingold.connect(owner).revokeRole(nonExistentRole, randomAccount.getAddress())
      ).not.to.be.reverted;
    });

    it("should emit events on role changes", async () => {
      const newMinter = (await ethers.getSigners())[1];
      const newMinterAddress = await newMinter.getAddress();
    
      // Expect RoleGranted event on granting a role
      await expect(coingold.connect(owner).grantRole(MINTER_ROLE, newMinterAddress))
        .to.emit(coingold, "RoleGranted")
        .withArgs(MINTER_ROLE, newMinterAddress, await owner.getAddress());
    
      // Expect RoleRevoked event on revoking a role
      await expect(coingold.connect(owner).revokeRole(MINTER_ROLE, newMinterAddress))
        .to.emit(coingold, "RoleRevoked")
        .withArgs(MINTER_ROLE, newMinterAddress, await owner.getAddress());
    });

    it("should allow MINTER_ROLE to transfer tokens using transferFromUser", async () => {
      const [owner, user, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseUnits("10", 18);
    
      // Mint tokens to the user first
      await coingold.connect(owner).mintCoinGold(transferAmount);
      await coingold.connect(owner).transferCoinGold(user.address, transferAmount);
    
      // Transfer tokens from user to recipient by the owner (who has MINTER_ROLE)
      await expect(coingold.connect(owner).transferFromUser(user.address, recipient.address, transferAmount))
        .to.emit(coingold, "Transfer")
        .withArgs(user.address, recipient.address, transferAmount);
    
      const recipientBalance = await coingold.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(transferAmount);
    });

    it("should not allow non-MINTER_ROLE to use transferFromUser", async () => {
      const [, user, nonMinter, recipient] = await ethers.getSigners();
      const transferAmount = ethers.parseUnits("5", 18);
  
      // Attempt to transfer tokens by a non-minter
      await expect(coingold.connect(nonMinter).transferFromUser(user.address, recipient.address, transferAmount))
        .to.be.revertedWithCustomError(coingold, "AccessControlUnauthorizedAccount")
        .withArgs(nonMinter.address, MINTER_ROLE);
    });

  });
  
  describe("Edge cases test", async () => {
    // Test for minting zero tokens
    it("should revert when minting zero tokens", async () => {
      await expect(coingold.mintCoinGold(0)).to.be.revertedWith(
        "Mint amount must be greater than zero"
      );
    });

    // Test for burning zero tokens
    it("should revert when burning zero tokens", async () => {
      await expect(coingold.burnCoinGold(0)).to.be.revertedWith(
        "Burn amount must be greater than zero"
      );
    });

    // Test for handling invalid data from Chainlink Price Feed
    it("should handle invalid data from Chainlink Price Feed", async () => {
      // Set an invalid price in the mock
      await mockPriceFeed.setLatestPrice(-1);

      // Call the totalCapitalization function and expect it to revert
      await expect(coingold.totalCapitalization()).to.be.revertedWith(
        "Invalid gold price"
      );
    });
  });

  // Add more test cases for different scenarios as needed
  // Ensure you cover other functions, contract interactions, edge cases, upgradeability, and random testing
  // Upgradeability: If applicable, test the upgrade process
  // Random Testing: Perform random testing to ensure the contract handles various inputs and scenarios
});
