<p align="center">
  <img src="https://img.shields.io/badge/Algorand-Testnet-00C8FF?style=for-the-badge&logo=algorand&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/AlgoKit-2.10-black?style=for-the-badge" />
  <a href="https://uni-trust-id.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-▶_uni--trust--id.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white" /></a>
</p>

# 🔐 UniTrustID — Decentralized Identity for Campus Ecosystem

**UniTrustID** is a decentralized identity (DID) management system built on the **Algorand blockchain**. It enables universities to issue, manage, and verify tamper-proof digital credentials for students — anchored on-chain with real transactions that can be verified on the [Lora Block Explorer](https://lora.algokit.io/testnet).

> Built with [AlgoKit](https://developer.algorand.org/algokit/), Pera Wallet, Defly Wallet, and the W3C DID specification.

---

## ✨ Features

| Feature | Description |
|---|---|
| **🪪 DID Creation** | Generate W3C-compliant `did:algo:` identifiers anchored on Algorand Testnet via a real 1-ALGO self-transfer transaction |
| **📱 Wallet Integration** | Connect using **Pera Wallet** or **Defly Wallet** via QR code scanning (mobile) |
| **🎓 Verifiable Credentials** | Issue credentials — StudentID, Library Access, Hostel Resident, Event Attendee, Course Enrollment |
| **🔏 Selective Disclosure** | Share only specific claims from a credential (e.g., share department without revealing CGPA) |
| **🏫 Campus Services** | Simulate credential verification for Library, Hostel, Events, and Exam Hall services |
| **🔗 On-Chain Verification** | Every DID anchor is a real Algorand transaction viewable on [Lora Explorer](https://lora.algokit.io/testnet) |
| **🌗 Dark / Light Theme** | Toggle between dark and light mode with persistent preference |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UniTrustID Frontend               │
│              (React + TypeScript + Vite)              │
├─────────────┬───────────────┬───────────────────────┤
│  DID Module │  Credentials  │  Selective Disclosure  │
│  (W3C DID)  │  (VC Issue)   │  (ZK-style reveal)    │
├─────────────┴───────────────┴───────────────────────┤
│           @txnlab/use-wallet-react v4                │
│         (Pera Wallet + Defly Wallet SDKs)            │
├─────────────────────────────────────────────────────┤
│              algosdk v3 (Transaction Layer)           │
│         1-ALGO self-transfer with DID note           │
├─────────────────────────────────────────────────────┤
│            Algorand Testnet (AlgoNode API)            │
│          https://testnet-api.algonode.cloud           │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
UniTrustID/
├── frontend/                          # React + TypeScript frontend
│   ├── index.html                     # Entry HTML
│   ├── package.json                   # Node dependencies
│   ├── tsconfig.json                  # TypeScript config
│   ├── vite.config.ts                 # Vite + polyfills config
│   └── src/
│       ├── main.tsx                   # Entry point + ErrorBoundary
│       ├── App.tsx                    # Root component (routing, state)
│       ├── components/
│       │   ├── WalletScreen.tsx       # Pera / Defly wallet connection
│       │   ├── OverviewTab.tsx        # DID dashboard + Lora link
│       │   ├── CredentialsTab.tsx     # Credential cards + issuance
│       │   ├── ServicesTab.tsx        # Campus service verification
│       │   ├── ProfileTab.tsx         # DID document viewer
│       │   ├── SelDiscModal.tsx       # Selective disclosure modal
│       │   ├── Console.tsx            # Blockchain log viewer
│       │   ├── CredCard.tsx           # Individual credential card
│       │   ├── WalletChip.tsx         # Connected wallet badge
│       │   └── Toast.tsx              # Toast notifications
│       ├── lib/
│       │   ├── algoNode.ts            # Algorand Testnet txn helpers
│       │   ├── did.ts                 # W3C DID generation & documents
│       │   ├── credentials.ts         # Credential issuance & disclosure
│       │   ├── walletProvider.tsx      # WalletManager (Pera + Defly)
│       │   ├── types.ts               # Shared TypeScript interfaces
│       │   └── utils.ts               # Crypto & utility helpers
│       └── styles/
│           ├── globals.css            # Global styles + theme variables
│           ├── header.css             # Header + logo + theme toggle
│           ├── wallet.css             # Wallet connection screen
│           ├── credentials.css        # Credential cards
│           ├── services.css           # Services tab
│           ├── profile.css            # Profile / DID doc viewer
│           └── modal.css              # Selective disclosure modal
├── smart_contracts/                   # Algorand smart contracts (AlgoKit)
│   ├── __main__.py
│   ├── __init__.py
│   └── hello_world/
│       ├── contract.py                # ARC4 HelloWorld contract
│       └── deploy_config.py           # Deployment configuration
├── pyproject.toml                     # Python / Poetry config
└── .algokit.toml                      # AlgoKit project config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.12
- **AlgoKit CLI** ≥ 2.x — `pipx install algokit`
- **Pera Wallet** or **Defly Wallet** mobile app (for signing transactions)
- Algorand Testnet account with ≥ 2 ALGO — get free testnet ALGO from the [dispenser](https://bank.testnet.algorand.network/)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/UniTrustID.git
cd UniTrustID/projects/CampusID
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start the Development Server

```bash
# Windows (use local Vite binary)
.\node_modules\.bin\vite.cmd --port 5173

# macOS / Linux
./node_modules/.bin/vite --port 5173
```

Open **http://localhost:5173** in your browser.

### 4. Connect Your Wallet & Create DID

1. Click **Connect Pera Wallet** (or Defly)
2. Scan the QR code with your mobile wallet app
3. Fill in your campus profile — Name, Student ID, Email, Department
4. Click **ANCHOR DID ON ALGORAND**
5. Approve the 1-ALGO transaction in your wallet app
6. View the confirmed transaction on [Lora Explorer](https://lora.algokit.io/testnet)

---

## ⚙️ Smart Contracts (Optional)

The project includes an AlgoKit-based smart contract scaffold:

```bash
# Activate Python virtual environment
# Windows
.venv/Scripts/Activate.ps1
# macOS / Linux
source .venv/bin/activate

# Build contracts
python -m smart_contracts build
```

---

## 🔑 How It Works

### DID Creation Flow

```
User fills profile → Generate did:algo:<address>
                   → Build W3C DID Document
                   → Create 1-ALGO self-transfer txn with DID note
                   → Sign via Pera/Defly wallet (mobile approval)
                   → Broadcast to Algorand Testnet
                   → Confirm on-chain → View on Lora Explorer
```

### On-Chain Transaction Note

Every DID is anchored as a **1-ALGO payment transaction** (self-transfer) with a compact JSON note field:

```json
{
  "t": "DID_ANCHOR",
  "v": 1,
  "did": "did:algo:PWW7ASSQVVHMMVLB4ZTCT47XAWQWSF6KU74TVEXKC3J37LC2NWNNSPFK3I",
  "m": {
    "name": "Prem Kumar Kuppili",
    "studentId": "23RA1A6675",
    "department": "Artificial Intelligence & Machine Learning"
  }
}
```

### Credential Types

| Credential | Icon | Issuer |
|---|---|---|
| Student ID | 🎓 | Campus Registrar Office |
| Library Access | 📚 | University Library |
| Hostel Resident | 🏠 | Hostel Administration |
| Event Attendee | 🎪 | Student Affairs |
| Course Enrollment | 📖 | Academic Office |

### Selective Disclosure

When a campus service requests verification, users choose exactly which claims to reveal:

- ✅ **Share**: Student ID, Department
- 🚫 **Withhold**: CGPA, Email, Phone

This follows **privacy-by-design** principles — only the minimum required information is disclosed.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Algorand Testnet (AlgoNode API) |
| **SDK** | algosdk v3.5.2 |
| **Wallet** | @txnlab/use-wallet-react v4.6.0, Pera Wallet, Defly Wallet |
| **Frontend** | React 18.2, TypeScript 5.3, Vite 5.4 |
| **Smart Contracts** | AlgoKit 2.x, Algorand Python (ARC4) |
| **Identity Standard** | W3C DID Core v1.0, Verifiable Credentials |
| **Explorer** | [Lora Block Explorer](https://lora.algokit.io/testnet) |

---

## 🔒 Security & Privacy

- **Private keys never leave the wallet** — all transactions are signed on the mobile device via Pera/Defly
- **No central database** — DID anchors live on the Algorand blockchain
- **Selective disclosure** — users control exactly which credential claims are revealed
- **Tamper-proof** — credentials are cryptographically signed and can be independently verified
- **On-chain auditability** — every DID anchor transaction is publicly verifiable on Lora

---

## 🗺️ Roadmap

- [x] W3C DID generation (`did:algo:`)
- [x] On-chain DID anchoring (1-ALGO transaction)
- [x] Pera Wallet & Defly Wallet integration
- [x] Verifiable Credential issuance (5 types)
- [x] Selective disclosure for campus services
- [x] Lora Explorer transaction links
- [x] Dark / Light theme toggle
- [ ] DID resolution service (off-chain resolver)
- [ ] Credential revocation list
- [ ] Multi-university federation
- [ ] Mobile-native app (React Native)
- [ ] ARC-19 / ARC-69 NFT-based credentials

---

## 👨‍💻 Author

**Prem Kumar Kuppili**
- GitHub: [@Premkumar1845](https://github.com/Premkumar1845)
- Email: premshyam48@gmail.com

---

## 📄 License

This project is built for academic/educational purposes as part of a campus decentralized identity initiative.

---

<p align="center">
  Built with ❤️ on <strong>Algorand</strong>
</p>

