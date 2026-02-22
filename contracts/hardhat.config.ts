import { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.24", 
  paths: {
    sources: "./contracts", // Explicitly telling Hardhat where to look
  },
  plugins:[hardhatToolboxMochaEthers],// Matches your OpenZeppelin version
};

export default config;