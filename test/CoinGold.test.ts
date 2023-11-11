import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { CoinGold, MockChainlinkPriceFeed, CoinDollar } from "../typechain-types";

describe("CoinGold", function () {
    let name: string;
    let symbol: string;
    let goldReserveStatement: number;
    let mockPriceFeed: MockChainlinkPriceFeed;
    let coingold: CoinGold;
    let coindollar: CoinDollar
    let owner: Signer;
    let user: Signer;


    this.beforeEach(async () => {
        name = "CoinGold Token"
        symbol = "CNGD"
        goldReserveStatement = 100000;
        [owner, user] = await ethers.getSigners();

        const MockPriceFeedFactory = await ethers.getContractFactory("MockChainlinkPriceFeed"); 
        mockPriceFeed = await MockPriceFeedFactory.deploy(2000);

        const CoinGoldFactory = await ethers.getContractFactory("CoinGold");
        coingold = await CoinGoldFactory.deploy(name, symbol, goldReserveStatement, mockPriceFeed.target);
        
        await coingold.waitForDeployment();

        // Deploy CoinDollar contract
        const CoinDollarFactory = await ethers.getContractFactory("CoinDollar");
        coindollar = await CoinDollarFactory.deploy("CoinDollar", "CNDO", coingold.target, mockPriceFeed.target);

        // Set CoinDollar contract in CoinGold
        await coingold.setCoinDollarContract(coindollar.target);
    })
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
        const initialBalance = await coingold.balanceOf((await ethers.provider.getSigner(0)).address);
        // Convert the JavaScript number to a BigNumber representing Ether (assuming ethAmount is in Ether)
        const mintAmount = ethers.parseEther("0.001"); 
        await coingold.mintCoinGold(mintAmount);
        const updatedBalance = await coingold.balanceOf((await ethers.provider.getSigner(0)).address);
        expect(updatedBalance).to.equal(initialBalance + mintAmount);

        // Burn some CoinGold tokens and verify total supply decreases
        const burnAmount = ethers.parseEther("0.0005"); // Burning 0.0005 Ether
        await coingold.burnCoinGold(burnAmount);
        const newBalance = await coingold.balanceOf((await ethers.provider.getSigner(0)).address);
        expect(newBalance).to.equal(updatedBalance - burnAmount);
    });

    it("Total Capitalization Calculation", async () => {
        // Call the totalCapitalization function and verify the calculation
        const totalSupply = await coingold.totalSupply();
        const latestGoldPrice = await coingold.getChainlinkDataFeedLatestAnswer();
        const totalCapitalization = await coingold.totalCapitalization();
        expect(totalCapitalization).to.equal(totalSupply * latestGoldPrice);
    });
      
    it("should successfully exchange CoinGold for CoinDollar", async function () {
      const exchangeAmount = ethers.parseUnits("5", 18); // 5 CoinGold

      // Set the gold price in the mock feed
      const goldPrice = 2000; // Example gold price
      await mockPriceFeed.setLatestPrice(goldPrice);

      // Mint CoinGold for the user
      await coingold.mintCoinGold(ethers.parseUnits("10", 18)); // Mint 10 CoinGold,
      await coingold.transfer(user.getAddress(), ethers.parseUnits("10", 18)); // Transfer 10 CoinGold to the user
      // Set the CoinGold address in CoinDollar
      await coindollar.setCoinGoldContract(coingold.target);

      // Check user's CoinGold balance
      const userBalance = await coingold.balanceOf(user.getAddress());
      expect(userBalance).to.equal(ethers.parseUnits("10", 18)); // Expect 10 CoinGold

      // User approves CoinGold to spend their tokens
      await coingold.connect(user).approve(coingold.target, exchangeAmount);

      // Execute the exchange
      await expect(coingold.connect(user).exchangeGoldToDollar(exchangeAmount))
        .to.emit(coingold, 'ExchangeGoldToDollar')
        .withArgs(await user.getAddress(), exchangeAmount);

      // Verify the CoinGold balance decrease
      const finalCoinGoldBalance = await coingold.balanceOf(user.getAddress());
      expect(finalCoinGoldBalance).to.equal(ethers.parseUnits("5", 18)); // 10 - 5

      // Verify the CoinDollar balance increase
      const expectedCoinDollarAmount = ethers.parseUnits("5", 18) * BigInt((goldPrice)) / BigInt((1e8)); // Assuming 1:1 ratio for simplicity
      const finalCoinDollarBalance = await coindollar.balanceOf(user.getAddress());
      expect(finalCoinDollarBalance).to.equal(expectedCoinDollarAmount);
  });
    // Add more test cases for other functions and scenarios

    // Add new test for mint event
  it("Minting emits Mint event and increases balance", async () => {
    const [owner] = await ethers.getSigners();
    const mintAmount = ethers.parseUnits("1", 18); // Adjust token decimals if necessary

    await expect(coingold.mintCoinGold(mintAmount))
      .to.emit(coingold, 'Mint')
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
      .to.emit(coingold, 'Burn')
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
        const initialBalance = await coingold.balanceOf((await ethers.provider.getSigner(0)).address);
        const burnAmount = initialBalance + ethers.parseEther("0.1"); // Attempt to burn more tokens than the balance
        await expect(coingold.burnCoinGold(burnAmount)).to.be.revertedWith("Insufficient CoinGold balance");
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

    describe("Ownership test", async () => {
        it("should not allow non-owners to mint tokens", async () => {
          const nonOwner = await ethers.provider.getSigner(1);
          const mintAmount = ethers.parseEther("0.001");
          await expect(coingold.connect(nonOwner).mintCoinGold(mintAmount)).to.be.revertedWith("Only the owner can call this function");
        });
        
        it("should not allow non-owners to burn tokens", async () => {
          const nonOwner = await ethers.provider.getSigner(1);
          const burnAmount = ethers.parseEther("0.001");
          await expect(coingold.connect(nonOwner).burnCoinGold(burnAmount)).to.be.revertedWith("Only the owner can call this function");
        });    
      })



      describe("Edge cases test", async () => {
        // Test for minting zero tokens
        it("should revert when minting zero tokens", async () => {
            await expect(coingold.mintCoinGold(0))
                .to.be.revertedWith("Mint amount must be greater than zero");
        });
    
        // Test for burning zero tokens
        it("should revert when burning zero tokens", async () => {
            await expect(coingold.burnCoinGold(0))
                .to.be.revertedWith("Burn amount must be greater than zero");
        });
        
        // Test for handling invalid data from Chainlink Price Feed
        it("should handle invalid data from Chainlink Price Feed", async () => {
            // Set an invalid price in the mock
            await mockPriceFeed.setLatestPrice(-1);
    
            // Call the totalCapitalization function and expect it to revert
            await expect(coingold.totalCapitalization())
                .to.be.revertedWith("Invalid gold price");
        });
    });
      
    // Add more test cases for different scenarios as needed
    // Ensure you cover other functions, contract interactions, edge cases, upgradeability, and random testing
    // Upgradeability: If applicable, test the upgrade process
    // Random Testing: Perform random testing to ensure the contract handles various inputs and scenarios
})