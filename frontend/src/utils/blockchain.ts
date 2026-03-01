import { ethers } from "ethers";
import AgroABI from "../constants/abi.json";

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
// This is one of the private keys from your 'npx hardhat node' terminal
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY; 

export const getServerContract = () => {
  // 1. Connect to the local Hardhat node
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // 2. Create a wallet instance using your server's private key
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
  
  // 3. Return the contract connected to the server's wallet
  return new ethers.Contract(CONTRACT_ADDRESS!, AgroABI, wallet);
};