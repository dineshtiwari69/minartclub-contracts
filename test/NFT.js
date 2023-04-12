const { expect } = require("chai");
const keccak256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

describe("Token contract", function () {
  

  it("Cannot mint while the contract is Paused", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await expect(batt.connect(minter).mint(1)).to.be.revertedWith("Contract Minting Paused");
  });

  it("Cannot Mint while the contract is in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await expect(batt.connect(minter).mint(1)).to.be.revertedWith(": Cannot Mint During Whitelist Sale");
  });

  it("Cannot Mint With Less Amount in Normal Mint Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await batt.connect(owner).toggleWhiteList();
    await expect(batt.connect(minter).mint(1)).to.be.revertedWith("Insufficient Fund");
  });

  it("Can Mint With Valid Amount", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await batt.connect(owner).toggleWhiteList();
    const price = await batt.connect(minter).price();
    await batt.connect(minter).mint(1,{value:price});
    const balance = await batt.connect(minter).balanceOf(minter.address);
    expect(balance).to.equal(1);
  });

  it("Cannot Mint More than perTxCap in Normal Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await batt.connect(owner).toggleWhiteList();
    await expect(batt.connect(minter).mint(21)).to.be.revertedWith("Exceeds per Transaction Limit");
  });


  it("Cannot Mint More than supply in Normal Mode", async function () {
    const [owner,minter,minter2,minter3] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await batt.connect(owner).toggleWhiteList();
    const price = (await batt.connect(owner).price()).toString();
    await batt.connect(minter).mint(1,{value:price})
   
    await batt.connect(minter3).mint(1,{value:price})

    await expect(batt.connect(minter2).mint(1,{value:price})).to.be.revertedWith(": No more NFTs to mint,decrease the quantity or check out OpenSea.");
  });

  //Now tests for Whitelist Sale

  it("Cannot Mint While the contract is Paused in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).toggleWhiteList();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    await expect(batt.connect(minter).whitelistMint(1,proof)).to.be.revertedWith("Contract Minting Paused");
  });

  it("Cannot Mint While the contract is in Normal Mint Mode in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    await batt.connect(owner).toggleWhiteList();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    await expect(batt.connect(minter).whitelistMint(1,proof)).to.be.revertedWith(": Cannot Mint During Regular Sale");
  });

  it("Cannot Mint With Less Amount in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    await expect(batt.connect(minter).whitelistMint(1,proof,{value:"0"})).to.be.revertedWith("Insufficient Fund");
  });

  it("Can Mint With Valid Amoun in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    const price = (await batt.connect(owner).whitelistPrice()).toString();

    await batt.connect(minter).whitelistMint(1,proof,{value:price})
    expect(await batt.balanceOf(minter.address)).to.equal(1);
  });

  it("Cannot Mint With Invalid Proof in Whitelist Mode", async function () {
    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");

    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    const price = (await batt.connect(owner).whitelistPrice()).toString();
    await expect(batt.connect(minter).whitelistMint(1,["0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"],{value:price})).to.be.revertedWith("You are Not whitelisted");
  });

  it("Cannot Mint More than perTXCap address in whitelist", async function () {

    const [owner,minter] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    const price = (await batt.connect(owner).whitelistPrice()).toString();
    // await batt.connect(minter).whitelistMint(21,proof,{value:price})
    await expect(batt.connect(minter).whitelistMint(21,proof,{value:price})).to.be.revertedWith("Exceeds Presale Limit");
  });

  it("Cannot Mint More than cap on Whitelisted address in whitelist", async function () {
    const [owner,minter,minter2,minter3,minter4] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).togglePause();
    const whitelistedAddresses = [minter.address];
    const leaves = whitelistedAddresses.map((x) => keccak256(x.toString()));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = "0x"+tree.getRoot().toString('hex');
    const proof = tree.getHexProof(keccak256(minter.address.toString()));
    await batt.connect(owner).setMerkleRoot(root);
    const price = "400000000000000000"
    await batt.connect(minter).whitelistMint(1,proof,{value:price})
    // await batt.connect(minter).whitelistMint(10,proof,{value:price})
    await expect(batt.connect(minter).whitelistMint(1,proof,{value:price})).to.be.revertedWith("You have already minted the max allowed");
  });

  

  it("UnReveal URI is same for every token", async function () {
    const [owner,minter,minter1] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).toggleWhiteList();
    await batt.connect(owner).togglePause();
    await batt.setNotRevealedURI("https://notrevealeduri")
    const price = "500000000000000000"
    await batt.connect(minter).mint(1,{value:price})
    await batt.connect(minter1).mint(1,{value:price})
    const tokenURI = await batt.tokenURI(1);
    const tokenURI1 = await batt.tokenURI(2);
    expect(tokenURI).to.equal(tokenURI1);
    expect(tokenURI).to.equal("https://notrevealeduri");
  });

  it("After Reveal URI corresponds", async function () {
    const [owner,minter,minter1] = await ethers.getSigners();
    const BATT = await ethers.getContractFactory("MinArtClub");
    const batt = await BATT.deploy();
    await batt.deployed();
    await batt.connect(owner).toggleWhiteList();
    await batt.connect(owner).togglePause();
    await batt.setNotRevealedURI("https://notrevealeduri")
    const price = "500000000000000000"
    await batt.connect(owner).toggleReveal();
    await batt.connect(minter).mint(1,{value:price})
    await batt.connect(minter1).mint(1,{value:price})
    await batt.connect(owner).changeURLParams("https://facebook.com/",".json");

    const tokenURI = await batt.tokenURI(1);
    const tokenURI1 = await batt.tokenURI(2);
   
    

    expect(tokenURI).to.equal("https://facebook.com/1.json");
    expect(tokenURI1).to.equal("https://facebook.com/2.json");
  });





});