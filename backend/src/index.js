const express = require('express');
const cors = require('cors');
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
    
    // We are matching the exact names in your schema.prisma
    const newProduce = await prisma.produce.create({
      data: {
        name: name,
        quantity: parseFloat(quantity), // Changed back from quantityKg
        price: parseFloat(price),       // Changed back from pricePerKg
        farmerId: farmerId
      }
    });
    
    res.status(201).json(newProduce);
  } catch (error) {
    console.error("Prisma Error Details:", error);
    res.status(500).json({ error: "Failed to create produce listing", details: error.message });
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
app.get('/api/orders/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Prisma lets us search for orders where the connected 'produce' belongs to this farmer
    const orders = await prisma.order.findMany({
      where: {
        produce: {
          farmerId: farmerId
        }
      },
      include: {
        produce: true, // Brings in the crop details (name, price)
        buyer: true    // Brings in the wholesaler's details (name, phone)
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
app.get('/api/orders/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const orders = await prisma.order.findMany({
      where: {
        buyerId: buyerId
      },
      include: {
        // We include the produce details, AND we nest the farmer's details inside it
        // so the wholesaler knows who to call and where the crop is.
        produce: {
          include: {
            farmer: true 
          }
        }
      }
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Fetch Buyer Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch buyer orders." });
  }
});
// ---------------------------------------------------
// START SERVER
// ---------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});