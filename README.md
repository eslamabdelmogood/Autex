# Black Dragon: Industrial AI Command Center & Maintenance Agent

Black Dragon is a high-fidelity predictive maintenance platform built for industrial smart monitoring. It functions as a **Hybrid AI Agentic System**, combining local Edge AI for real-time perception with Cloud-based Generative AI for complex technical reasoning and maintenance strategy.

## Core Features

- **Agentic Maintenance Engine**: Powered by Genkit and Google Gemini, the system acts as a technical agent that reasons through equipment failures and uses tools to check inventory and suggest fixes.
- **Edge AI Perception (Local Inference)**: Real-time vibration analysis using Edge Impulse patterns to detect bearing wear and component fatigue locally.
- **Black Box Ledger**: Firestore Offline Persistence with a 40MB cache limit for reliable, immutable data logging in disconnected industrial environments.
- **HPI (Health Performance Index)**: An aggregate AI score tracking the real-time status of the machinery.
- **Multilingual Command Center**: Fully localized in English and Arabic with automatic RTL (Right-to-Left) layout switching.
- **Proof-of-Condition**: Digital certificate generation documenting health history to increase asset resale value.

## AI Architecture

### 1. Perception Layer (Edge)
A local machine learning model parses high-frequency sensor data at the edge. It is designed for "Edge Survival," functioning without internet connectivity to ensure immediate machine safety.

### 2. Reasoning Layer (Cloud Agent)
When the edge layer detects a fault, it escalates to a Genkit-based agent. This agent:
- Analyzes the severity of the telemetry.
- **Uses Tools** to query industrial databases for spare parts.
- Formulates a technical recommendation based on the specific machine type and fault history.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Genkit with Google Gemini & Edge Impulse (Local)
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **Persistence**: Firestore Offline Persistence (40MB Cache)
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts (Spectral Telemetry & Time Domain)

## Getting Started

1. Set your `GOOGLE_GENAI_API_KEY` and `GEMINI_API_KEY` in the environment.
2. Connect your hardware via the "Connect" button in the dashboard (Web Serial API supported).
3. Toggle "Test Anomaly" to simulate an industrial fault and trigger the AI agent escalation flow.
