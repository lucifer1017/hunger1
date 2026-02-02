[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/rbtc-usdt0-lending-boilerplate/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/rbtc-usdt0-lending-boilerplate)
[![CodeQL](https://github.com/rsksmart/rbtc-usdt0-lending-boilerplate/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/rbtc-usdt0-lending-boilerplate/actions?query=workflow%3ACodeQL)

<img src="rootstock-logo.png" alt="RSK Logo" style="width:100%; height: auto;" />

# RBTC/USDT0 Simple Lending Boilerplate

> **Goal:** a simple, runnable boilerplate that demonstrates how to:
> - Deposit **RBTC (native)** as collateral,
> - Borrow `USDT0 (ERC-20, 6 decimals)`,
> - Query prices via a simple **UmbrellaOracleAdapter** (mock),
> - Compute **health factor** — all in a few minutes.

⚠️ **Educational only. Not audited. Do NOT deploy to mainnet.**

## What's New in v0.2.0

This version upgrades the boilerplate to modern tooling:

- **Hardhat v3.1.0** with EDR (Ethereum Development Runtime) support
- **OpenZeppelin v5.4.0** for latest security best practices
- **Hardhat Ignition v3** for declarative deployments
- **TypeScript configuration** for type-safe development
- **Viem integration** for modern Ethereum interactions

## Quick Start (local / Replit)

1) **Install** (first run only):
```bash
npm install
```

2) **Run the end‑to‑end demo** (compiles + deploys locally + interacts):
```bash
npm run demo
```

You will see logs:
- Deployer & user addresses
- Deployed contract addresses (USDT0, Oracle, Pool)
- Account snapshots after **deposit**, **borrow**, **repay**, **withdraw**

Here's how it looks:

```bash

> rbtc-usdt0-lending-boilerplate@0.2.0 demo
> hardhat run scripts/demo.js

Compiled 13 Solidity files successfully (evm target: paris).
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Alice   : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
USDT0  : 0x5FbDB2315678afecb367f032d93F642f64180aa3
Oracle : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Pool   : 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Alice deposited 0.01 RBTC

== After deposit ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 0.0
Collateral USD   : 650.0
Debt USD         : 0.0
Max Debt USD     : 455.0
Health Factor    : 115792089237316195423570985008687907853269984665640564039457.584007913129639935
Alice borrowed 400 USDT0

== After borrow ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 400.0
Collateral USD   : 650.0
Debt USD         : 400.0
Max Debt USD     : 455.0
Health Factor    : 1.1375
Alice repaid 200 USDT0

== After repay ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 200.0
Collateral USD   : 650.0
Debt USD         : 200.0
Max Debt USD     : 455.0
Health Factor    : 2.275
Alice withdrew 0.002 RBTC

== After withdraw ==
Collateral (RBTC): 0.008
Debt (USDT0)     : 200.0
Collateral USD   : 520.0
Debt USD         : 200.0
Max Debt USD     : 364.0
Health Factor    : 1.82

Demo complete ✅

```

> On Hardhat, the "native RBTC" is just the local chain's native coin. The boilerplate treats it as RBTC for consistency.


## Deploy to Rootstock (optional)

### Using Hardhat Ignition (Recommended)

1) **Configure Environment**:

Copy `.env.example` → `.env`, and fill in the values:

```text
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RSK_TESTNET_RPC=https://public-node.testnet.rsk.co
RSK_MAINNET_RPC=https://public-node.rsk.co
```

2) **Get tRBTC**:

You can get tRBTC from the [Rootstock Faucet](https://faucet.rootstock.io/). You would need at least `0.03 tRBTC` to cover deployment and transaction fees.

3) **Deploy using Ignition**:

```bash
npm run deploy:testnet
```

This deploys all contracts (MockUSDT0, Oracle, LendingPool) and configures them automatically.

### Using Demo Script (Alternative)

Run the interactive demo on testnet:

```bash
npm run demo:testnet
```

Result:

```bash
Deployer: 0x112621448Eb148173d5b00edB14B1f576c58cCEE
USDT0  : 0xf7F1Fe4c7dea6401Ae4e486502832782247E7A0f decimals: 6n
Oracle : 0xf9C3D70C33CBa0be571df7B9E3f0697C8ef40d69
Pool   : 0xC09Fe81b40DB2a013017bc2BcFfc718A25C45Cd3
Deposited RBTC: 0.01

== After deposit ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 0.0
Collateral USD   : 1110.0
Debt USD         : 0.0
Max Debt USD     : 777.0
Health Factor    : 115792089237316195423570985008687907853269984665640564039457.584007913129639935
Borrowed USDT0 ~ 738.15

== After borrow ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 738.15
Collateral USD   : 1110.0
Debt USD         : 738.15
Max Debt USD     : 777.0
Health Factor    : 1.052631578947368421
Repaid USDT0 ~ 295.26

== After repay ==
Collateral (RBTC): 0.01
Debt (USDT0)     : 442.89
Collateral USD   : 1110.0
Debt USD         : 442.89
Max Debt USD     : 777.0
Health Factor    : 1.754385964912280701
Withdrew RBTC: 0.002

== After withdraw ==
Collateral (RBTC): 0.008
Debt (USDT0)     : 442.89
Collateral USD   : 888.0
Debt USD         : 442.89
Max Debt USD     : 621.6
Health Factor    : 1.403508771929824561

Demo testnet completed ✅
```

\> If you get the error: `ProviderError: insufficient funds to pay for pending and new transactions`

- Note: Ensure to have sufficient tRBTC of at least `0.003 tRBTC` to cover deployment and transaction fees.

## Using Real USDT0

For real deployments, replace `MockUSDT0.sol` with the actual USDT0 token address on Rootstock Testnet (e.g., 0x779Ded0c9e1022225f8E0630b35a9b54bE713736).

Modify your deployment script to use the existing address instead of deploying the mock token:

```js
  // --- ORIGINAL CODE (Mocks deployment) ---
  // const MockUSDT0 = await ethers.getContractFactory("MockUSDT0");
  // const usdt0 = await MockUSDT0.deploy(ethers.parseUnits("1000000", 6));
  // await usdt0.waitForDeployment();
  // const usdt0Addr = await usdt0.getAddress();

  // --- REPLACEMENT CODE (Real USDT0 address) ---
  const REAL_USDT0_ADDRESS = "0x779Ded0c9e1022225f8E0630b35a9b54bE713736"; 
  const usdt0Addr = REAL_USDT0_ADDRESS;
  console.log(`USDT0 Address Used: ${usdt0Addr}`);
```

Keep the oracle mapping: `address(0)` stands for native **RBTC**; `address(USDT0)` for USDT0.

## Contracts Overview (minimal unit)

- **contracts/LendingPool.sol**  
  Core logic to deposit native **rBTC**, borrow **USDT0**, check solvency with **LTV**, compute **health factor**.
  - `depositRBTC()` payable
  - `borrowUSDT0(amount)`
  - `repayUSDT0(amount)`
  - `withdrawRBTC(amount)`
  - `getAccountData(user)` returns collateral/debt in tokens + **USD** and **HF**

- **contracts/oracles/UmbrellaOracleAdapter.sol**  
  Simple, owner‑settable prices (USD with **18 decimals**). Replace this with a real oracle adapter later.

- **contracts/interfaces/IPriceOracle.sol**  
  Minimal interface: `getPrice(asset) → priceE18`

- **contracts/tokens/MockUSDT0.sol**  
  ERC‑20 with **6 decimals**, mintable. Used only for quick demos.

**Decimals & math**:
- Oracle returns **USD price with 18 decimals** for both assets.
- RBTC has **18 decimals**, USDT0 has **6 decimals**. The pool normalizes to **1e18** for USD math.

---

## Minimal Interaction Examples

- **Deposit** 0.01 rBTC:
```js
await pool.depositRBTC({ value: ethers.parseEther("0.01") });
```

- **Borrow** 400 USDT0:
```js
await pool.borrowUSDT0(ethers.parseUnits("400", 6));
```

- **Repay** 200 USDT0:
```js
await usdt0.approve(poolAddr, ethers.parseUnits("200", 6));
await pool.repayUSDT0(ethers.parseUnits("200", 6));
```

- **Withdraw** 0.002 rBTC (keeps HF ≥ 1):
```js
await pool.withdrawRBTC(ethers.parseEther("0.002"));
```

- **Set prices** in the mock adapter (owner only):
```js
await oracle.setBatch(
  [ethers.ZeroAddress, usdt0Addr],
  [ethers.parseUnits("65000", 18), ethers.parseUnits("1", 18)]
);
```

## Omitted features (to keep it simple)

- Interest accrual (no time‑based rates)
- aTokens/cTokens or interest‑bearing receipts
- Liquidations, close/liq factors
- Pause/role systems beyond `Ownable`
- Multiple collateral/borrow assets
- Real oracle wiring (we use a minimal mock adapter)

This boilerplate is meant as a **first step**, you can fork and extend into a full money market.

## File Tree

```
contracts/
  interfaces/IPriceOracle.sol
  LendingPool.sol
  oracles/UmbrellaOracleAdapter.sol
  tokens/MockUSDT0.sol
ignition/
  modules/LendingPool.ts
scripts/
  demo.js
  demo-testnet.js
hardhat.config.ts
package.json
.env.example
README.md
```

## Documentation

Visit our [Rootstock docs](https://dev.rootstock.io) to learn how to start building with Rootstock.

## Contributing

We welcome contributions from the community. Please fork the repository and submit pull requests with your changes. Ensure your code adheres to the project's main objective.

## Support

For any questions or support, please open an issue on the repository or reach out to the maintainers.

# Disclaimer

The software provided in this GitHub repository is offered "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.

- **Testing:** The software has not undergone testing of any kind, and its functionality, accuracy, reliability, and suitability for any purpose are not guaranteed.
- **Use at Your Own Risk:** The user assumes all risks associated with the use of this software. The author(s) of this software shall not be held liable for any damages, including but not limited to direct, indirect, incidental, special, consequential, or punitive damages arising out of the use of or inability to use this software, even if advised of the possibility of such damages.
- **No Liability:** The author(s) of this software are not liable for any loss or damage, including without limitation, any loss of profits, business interruption, loss of information or data, or other pecuniary loss arising out of the use of or inability to use this software.
- **Sole Responsibility:** The user acknowledges that they are solely responsible for the outcome of the use of this software, including any decisions made or actions taken based on the software's output or functionality.
- **No Endorsement:** Mention of any specific product, service, or organization does not constitute or imply endorsement by the author(s) of this software.
- **Modification and Distribution:** This software may be modified and distributed under the terms of the license provided with the software. By modifying or distributing this software, you agree to be bound by the terms of the license.
- **Assumption of Risk:** By using this software, the user acknowledges and agrees that they have read, understood, and accepted the terms of this disclaimer and assumes all risks associated with the use of this software.
