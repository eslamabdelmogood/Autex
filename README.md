# Black Dragon: Industrial AI Command Center

Black Dragon is a high-fidelity predictive maintenance platform built for industrial smart monitoring. It combines local Edge AI with Cloud-based Generative AI to ensure machine reliability and operational efficiency.

## Core Features

- **Edge AI (Local Inference)**: Real-time vibration analysis using Edge Impulse patterns to detect bearing wear and component fatigue locally.
- **Gemini Cloud Analysis**: Escalation to Google Gemini for technical maintenance plans, troubleshooting, and inventory integration.
- **Black Box Mode**: Firestore Offline Persistence with a 40MB cache limit for reliable data logging in disconnected industrial environments.
- **Multilingual Support**: Fully localized in English and Arabic with automatic RTL (Right-to-Left) layout switching.
- **HPI (Health Performance Index)**: An aggregate AI score tracking the real-time status of the machinery.
- **Green Box Expansion**: Conditional UI unlocking advanced spectral analysis for users with external hardware connectivity.
- **Proof-of-Condition**: Digital certificate generation documenting health history to increase asset resale value.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **AI**: Genkit with Google Gemini & Edge Impulse (Local)
- **Charts**: Recharts (Spectral Telemetry & Time Domain)

## Getting Started

1. Set your `GOOGLE_GENAI_API_KEY` and `GEMINI_API_KEY` in the environment.
2. Connect your hardware via the "Connect" button in the dashboard (Web Serial API supported).
3. Toggle "Test Anomaly" to simulate an industrial fault and trigger the AI escalation flow.
