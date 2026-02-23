import { network } from "hardhat";

async function main() {
  // Hardhat v3 requires explicitly connecting to the network first!
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 1. Point to your AgroTraceability contract
  const agroFactory = await ethers.getContractFactory("AgroTraceability", deployer);
  
  // 2. Deploy it (No arguments needed inside deploy() for your contract)
  const agro = await agroFactory.deploy();
  
  await agro.waitForDeployment();

  const contractAddress = await agro.getAddress();
  
  // 3. Print the success message!
  console.log("AgroTraceability successfully deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});