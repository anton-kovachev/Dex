const { expect } = require("chai");
const { ethers } = require("hardhat");
  
  describe("Token", () => {
    let tokenSupply = 100;

    let token;
    let dex;

    let owner;
    let addr1;
    let addr2;

    beforeEach(async () => {
      [owner, addr1, addr2] = await ethers.getSigners();
      const Token = await ethers.getContractFactory("Token");
      token = await Token.deploy(tokenSupply);

      await token.waitForDeployment();
    });

    it("Should mint the correct amount", async () => {
      expect(await token.totalSupply()).to.equal(tokenSupply);
    });

    it("Should have symbol Ton assigned", async () => {
      expect(await token.symbol()).to.equal("Ton");
    });

    it("Should have name Ton Coin assigned", async () => {
      expect(await token.name()).to.equal("Ton Coin");
    });

    it("should have all tokens allocated to the owner", async () => {
      expect(await token.balanceOf(owner.address)).to.be.equal(tokenSupply);
    })

    it("should allocated token to another address", async () => {
      expect(await token.transfer(addr1.address, 50)).to.emit(token, "Transfer");
      expect(await token.balanceOf(addr1.address)).to.be.equal(50);
      expect(await token.balanceOf(owner.address)).to.be.equal(tokenSupply - 50);
    })

    it("should allow token transfer back to owner", async () => {
      await token.connect(addr1).approve(owner.address, 50);
      expect(await token.allowance(addr1.address, owner.address)).to.be.equal(50);
    })

    it("should tranfer tokens back to owner", async () => {
      await token.transfer(addr1.address, 50);

      expect(await token.balanceOf(addr1.address)).to.be.equal(50);
      expect(await token.balanceOf(owner.address)).to.be.equal(tokenSupply - 50);

      await token.connect(addr1).approve(owner.address, 50);

      expect(await token.transferFrom(addr1.address, owner.address, 50)).to.emit(token, "Transfer");
      expect(await token.balanceOf(addr1.address)).to.be.equal(0);
      expect(await token.balanceOf(owner.address)).to.be.equal(tokenSupply);
    })

    it("should fail token transfer if amount exceeds token supply", async () => {
       await expect(token.transfer(addr1, 1001)).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    })
  });