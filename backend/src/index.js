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
    const { walletAddress, role, name, state } = req.body;
    
    const newUser = await prisma.user.create({
      data: {
        walletAddress,
        role, 
        name,
        state
      }
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A user with this wallet address already exists." });
    }
    res.status(500).json({ error: "Failed to create user" });
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

// ---------------------------------------------------
// START SERVER
// ---------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});