const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers'); // Needed for parsing crypto values
const { contract, buyerContract } = require('./blockchain'); // Merged perfectly
require('dotenv').config();

// Prisma v7 Requirements
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const app = express();

// Configure the Prisma Adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// API ROUTES
// ---------------------------------------------------

// 1. Health Check
app.get('/', (req, res) => {
  res.send('AgroTraceability Backend is running!');
});
// 1.5 Blockchain Test Route
app.get('/api/test-blockchain', async (req, res) => {
  try {
    // We'll call the 'greeting' function from your Greeter contract 
    // OR the 'owner' function from AgroTraceability
    const owner = await contract.owner(); 
    res.json({ 
      status: "Success!", 
      contractOwner: owner,
      message: "Server is officially talking to the Blockchain."
    });
  } catch (error) {
    console.error("Blockchain Connection Error:", error);
    res.status(500).json({ error: "Server could not reach the blockchain." });
  }
});
// 4. Simple Login (Web 2.5 Auth)
app.post('/api/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Find the user by their phone number
    const user = await prisma.user.findUnique({
      where: { phone: phone }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found. Please check the number." });
    }

    // Return the user object (including their ID and Role)
    res.json(user);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed." });
  }
});
// 2. Create a new User (Farmer, Distributor, etc.)
app.post('/api/users', async (req, res) => {
  try {
    const { walletAddress, role, name, state, city, phone } = req.body;
    const newUser = await prisma.user.create({
      data: { walletAddress, role, name, state, city, phone }
    });
    res.status(201).json(newUser);
  } catch (error) {
    // ADDED THIS LINE to see the real issue in the terminal
    console.error("User Registration Error:", error); 
    res.status(400).json({ error: "Could not register user." });
  }
});

// 3. Get all Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// Add a new produce listing
app.post('/api/produce', async (req, res) => {
  try {
    const { name, quantity, price, farmerId } = req.body;
    
    // 1. MINT THE NFT (Blockchain)
    const metadataUri = `https://krishilink.com/metadata/${name.toLowerCase()}`;
    const tx = await contract.mintProduce(metadataUri);
    const receipt = await tx.wait();

    // Extract the TokenID from the event logs
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'ProduceMinted');
    const mintedTokenId = event ? event.args[0].toString() : null;

    // 2. SAVE TO POSTGRES (Prisma)
    const newProduce = await prisma.produce.create({
      data: {
        name: name,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        farmerId: farmerId,
        blockchainTx: receipt.hash, // ✅ Proof of Transaction
        tokenId: mintedTokenId     // ✅ NFT Identification
      }
    });
    
    res.status(201).json(newProduce);
  } catch (error) {
    console.error("Critical Error during Listing:", error);
    res.status(500).json({ error: "Failed to sync Blockchain and Database." });
  }
});

// Get all produce for the marketplace
app.get('/api/produce', async (req, res) => {
  try {
    const allProduce = await prisma.produce.findMany({
      include: { farmer: true } // This brings farmer details (like name/city) with the produce
    });
    res.json(allProduce);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch marketplace" });
  }
});

// Create a new order (Wholesaler contacts Farmer)
app.post('/api/orders', async (req, res) => {
  try {
    const { produceId, buyerId } = req.body;
    
    const newOrder = await prisma.order.create({
      data: {
        produceId: produceId,
        buyerId: buyerId
      }
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Get all orders for a specific farmer
// 1. FETCH INVENTORY: What the farmer is selling
app.get('/api/produce/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const inventory = await prisma.produce.findMany({
      where: { farmerId: farmerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch farmer inventory." });
  }
});

// 2. FETCH ORDERS: Who is buying the farmer's crops (YOUR EXISTING ROUTE)
app.get('/api/orders/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const orders = await prisma.order.findMany({
      where: {
        produce: { farmerId: farmerId }
      },
      include: {
        produce: true, 
        buyer: true    
      }
    });
    res.json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});


// Accept an order (Update status)
app.put('/api/orders/:orderId/accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "ACCEPTED" }
    });
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Accept Order Error:", error);
    res.status(500).json({ error: "Failed to accept order." });
  }
});

// Get all orders for a specific buyer (Wholesaler/Retailer)
// Fetch all orders placed by a specific Wholesaler (Buyer)
app.get('/api/orders/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const orders = await prisma.order.findMany({
      where: { buyerId: buyerId },
      include: {
        produce: {
          include: { 
            farmer: true // We want the farmer's details to show to the wholesaler
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Fetch Buyer Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch buyer orders." });
  }
});

// 5. Fund Escrow (Wholesaler locks funds in Smart Contract)
app.post('/api/orders/:orderId/fund', async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Find the order and the associated NFT Token ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { produce: true }
    });

    if (!order || !order.produce.tokenId) {
      return res.status(400).json({ error: "Order not found or Produce has no Token ID." });
    }

    // 2. WEB 3 MAGIC: Fund the Escrow via the Smart Contract
    console.log(`Funding Escrow for Token ID: ${order.produce.tokenId}...`);
    
    // We send a small amount of mock ETH (e.g., 0.01 ETH) as the escrow value
    const tx = await buyerContract.fundEscrow(order.produce.tokenId, {
      value: ethers.parseEther("0.01") 
    });
    
    const receipt = await tx.wait();
    console.log(`Escrow Funded! Hash: ${receipt.hash}`);

    // 3. Update PostgreSQL status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ESCROW_FUNDED' }
    });

    res.json({ updatedOrder, txHash: receipt.hash });
  } catch (error) {
    console.error("Escrow Funding Error:", error);
    res.status(500).json({ error: "Failed to fund escrow on the blockchain." });
  }
});
// 6. Confirm Delivery & Release Funds (Wholesaler receives the crop)
app.post('/api/orders/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Please provide a valid rating between 1 and 5." });
    }

    // 1. Find the order and Token ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { produce: true }
    });

    if (!order || !order.produce.tokenId) {
      return res.status(400).json({ error: "Order not found or missing Token ID." });
    }

    // 2. WEB 3 MAGIC: Call the smart contract to release funds
    console.log(`Releasing funds for Token ID: ${order.produce.tokenId} with Rating: ${rating}...`);
    
    // We use buyerContract because ONLY the buyer is authorized to release the money
    const tx = await buyerContract.confirmDeliveryAndReleaseFunds(order.produce.tokenId, rating);
    const receipt = await tx.wait();

    console.log(`Funds Released! Hash: ${receipt.hash}`);

    // 3. Update PostgreSQL status to show the transaction is totally finished
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' } 
    });

    res.json({ updatedOrder, txHash: receipt.hash });
  } catch (error) {
    console.error("Delivery Confirmation Error:", error);
    res.status(500).json({ error: "Failed to confirm delivery on the blockchain." });
  }
});
// ---------------------------------------------------
// START SERVER
// ---------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});