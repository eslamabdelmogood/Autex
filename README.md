
# Black Dragon: Industrial AI Command Center & Maintenance Agent

Black Dragon is a high-fidelity predictive maintenance platform built for industrial smart monitoring. It functions as a **Hybrid AI Agentic System**, combining local Edge AI for real-time perception with Cloud-based Generative AI for complex technical reasoning and maintenance strategy.

## Core Features

- **Agentic Maintenance Engine**: Powered by Genkit and Google Gemini, the system acts as a technical agent that reasons through equipment failures and uses tools to check inventory and suggest fixes.
- **Edge AI Perception (Local Inference)**: Real-time vibration analysis using Edge Impulse patterns to detect bearing wear and component fatigue locally.
- **Black Box Ledger**: Firestore Offline Persistence with a 40MB cache limit for reliable, immutable data logging in disconnected industrial environments.
- **HPI (Health Performance Index)**: An aggregate AI score tracking the real-time status of the machinery.
- **Multilingual Command Center**: Fully localized in English and Arabic with automatic RTL (Right-to-Left) layout switching.
- **Proof-of-Condition**: Digital certificate generation documenting health history to increase asset resale value.
- **PWA Ready**: Installable on mobile devices with offline-first capabilities for "Edge Survival" in the field.

## AI Architecture

### 1. Perception Layer (Edge)
A local machine learning model parses high-frequency sensor data at the edge. It is designed for "Edge Survival," functioning without internet connectivity to ensure immediate machine safety.

### 2. Reasoning Layer (Cloud Agent)
When the edge layer detects a fault, it escalates to a Genkit-based agent. This agent:
- Analyzes the severity of the telemetry.
- **Uses Tools** to query industrial databases for spare parts.
- Formulates a technical recommendation based on the specific machine type and fault history.

## Business & ROI Model (Monetization)

The Black Dragon platform generates revenue through three primary channels:

1.  **Hardware Sales**: The "Green Box" external precision unit for high-fidelity 1ms sampling.
2.  **Maintenance-as-a-Service (SaaS)**: Tiered subscriptions for the Generative AI Reasoning layer and automated strategy generation.
3.  **Certification Fees**: Fee-per-issue for immutable "Proof-of-Condition" certificates, used by asset owners to prove machine value during resale or insurance audits.
4.  **Energy Optimization**: Gain-sharing model based on detected fuel/power efficiency improvements.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Genkit with Google Gemini & Edge Impulse (Local)
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **Persistence**: Firestore Offline Persistence (40MB Cache)
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts (Spectral Telemetry & Time Domain)

## Getting Started & Mobile Use

### Using on Laptop (Direct Connection)
1. Set your `GOOGLE_GENAI_API_KEY` and `GEMINI_API_KEY` in the environment.
2. Plug your OBD-II or Industrial Sensor cable into your laptop's USB port.
3. Use Chrome or Edge browser.
4. Click **"Connect"** and select the corresponding Serial Port.

### Using on Smartphone (PWA)
1. **Install**: Open the dashboard in Chrome (Android) or Safari (iOS) and select "Add to Home Screen".
2. **Android Connection**: Use a USB-C OTG adapter to plug your cable directly into the phone. Chrome on Android supports Web Serial.
3. **iOS Strategy**: Since Safari restricts USB serial, use your phone as a **Remote Viewer**. Log data using a laptop hub, and the **Black Box Ledger** will automatically sync the history to your phone for mobile review and certification generation.

