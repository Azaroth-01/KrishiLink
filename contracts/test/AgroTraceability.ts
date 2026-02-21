import { expect } from "chai";
import hre from "hardhat";

describe("AgroTraceability", function () {
  let agro: any;
  let owner: any;
  let farmer: any;
  let distributor: any;

  // This runs automatically before EVERY 'it' block, giving us a fresh contract state
  beforeEach(async function () {
    // Get the signers (simulated Ethereum accounts)
    [owner, farmer, distributor] = await hre.ethers.getSigners();

    // Deploy the contract
    const AgroContract = await hre.ethers.getContractFactory("AgroTraceability");
    agro = await AgroContract.deploy();
    
    // Wait for the deployment to finish (Ethers v6 syntax)
    await agro.waitForDeployment();
  });

  describe("Core Escrow Workflow", function () {
    it("Should allow a farmer to mint a produce NFT", async function () {
      const ipfsUri = "ipfs://QmYourCertificateHash";
      
      // Farmer mints the produce (Token ID 0)
      await expect(agro.connect(farmer).mintProduce(ipfsUri))
        .to.emit(agro, "ProduceMinted")
        .withArgs(0, farmer.address, ipfsUri);

      // Verify the farmer is the owner of Token ID 0
      expect(await agro.ownerOf(0)).to.equal(farmer.address);
    });

    it("Should allow a distributor to fund the escrow and confirm delivery", async function () {
      // 1. Farmer mints
      await agro.connect(farmer).mintProduce("ipfs://mockURI");
      
      const producePrice = hre.ethers.parseEther("1.0"); // 1 ETH

      // 2. Distributor funds the escrow for Token ID 0
      await expect(agro.connect(distributor).fundEscrow(0, { value: producePrice }))
        .to.emit(agro, "EscrowFunded")
        .withArgs(0, distributor.address, producePrice);

      // Check escrow status to ensure money is locked
      const escrowDetails = await agro.escrows(0);
      expect(escrowDetails.isFunded).to.be.true;
      expect(escrowDetails.isDelivered).to.be.false;

      // 3. Distributor confirms delivery and gives a 5-star rating to the farmer
      await expect(agro.connect(distributor).confirmDeliveryAndReleaseFunds(0, 5))
        .to.emit(agro, "ProduceDelivered")
        .withArgs(0)
        .and.to.emit(agro, "FundsReleased")
        .withArgs(0, farmer.address, producePrice);

      // Verify the new NFT owner is the distributor
      expect(await agro.ownerOf(0)).to.equal(distributor.address);

      // Verify the farmer's rating updated correctly
      const rating = await agro.getAverageRating(farmer.address);
      expect(rating).to.equal(5);
    });
  });
});