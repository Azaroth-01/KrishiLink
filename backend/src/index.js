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
// Get All Available Produce (Marketplace)
app.get('/api/produce', async (req, res) => {
  try {
    const produce = await prisma.produce.findMany({
      where: {
        // THE MAGIC: Hide this crop if the farmer has accepted ANY order for it
        orders: {
          none: {
            status: {
              in: ['ACCEPTED', 'ESCROW_FUNDED', 'DELIVERED']
            }
          }
        }
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(produce);
  } catch (error) {
    console.error("Marketplace Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch marketplace data." });
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


// 7. Unified Public Profile Route
// 7. Unified Public Profile Route (WITH BLOCKCHAIN REPUTATION)
app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // ---> NEW: FETCH ON-CHAIN REPUTATION <---
    let onChainRating = 0;
    let reviewCount = 0;
    
    
    try {
      // 1. Get the actual wallet address your Node server is using!
      const actualWalletAddress = await contract.runner.getAddress();
      
      console.log(`Checking DB Fake Wallet: ${user.walletAddress}`);
      console.log(`Actually querying Blockchain for: ${actualWalletAddress}`);

      // 2. Query the blockchain using the real wallet
      const rep = await contract.ratings(actualWalletAddress);
      
      const fetchedTotalScore = Number(rep[0] || 0);
      const fetchedReviewCount = Number(rep[1] || 0);
      
      console.log(`Found Score: ${fetchedTotalScore}, Reviews: ${fetchedReviewCount}`);

      if (fetchedReviewCount > 0) {
        onChainRating = parseFloat((fetchedTotalScore / fetchedReviewCount).toFixed(1));
        reviewCount = fetchedReviewCount;
      }
    } catch (chainErr) {
      console.error("Smart Contract read error for rating:", chainErr.shortMessage || chainErr.message);
    }

    // Attach the blockchain data to the web2 user object
    user.onChainRating = onChainRating;
    user.reviewCount = reviewCount;

    // Fetch Verified History (DELIVERED status only)
    let history = [];
    if (user.role === 'FARMER') {
      history = await prisma.order.findMany({
        where: {
          produce: { farmerId: id },
          status: "DELIVERED"
        },
        include: { produce: true, buyer: { select: { name: true, city: true } } },
        orderBy: { createdAt: 'desc' } // Note: Using createdAt to avoid Prisma schema errors!
      });
    } else if (user.role === 'WHOLESALER') {
      history = await prisma.order.findMany({
        where: {
          buyerId: id,
          status: "DELIVERED"
        },
        include: {
          produce: {
            include: { farmer: { select: { name: true, city: true } } }
          }
        },
        orderBy: { createdAt: 'desc' } 
      });
    }

    res.json({ user, history });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// 8. Farmer Rates the Wholesaler
app.post('/api/orders/:orderId/rate-buyer', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { produce: true }
    });

    // FIX: Strictly check for null/undefined so Token ID 0 doesn't get blocked!
    if (!order || order.produce.tokenId === null || order.produce.tokenId === undefined) {
      return res.status(400).json({ error: "Order or Token ID not found." });
    }

    console.log(`Farmer is rating Buyer for Token ID: ${order.produce.tokenId}...`);
    
    const tx = await contract.rateBuyer(order.produce.tokenId, rating);
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.hash });
  } catch (error) {
    console.error("Rate Buyer Error:", error);
    res.status(500).json({ error: "Failed to rate buyer. You may have already rated them!" });
  }
});

// DELETE LISTED PRODUCE
app.delete('/api/produce/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Attempt to delete the item from the database
    await prisma.produce.delete({
      where: { id: id }
    });

    res.json({ success: true, message: "Produce delisted successfully." });
  } catch (error) {
    console.error("Delete Produce Error:", error);
    res.status(500).json({ error: "Cannot delist an item that already has active orders." });
  }
});

// 9. Public Ledger (Blockchain Explorer) Route
app.get('/api/ledger', async (req, res) => {
  try {
    // Fetch all orders that have blockchain activity
    const transactions = await prisma.order.findMany({
      where: {
        status: { in: ['ESCROW_FUNDED', 'DELIVERED'] }
      },
      include: {
        produce: {
          include: { 
            farmer: { select: { name: true, walletAddress: true } } 
          }
        },
        buyer: { select: { name: true, walletAddress: true } }
      },
      orderBy: { createdAt: 'desc' } // Sorting by newest first
    });

    res.json(transactions);
  } catch (error) {
    console.error("Ledger Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch ledger data." });
  }
});
// ---------------------------------------------------
// START SERVER
// ---------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});