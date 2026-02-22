const { ethers } = require('ethers');
require('dotenv').config(); 

const privateKey = process.env.SERVER_PRIVATE_KEY;
const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!privateKey || !buyerPrivateKey) {
  throw new Error("Missing Private Keys in .env!");
}

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Wallet 1: The Farmer (Mints the NFTs)
const wallet = new ethers.Wallet(privateKey, provider);
// Wallet 2: The Wholesaler (Funds the Escrow)
const buyerWallet = new ethers.Wallet(buyerPrivateKey, provider);

const AgroABI = require('./abi.json');

// Contract connection for the Farmer
const contract = new ethers.Contract(contractAddress, AgroABI.abi, wallet);
// Contract connection for the Wholesaler
const buyerContract = new ethers.Contract(contractAddress, AgroABI.abi, buyerWallet);

module.exports = { contract, buyerContract, provider };