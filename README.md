
# Black Dragon: Automotive AI Command Center & Maintenance Agent

Black Dragon is a high-fidelity predictive maintenance platform built for automotive smart monitoring. It functions as a **Hybrid AI Agentic System**, combining local Edge AI for real-time engine perception with Cloud-based Generative AI for technical reasoning and diagnostic strategy.

## Core Features

- **Agentic Maintenance Engine**: Powered by Genkit and Google Gemini, the system acts as a master mechanic agent that reasons through engine failures and suggests precise automotive fixes.
- **Edge AI Perception (Local Inference)**: Real-time vibration and RPM analysis using Edge Impulse patterns to detect misfires and component fatigue locally.
- **Black Box Ledger**: Firestore Offline Persistence with a 40MB cache limit for reliable, immutable vehicle logging in disconnected environments.
- **HPI (Health Performance Index)**: An aggregate AI score tracking the real-time status of the vehicle engine.
- **Multilingual Command Center**: Fully localized in English and Arabic with automatic RTL layout switching.
- **Proof-of-Condition**: Digital vehicle health certificates documenting performance history to increase asset resale value.
- **PWA Ready**: Installable on mobile devices with offline-first capabilities for "Edge Survival" on the road.

## Agentic Architecture
Black Dragon operates as a two-tier agent:
1. **The Sentinel (Local)**: A low-latency perception agent that watches for mechanical anomalies.
2. **The Strategist (Cloud)**: A reasoning agent that uses tools to query inventory and formulate repair plans.

## Getting Started

### 1. Using on Laptop (Direct Connection)
1. Set your `GEMINI_API_KEY` in the environment.
2. Plug your OBD-II to USB cable (ELM327) into your laptop.
3. Use Chrome or Edge browser.
4. Click **"Connect OBD-II"** and select the Serial Port.

### 2. Using on Smartphone (PWA)
1. **Installation**: Open the app in Chrome (Android) or Safari (iOS) and select **"Add to Home Screen"**. Launch the app from your home screen.
2. **Android**: Use a **USB-C OTG adapter** to plug your cable directly into your phone. Click "Connect" in Chrome.
3. **iOS (Remote Command Viewer)**: Since direct USB is restricted by Apple, connect the cable to a laptop. This PWA will automatically sync your dashboard data to your phone via the **Black Box Ledger** in real-time.

## Monetization Model
- **Hardware Tier**: Sale of the high-precision "Green Box" OBD bridge.
- **Agent SaaS**: Subscription-based access to the Cloud Reasoning engine.
- **Certificate Fee**: Per-issue fee for the Digital Proof-of-Condition certificates.
