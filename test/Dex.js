const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Dex", () => {
  const TOKEN_PRICE = 10;
  let owner, addr1, addr2;
  let token, dex;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token", owner);
    token = await Token.deploy(1000);
    token.waitForDeployment();

    const Dex = await ethers.getContractFactory("Dex", owner);
    dex = await Dex.deploy(await token.getAddress(), TOKEN_PRICE);
    await dex.waitForDeployment();
  });

  describe("sell", async () => {
    it("should sell 500 owner tokens to dex", async () => {
      await token.approve(await dex.getAddress(), 500);
      expect(await dex.sell()).changeTokenBalance(
        token,
        [owner, dex.address],
        [-500, 500]
      );
      expect(await dex.getTokenBalance()).to.be.equal(500);
    });

    it("should fail transferring tokens to Dex without approval", async () => {
      await expect(dex.sell()).to.be.revertedWith(
        "You must allow this DEX contract access to at least one token."
      );
    });

    it("should withdraw 500 tokens from Dex back to the owner", async () => {
      expect(await dex.withdrawTokens()).changeTokenBalances(
        token,
        [owner, dex.address],
        [500, -500]
      );
    });

    it("Dex token balance should be 0", async () => {
      expect(await dex.getTokenBalance()).to.be.equal(0);
    });

    it("should sell 600 owner tokens to dex", async () => {
      await token.approve(await dex.getAddress(), 600);
      expect(await dex.sell()).changeTokenBalance(
        token,
        [owner, dex.address],
        [-600, 600]
      );
      expect(await dex.getTokenBalance()).to.be.equal(600);
    });
  });

  describe("Buy", async () => {
    it("third party address should be able to buy 100 tokens from Dex", async () => {
      expect(
        await dex.connect(addr1).buy(100, { value: 100 * TOKEN_PRICE })
      ).changeTokenBalances(token, [addr1, dex.address], [100, -100]);
      expect(
        await dex.connect(addr1).buy(100, { value: 100 * TOKEN_PRICE })
      ).changeEtherBalances(
        [addr1, dex.address],
        [-100 * TOKEN_PRICE, 100 * TOKEN_PRICE]
      );
    });
  });

  it("third party address should fail to buy tokens from Dex if he sends less than the tokens amount in eth", async () => {
    await expect(
      dex.connect(addr1).buy(100, { value: 100 * (TOKEN_PRICE - 1) })
    ).to.be.revertedWith("Invalid eth amount send.");
  });

  it("third party address should fail to buy tokens from Dex if it requests more tokens than the Dex's balance", async () => {
    await expect(
      dex.connect(addr1).buy(900, { value: 900 * TOKEN_PRICE })
    ).to.be.revertedWith("DEX has insufficient funds.");
  });

  describe("Withdraw", async () => {
    it("Should fail token withdraw attempt by third party address", async () => {
      await expect(dex.connect(addr1).withdrawTokens()).to.be.revertedWith(
        "you are not the owner."
      );
    });

    it("Should succеed token withdraw attempt by owner", async () => {
      expect(await dex.withdrawTokens()).to.changeTokenBalances(
        token,
        [owner, dex.address],
        [500, -500]
      );
    });

    it("Should fail token withdraw attempt by owner when Dex has zero token balance", async () => {
      await expect(dex.withdrawTokens()).to.be.revertedWith(
        "Dex has no tokens."
      );
    });

    it("Should fail balance withdraw attempt by third party address", async () => {
      await expect(dex.connect(addr1).withdrawFunds()).to.be.revertedWith(
        "you are not the owner."
      );
    });

    it("Should succеed token withdraw attempt by owner", async () => {
      expect(await dex.withdrawFunds()).to.changeEtherBalances(
        [owner, dex.address],
        [100 * TOKEN_PRICE, -100 * TOKEN_PRICE]
      );
    });

    it("Should fail balance withdraw attempt by owner due to zero balance", async () => {
      await expect(dex.connect(addr1).withdrawFunds()).to.be.revertedWith(
        "you are not the owner."
      );
    });
  });
});
