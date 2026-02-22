const { ethers } = require('ethers');
const AgroABI = require('./abi.json'); // We will copy this file in the next step

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);

// This creates the contract instance your server will use
const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS, 
    AgroABI.abi, 
    wallet
);

module.exports = { contract, provider };