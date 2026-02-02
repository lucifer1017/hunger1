# 📜 Smart Contracts: The Backbone of DeFi Lending

> **Where code meets capital, trust meets transparency, and innovation meets infrastructure.**

---

## 🎯 What is the `contracts/` Folder?

The `contracts/` folder is the **smart contract foundation** of the Portfolio AI Agent platform—a self-contained, production-ready DeFi lending protocol built on Rootstock. This directory houses the entire blockchain infrastructure that powers collateralized lending, borrowing, and portfolio management operations.

Think of it as the **"engine room"** of a DeFi ship: while the frontend provides the beautiful interface and AI assistant handles user interactions, the contracts folder contains the immutable, trustless logic that executes financial operations on-chain.

---

## 🏗️ Architecture Overview

```
contracts/
├── contracts/              # Solidity smart contracts (the heart)
│   ├── LendingPool.sol    # 🏦 Main lending pool contract
│   ├── interfaces/         # 📋 Contract interfaces
│   │   └── IPriceOracle.sol
│   ├── oracles/           # 🔮 Price oracle adapters
│   │   └── UmbrellaOracleAdapter.sol
│   └── tokens/            # 💰 ERC20 token contracts
│       └── MockUSDT0.sol
│
├── ignition/               # 🚀 Deployment orchestration
│   ├── modules/
│   │   └── LendingPool.ts  # One-command deployment script
│   └── deployments/        # Deployment artifacts & addresses
│
├── scripts/               # 🛠️ Utility scripts
│   └── send-op-tx.ts
│
├── test/                  # 🧪 Contract tests
│   └── Counter.ts
│
├── hardhat.config.ts      # ⚙️ Hardhat v3 configuration
└── package.json           # 📦 Dependencies (Hardhat v3, OpenZeppelin v5)
```

---

## 💎 What Does It Contain?

### 1. **LendingPool.sol** - The Core Protocol 🏦

**Purpose**: The main lending pool contract that enables users to deposit RBTC collateral and borrow USDT0 stablecoins.

**Key Features**:
- ✅ **Collateral Management**: Deposit and withdraw native RBTC (Rootstock Bitcoin)
- ✅ **Borrowing System**: Borrow USDT0 against deposited collateral with configurable LTV (Loan-to-Value) ratios
- ✅ **Debt Management**: Repay borrowed USDT0 to reduce debt and unlock collateral
- ✅ **Health Factor Monitoring**: Real-time calculation of position health to prevent liquidations
- ✅ **Oracle Integration**: Dynamic price feeds for collateral and debt valuation
- ✅ **Security**: Built with OpenZeppelin v5 (ReentrancyGuard, Ownable, SafeERC20)

**Core Functions**:
```solidity
depositRBTC()           // Deposit native RBTC as collateral
withdrawRBTC()          // Withdraw collateral (with health checks)
borrowUSDT0()           // Borrow USDT0 against collateral
repayUSDT0()            // Repay debt to improve health factor
healthFactorE18()       // Calculate position health (1.0 = liquidation threshold)
getAccountData()        // Get comprehensive position snapshot
```

**Security Highlights**:
- Reentrancy protection on all state-changing functions
- Owner-controlled oracle and LTV updates
- Solvency checks before every withdrawal/borrow operation
- SafeERC20 for token transfers (prevents common ERC20 pitfalls)

---

### 2. **IPriceOracle.sol** - The Price Interface 📋

**Purpose**: Standardized interface for price oracles, enabling flexible oracle implementations.

**Design Philosophy**: By using an interface, the protocol can swap oracle providers without changing the core lending logic. This follows the **Dependency Inversion Principle**—depend on abstractions, not concretions.

```solidity
interface IPriceOracle {
    function getPrice(address asset) external view returns (uint256 priceE18);
}
```

**Why It Matters**: 
- Enables oracle upgrades without redeploying the lending pool
- Supports multiple oracle providers (Chainlink, Umbrella, custom)
- Standardizes price format (18 decimals = $1)

---

### 3. **UmbrellaOracleAdapter.sol** - The Price Oracle 🔮

**Purpose**: Mock oracle adapter that provides price feeds for RBTC and USDT0.

**Current Implementation**: 
- Owner-settable prices (perfect for testing and demos)
- Batch price updates for efficiency
- Event emission for price change tracking

**Production Note**: This is a **mock implementation** for development. In production, this would integrate with:
- Umbrella Network's decentralized oracle
- Chainlink Price Feeds
- Or other trusted price data providers

**Key Functions**:
```solidity
setPriceE18(address asset, uint256 price)  // Set price for single asset
setBatch(address[] assets, uint256[] prices) // Batch update prices
getPrice(address asset)                      // Retrieve USD price (18 decimals)
```

---

### 4. **MockUSDT0.sol** - The Stablecoin Token 💰

**Purpose**: ERC20 token contract representing USDT0 (Tether USD0), the borrowable asset in the lending pool.

**Specifications**:
- **Name**: "Tether USD0 (Mock)"
- **Symbol**: "USDT0"
- **Decimals**: 6 (matching real USDT)
- **Mintable**: Owner can mint tokens for testing/demos

**Why Mock?**: 
- Enables testing on testnets without real USDT
- Allows controlled token supply for demos
- Perfect for development and educational purposes

**Production Path**: Replace with actual USDT0 token address or deploy a production-grade version.

---

### 5. **Hardhat Ignition Module** - Deployment Orchestration 🚀

**File**: `ignition/modules/LendingPool.ts`

**Purpose**: Automated, reproducible deployment script that sets up the entire lending ecosystem in one command.

**Deployment Sequence**:
1. **Deploy MockUSDT0** with initial supply (1,000,000 USDT0)
2. **Deploy UmbrellaOracleAdapter** oracle
3. **Configure Oracle Prices**:
   - RBTC: $65,000 (18 decimals)
   - USDT0: $1.00 (18 decimals)
4. **Deploy LendingPool** with 70% LTV (7000 basis points)
5. **Seed Pool** with 100,000 USDT0 liquidity

**Why Ignition?**:
- ✅ **Reproducible**: Same inputs = same deployment
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Dependency Management**: Handles contract dependencies automatically
- ✅ **Deployment History**: Tracks all deployments with artifacts

---

### 6. **Hardhat Configuration** - Development Environment ⚙️

**File**: `hardhat.config.ts`

**Highlights**:
- **Hardhat v3.1.0**: Latest version with EDR (Ethereum Development Runtime)
- **OpenZeppelin v5.4.0**: Latest security libraries
- **Viem Integration**: Type-safe Ethereum interactions
- **Network Support**: Rootstock Testnet (chain ID 31), local simulation

**Modern Stack**:
```typescript
- Hardhat Toolbox Viem v5.0.1
- Hardhat Ignition v3.0.6
- TypeScript 5.8
- Solidity 0.8.28
```

---

## 🎨 Why This PR? The Strategic Extraction

### **Modularity & Separation of Concerns**

This PR extracts the smart contract codebase into a standalone, focused repository. Here's why this matters:

#### 1. **Independent Versioning** 📌
- Smart contracts can be versioned separately from frontend
- Enables semantic versioning (e.g., `contracts@1.2.3`)
- Clear contract release cycles independent of UI updates

#### 2. **Reusability** ♻️
- Other projects can import and use these contracts
- Frontend-agnostic design allows multiple UIs to interact with the same protocol
- Enables building different interfaces (web, mobile, CLI) on the same foundation

#### 3. **Security Focus** 🔒
- Isolated codebase makes security audits more focused
- Clearer dependency management (only Solidity/blockchain dependencies)
- Easier to track contract-specific vulnerabilities and updates

#### 4. **Deployment Flexibility** 🚀
- Contracts can be deployed independently of frontend
- Multiple deployment environments (testnet, mainnet, sidechains)
- Easier to manage contract upgrades and migrations

#### 5. **Developer Experience** 👨‍💻
- Cleaner repository structure
- Faster CI/CD pipelines (only compile/test contracts)
- Better IDE support (focused Solidity/TypeScript workspace)

#### 6. **Open Source Contribution** 🌐
- Easier for external developers to contribute
- Clear contract documentation and testing
- Community can fork and extend the protocol

---

## 🔐 Security & Best Practices

### **OpenZeppelin v5 Integration**
All contracts leverage battle-tested OpenZeppelin libraries:
- ✅ **Ownable**: Access control for admin functions
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **SafeERC20**: Safe token transfer operations
- ✅ **IERC20Metadata**: Standard token interface

### **Design Patterns**
- **Checks-Effects-Interactions**: Prevents reentrancy vulnerabilities
- **Pull over Push**: Users pull funds rather than contract pushing (safer)
- **Oracle Pattern**: External price feeds for accurate valuations
- **Factory Pattern**: Deployment module enables multiple pool instances

### **Testing Strategy**
- Foundry-compatible Solidity tests
- TypeScript integration tests with Viem
- Local chain simulation for fast iteration

---

## 📊 Technical Specifications

### **Contract Metrics**
- **Total Contracts**: 4 (LendingPool, MockUSDT0, UmbrellaOracleAdapter, IPriceOracle)
- **Solidity Version**: 0.8.28
- **OpenZeppelin Version**: 5.4.0
- **Gas Optimization**: Uses immutable variables, packed structs where applicable
- **Upgradeability**: Currently non-upgradeable (can be made upgradeable with proxy pattern)

### **Supported Operations**
- ✅ Deposit collateral (native RBTC)
- ✅ Withdraw collateral (with health checks)
- ✅ Borrow stablecoin (USDT0)
- ✅ Repay debt (partial or full)
- ✅ View portfolio data (collateral, debt, health factor, LTV)
- ✅ Admin functions (oracle update, LTV adjustment)

### **Network Compatibility**
- ✅ Rootstock Testnet (chain ID 31)
- ✅ Local Hardhat network (EDR simulation)
- ✅ Any EVM-compatible chain (with network configuration)

---

## 🚀 Getting Started

### **Prerequisites**
```bash
Node.js 18+
npm or yarn
MetaMask (for testnet deployment)
```

### **Installation**
```bash
cd contracts
npm install
```

### **Compile Contracts**
```bash
npx hardhat compile
```

### **Run Tests**
```bash
npx hardhat test
```

### **Deploy to Rootstock Testnet**
```bash
# Set environment variables
export RSK_TESTNET_RPC=https://public-node.testnet.rsk.co
export PRIVATE_KEY=your_private_key

# Deploy
npx hardhat ignition deploy ignition/modules/LendingPool.ts --network rskTestnet
```

### **Deploy Locally (for testing)**
```bash
npx hardhat ignition deploy ignition/modules/LendingPool.ts
```

---

## 📚 Key Concepts Explained

### **Loan-to-Value (LTV) Ratio**
The maximum percentage of collateral value that can be borrowed. Example:
- Collateral: 1 RBTC @ $65,000 = $65,000
- LTV: 70%
- Max Borrowable: $45,500 USDT0

### **Health Factor**
A metric indicating position safety:
- **> 1.5**: Healthy position ✅
- **1.0 - 1.5**: At risk ⚠️
- **< 1.0**: Critical (liquidation risk) 🚨

Formula: `Health Factor = (Max Borrowable USD) / (Current Debt USD)`

### **Collateralization Ratio**
The ratio of collateral value to debt:
- **> 200%**: Very safe
- **100-200%**: Safe
- **< 100%**: Under-collateralized (liquidation)

---

## 🎯 Use Cases

### **1. Educational Platform**
Perfect for learning DeFi lending mechanics:
- Clear, well-commented code
- Standard DeFi patterns
- Comprehensive documentation

### **2. Prototype Development**
Rapid prototyping of lending features:
- Mock tokens for testing
- Configurable parameters
- Fast local deployment

### **3. Production Foundation**
Base for production lending protocol:
- Security best practices
- Modular oracle integration
- Upgradeable architecture ready

---

## 🔮 Future Enhancements

### **Potential Additions**
- [ ] Interest rate model (dynamic borrowing rates)
- [ ] Liquidation mechanism (automated position closure)
- [ ] Multiple collateral types (ERC20 tokens)
- [ ] Flash loans support
- [ ] Governance token integration
- [ ] Upgradeable proxy pattern
- [ ] Real oracle integration (Chainlink/Umbrella)
- [ ] Multi-chain deployment support

---

## 📖 Additional Resources

- **Hardhat Documentation**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts
- **Rootstock Documentation**: https://developers.rsk.co
- **DeFi Lending Patterns**: https://ethereum.org/en/developers/docs/standards/tokens/erc-20

---


---

## 🙏 Acknowledgments

Built with:
- **Hardhat** - Development framework
- **OpenZeppelin** - Security libraries
- **Rootstock** - Bitcoin-powered smart contract platform
- **Viem** - Type-safe Ethereum library

---

**Built with ❤️ for the DeFi community**

*Where code meets capital, and innovation meets infrastructure.*
