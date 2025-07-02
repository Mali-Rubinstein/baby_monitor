# Smart Baby Monitoring System – Baby Monitor

A smart system developed for a nursery, combining hardware and software to allow both the mother and nursery staff to **monitor the baby in real-time**, remotely and easily.

---

## 👶 Key Features

### Sensors and Hardware Control:
- **Motion Sensor (PIR)** – Detects crying or movements.
- **Vibration Motor on the Mother Side** – Automatically activates when the baby cries.
- **LCD Screen (ESP32)** – Displays baby status in real-time.
- **ESP32-CAM** – Streams live video of the baby.
- **Pressure Sensor** – Detects when the baby is feeding (by sensing pressure under the bottle) and logs:
  - Feeding start time
  - Feeding duration

### Software Side:
- **Arduino Code** – Handles all physical sensors and logic.
- **Node.js Server** – Connects hardware with the user interface.
- **WebSocket Protocol** – Enables real-time communication between the server and the React app.
- **React App** – Mother’s dashboard that includes:
  - Live baby status
  - Real-time alerts
  - Camera access based on baby ID

---

## 🧩 Project Structure

baby_monitor/
├── baby-monitor-server+reaact/ ← React app + Node.js server
├── baby_monitor-ardoino/ ← Arduino code for baby side
├── mother_monitor-ardoino/ ← Arduino code for mother side
└── CameraWebServer_copy... ← ESP32-CAM code

yaml
Copy
Edit

---

## 🛠️ Technologies

- Arduino (C++)
- ESP32 / ESP32-CAM
- React
- Node.js
- WebSocket

---

## 🚀 How to Run

All components (sensors, ESPs, LCD, camera, vibration motor) must be connected for the system to function properly.

1. Upload the code to ESP32 on both baby and mother devices
2. Start the Node.js server (`server.js`)
3. Launch the React app
4. The mother receives live updates and alerts via the dashboard
