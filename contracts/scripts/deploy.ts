import { network } from "hardhat";

async function main() {
  // Hardhat v3 requires explicitly connecting to the network first!
  // This automatically uses the --network flag you pass in the console
  const { ethers } = await network.connect();

  // Grab the first two accounts from your local Hardhat node
  const [deployer, user1] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);
  
  // Check the balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Fetch the contract factory and deploy
  const greeterFactory = await ethers.getContractFactory("Greeter", deployer);
  const greeter = await greeterFactory.deploy("Hello, Hardhat v3!");
  
  // Wait for the deployment transaction to be mined
  await greeter.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await greeter.getAddress();
  console.log("Greeter successfully deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});