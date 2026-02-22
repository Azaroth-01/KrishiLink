import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgroTraceabilityModule = buildModule("AgroTraceabilityModule", (m) => {
  // This tells Hardhat to deploy your specific contract
  const agroTraceability = m.contract("AgroTraceability");

  return { agroTraceability };
});

export default AgroTraceabilityModule;