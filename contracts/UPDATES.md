## Updates from Original `rbtc-usdt0-lending-boilerplate`

This folder is based on the official Rootstock **RBTC/USDT0 Simple Lending Boilerplate** and introduces a set of focused upgrades. This document summarizes **what changed** compared to the original repository, so reviewers can quickly see the diff.

---

### 1. Tooling & Dependencies

- **Hardhat**
  - **Before**: Hardhat `^2.22.7` with classic config in `hardhat.config.js`
  - **After**: Hardhat `^3.1.0` with TypeScript config in `hardhat.config.ts`
  - Uses EDR (Ethereum Development Runtime) profiles and network types (`edr-simulated`, `http`)

- **OpenZeppelin Contracts**
  - **Before**: `@openzeppelin/contracts@4.9.6`
  - **After**: `@openzeppelin/contracts@^5.4.0`
  - All imports in `LendingPool.sol`, `MockUSDT0.sol`, and `UmbrellaOracleAdapter.sol` updated to OZ v5 paths

- **Additional Dev Tooling**
  - Added `@nomicfoundation/hardhat-ignition` for declarative deployments
  - Added `@nomicfoundation/hardhat-toolbox-viem` for Viem-based interactions
  - Added TypeScript tooling (`typescript`, `@types/node`) and `tsconfig.json`

---

### 2. Hardhat Configuration

- **Config File**
  - **Before**: `hardhat.config.js` (CommonJS, Hardhat v2)
  - **After**: `hardhat.config.ts` (TypeScript, Hardhat v3)

- **Key Changes**
  - Uses `defineConfig` from `hardhat/config`
  - Defines Solidity profiles (`default`, `production`) with optimizer settings
  - Introduces structured network config:
    - `hardhatMainnet` / `hardhatOp` using `edr-simulated`
    - `rskTestnet` / `rskMainnet` using `http` with `configVariable`-based env resolution
  - Keeps original Rootstock networks (`RSK_TESTNET_RPC`, `RSK_MAINNET_RPC`, `PRIVATE_KEY`) but via typed config

---

### 3. Deployment Flow (Hardhat Ignition)

- **New**: `ignition/modules/LendingPool.ts`
  - Deploys:
    - `MockUSDT0` with configurable initial supply
    - `UmbrellaOracleAdapter` oracle
    - `LendingPool` with configurable `ltvBps`
  - Sets oracle prices for:
    - `address(0)` → RBTC price (e.g. `$65,000`)
    - `usdt0 address` → USDT0 price (`$1`)
  - Seeds the pool with configurable USDT0 liquidity
  - Exposes `{ usdt0, oracle, pool }` for integrations

- **Artifacts Handling**
  - **Before**: No Ignition folder
  - **After**: Ignition **module only** tracked in git
  - Ignition `deployments/` and build artifacts are **excluded** via `.gitignore`

---

### 4. Scripts & NPM Commands

- **Scripts (unchanged in behavior, consolidated with new ones)**
  - `scripts/demo.js` – Local Hardhat demo (kept from original)
  - `scripts/demo-testnet.js` – RSK testnet script (kept from original)

- **`package.json` scripts**
  - **Before**:
    - `build`, `demo`, `local`, `test`
  - **After**:
    - `build` – `hardhat compile`
    - `demo` – `hardhat run scripts/demo.js`
    - `demo:testnet` – `hardhat run --network rskTestnet scripts/demo-testnet.js`
    - `local` – `hardhat node`
    - `test` – `hardhat test`
    - `deploy` – `hardhat ignition deploy ignition/modules/LendingPool.ts`
    - `deploy:testnet` – `hardhat ignition deploy --network rskTestnet ignition/modules/LendingPool.ts`

---

### 5. Solidity Contracts

The business logic of the contracts remains the **same** as the original boilerplate; only imports and minor constructor patterns were updated for OZ v5 and consistency.

- `contracts/LendingPool.sol`
  - Updated imports to OZ v5:
    - `@openzeppelin/contracts/token/ERC20/IERC20.sol`
    - `@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol`
    - `@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
    - `@openzeppelin/contracts/access/Ownable.sol`
    - `@openzeppelin/contracts/utils/ReentrancyGuard.sol`
  - Constructor updated to `Ownable(msg.sender)` (OZ v5 pattern)
  - Core lending logic (deposit, borrow, repay, withdraw, HF) unchanged

- `contracts/tokens/MockUSDT0.sol`
  - Updated imports to OZ v5:
    - `@openzeppelin/contracts/token/ERC20/ERC20.sol`
    - `@openzeppelin/contracts/access/Ownable.sol`
  - Constructor uses `Ownable(msg.sender)` (OZ v5)

- `contracts/oracles/UmbrellaOracleAdapter.sol`
  - Updated `Ownable` import to OZ v5 path
  - Logic (owner-settable prices, batch updates) unchanged

---

### 6. Repository & Metadata

- **LICENSE**
  - Kept original MIT license text from RootstockLabs

- **SECURITY.MD**
  - Kept original security reporting instructions

- **README.md**
  - Started from original README
  - Added **\"What's New in v0.2.0\"** section to clearly describe:
    - Hardhat v3 upgrade
    - OpenZeppelin v5 upgrade
    - Ignition + TypeScript additions
  - Kept original quick start, examples, and disclaimers

- **Replit Files**
  - `.replit` and `replit.md` copied and lightly updated to mention new tooling
  - `.local/` and `.config/` **NOT** included (they are machine-specific and were intentionally left out)

---

### 7. What Did NOT Change

To respect the original boilerplate, the following **behaviors remain unchanged**:

- Core lending flow:
  - Deposit RBTC → Borrow USDT0 → Repay USDT0 → Withdraw RBTC
- Health factor and LTV calculations
- Oracle interface and price semantics (USD prices with 18 decimals)
- Demo scripts' overall behavior (only tooling around them was enhanced)

---

### 8. How to View the Diff in the PR

When you open the PR against the original `rbtc-usdt0-lending-boilerplate` repo, focus on:

- `hardhat.config.ts` (replaces `hardhat.config.js`)
- `package.json` (version bump + deps + scripts)
- `contracts/**/*.sol` (import lines + constructors)
- `ignition/modules/LendingPool.ts` (new)
- `.gitignore` (ensures artifacts and Ignition deployments are ignored)
- `README.md` (new \"What's New\" section, rest preserved)

These are the **only intentional changes**; everything else is either copied as-is from the original or generated by the upgraded tooling.

