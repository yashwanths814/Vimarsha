
## 🏆 National Recognition – Smart India Hackathon (SIH)

**VIMARSHA / LUMINA – Laser Unique Marking & Inspection for Rail Assets**  
was officially selected for the **Smart India Hackathon (SIH)**, India’s largest open innovation competition organized by the **Government of India**.

The project solves a **real, large-scale operational problem faced by Indian Railways**—the absence of a permanent, intelligent, and automated system to identify, verify, and inspect railway track fittings.

---

## Smart India Hackathon Journey

- **Problem Statement ID:** SIH25021  
- **Problem Statement Title:**  
  *AI based development of Laser based QR Code marking on track fittings on Indian Railways*
- **Theme:** Transportation & Logistics  
- **Category:** Hardware + Software  
- **Team Name:** Vimarsha  
- **Team ID:** 51849  

Out of **305+ idea submissions across India**, our project was:

- ✅ **Selected at the national level**
- 🏅 **Shortlisted among the Top 5 teams**
- 🧠 **Grand Finalist**
- 🏫 Participated in a **5-day National Level Hackathon**  
  held at **Amal Jyothi College of Engineering, Kerala**

This selection validates the **innovation, feasibility, and real-world impact** of the solution.

---

## 🚧 Problem Faced by Indian Railways

Indian Railways currently faces challenges such as:

- No permanent digital identity for track fittings
- Manual and error-prone inspections
- Delayed fault reporting
- Poor asset traceability across lifecycle
- High dependency on human labor in harsh environments

---

## 💡 Proposed Solution – LUMINA Ecosystem

### 🔹 Laser-Marked QR Code Identity
- Fiber-laser engraved QR codes on:
  - **ERCs (Elastic Rail Clips)**
  - **Liners**
  - **Sleepers**
- Coated with **transparent aliphatic polyurethane**
- Resistant to heat, corrosion, dust, vibration, and weather
- Ensures **permanent digital identity** for each asset

---

### 🤖 DRUVA – Autonomous Rail Inspection Bot

- Solar-powered autonomous rail bot
- Runs on **Raspberry Pi**
- Dual functionality:
  - QR scanning & asset verification
  - Fault detection and reporting

---

## 🌐 Live Platforms

- **VIMARSHA Platform (Main System):**  
  👉 https://vimarsha3.vercel.app/

- **Rail Component Classification Model:**  
  👉 https://railclassification-7.onrender.com
  
---

### 🧠 AI & Software Intelligence (This Repository)

This repository contains the **AI classification module** that:

- Identifies railway components:
  - **ERC**
  - **Liner**
  - **Clip**
- Outputs:
  - Predicted component type
  - **Confidence score**
- Built using:
  - YOLO-based deep learning
  - PyTorch → ONNX optimization
- Dataset:
  - **150+ real railway asset images**
  - Fully **manually annotated with bounding boxes**
- Designed for:
  - Real-time inference
  - Edge + cloud deployment

---

## 🔄 End-to-End System Flow

1. Asset is laser-marked with QR code  
2. DRUVA or mobile device scans the QR  
3. Image is sent to AI classification service  
4. Model predicts component + confidence score  
5. Data is stored and visualized in **VIMARSHA portal**  
6. Authorized railway officials access asset lifecycle data  

---

## 🧩 System Integrations

- **VIMARSHA Portal:** Central asset management
- **UDM Portal:** Procurement & supply tracking
- **TMS Portal:** Track management & maintenance records
- **Encrypted access:** Only authorized officials can view/edit data

---

## ⚙️ Technology Stack

### Software
- **Backend:** Python, Flask
- **AI Model:** YOLO (PyTorch, ONNX)
- **Frontend:** Next.js, React
- **Database:** Firebase / Cloud DB
- **Deployment:** Render, Vercel

---

## 🌱 Feasibility & Impact

### ✅ Technical Feasibility
- Uses proven technologies (Laser DPM, YOLO, autonomous bots)
- Scalable zone-by-zone deployment

### 💰 Economic Viability
- Reduces costly inspection delays
- Long-term savings outweigh initial setup costs

### ⚙️ Operational Feasibility
- Seamless integration with existing railway systems
- Reduced dependency on human labor

### 🌍 Environmental Feasibility
- Solar-powered autonomous inspection
- Promotes sustainability and Digital India

---


## 👨‍💻 Software Contributors
- 👤 [IncharaS06](https://github.com/IncharaS06)  
- 👤 [yashwanths814](https://github.com/yashwanths814)  

---

## 📜 License

This project is licensed under the **Apache License 2.0**.

- Allows use, modification, and distribution
- Suitable for **government, academic, and industrial adoption**
- Requires attribution and license notice

See the `LICENSE` file for full details.

---

## 🙌 Acknowledgement

We thank the **Government of India** and **Smart India Hackathon (SIH)** for providing a national platform to innovate solutions for real challenges faced by Indian Railways.

---

**VIMARSHA & LUMINA represent a future-ready, AI-driven, autonomous approach to railway asset management in India.**
