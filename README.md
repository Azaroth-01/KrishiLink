# 🌾 KrishiLink: Blockchain-Based Agro Escrow

**KrishiLink** is a decentralized agricultural marketplace and escrow system designed to ensure fair trade between farmers and buyers. By leveraging smart contracts, we eliminate payment defaults and build trust in the agricultural supply chain.


##Key Features
1.Agro-Escrow: Secure fund locking until produce delivery is verified.

2.Profiles: Verified history of produce and successful trades.

Dispute Resolution: Governance-based or mediator-led resolution for damaged goods.
---

## 🚀 Project Structure

The repository is organized into three main modules:

* **/contracts**: Smart contracts for the Agro-Escrow logic (Solidity & Hardhat 3).
* **/backend**: Node.js API with Prisma ORM for user management and produce tracking.
* **/frontend**: React/Vite dashboard for farmers and buyers to interact with the system.

---

## 🛠️ Tech Stack

| Layer          | Technology                     |
| :------------- | :----------------------------- |
| **Blockchain** | Solidity, Hardhat 3, Ethers.js |
| **Backend** | Node.js, Prisma ORM, PostgreSql|
| **Frontend** | React, Vite, Tailwind CSS      |
| **Environment**| Node 22 (ESM Support)          |

---

## ⚙️ Getting Started

### 1. Prerequisites
* Node.js (v22.x recommended)
* npm

### 2. Smart Contract Setup
```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
