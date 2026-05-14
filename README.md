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

## AI Architecture

### 1. Perception Layer (Edge)
A local machine learning model parses high-frequency sensor data at the edge. It ensures immediate vehicle safety by detecting faults (like misfires) without needing an internet connection.

### 2. Reasoning Layer (Cloud Agent)
When the edge layer detects a fault, it escalates to a Genkit-based agent. This agent:
- Analyzes the severity of the OBD telemetry.
- **Uses Tools** to query automotive databases for spare parts.
- Formulates a technical recommendation tailored to the specific vehicle model.

## Market Strategy & Competitive Edge

Black Dragon is a **Category Disruptor** in the Automotive Aftermarket:

1. **Hybrid Intelligence Advantage**: Performs critical engine safety analysis at the edge, eliminating latency and ensuring "Edge Survival" during remote trips.
2. **The Elite "CARFAX"**: Issues immutable "Proof-of-Condition" certificates, transforming maintenance records into value-protectors for high-value vehicle resale.
3. **Strategic Localization**: Full RTL Arabic support targets the massive automotive growth in the Middle East (e.g., NEOM, Aramco projects).
4. **Frictionless Onboarding**: Using the Web Serial API and PWA technology, it runs on standard hardware (laptops/phones) via a standard OBD-II cable.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Genkit with Google Gemini & Edge Impulse (Local)
- **Database/Auth**: Firebase Firestore & Authentication
- **Persistence**: Firestore Offline Persistence (40MB Cache)
- **Styling**: Tailwind CSS & ShadCN UI
- **Charts**: Recharts (Spectral Telemetry)

## Getting Started

### Using on Laptop (Direct OBD-II Connection)
1. Set your `GEMINI_API_KEY` in the environment.
2. Plug your OBD-II to USB cable into your laptop's USB port.
3. Use Chrome or Edge browser.
4. Click **"Connect"** and select the Serial Port.

### Using on Smartphone (PWA)
1. **Install**: Open the dashboard in Chrome (Android) or Safari (iOS) and select "Add to Home Screen".
2. **Android**: Use a USB-C OTG adapter to plug your cable directly into the phone.
3. **iOS Strategy**: Use your phone as a **Remote Viewer**. Log data via a laptop hub; the **Black Box Ledger** will automatically sync history to your phone.
