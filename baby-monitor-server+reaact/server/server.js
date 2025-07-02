const net = require('net');
const { Server } = require("socket.io");
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // ודא שזה מתאים לפורט שבו רץ ה-React UI שלך
        methods: ["GET", "POST"],
        credentials: true
    }
});

const NURSE_ACCESS_CODE = '1111';
const MOTHER_ACCESS_CODE = '0000';
const BABY_CAMERA_URLS = {
    baby1: '192.168.33.11'
};

app.use(cors());
app.use(bodyParser.json());

// אובייקט לשמירת מצב אחרון לכל תינוק (למנוע שידורים מיותרים)
const lastBabyStates = {};

io.on('connection', (socket) => {
    console.log('Client connected (Socket.IO): ' + socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected (Socket.IO): ' + socket.id);
    });

    socket.on('loginAttempt', (data) => {
        const { code } = data;
        console.log('Login attempt with code: ' + code);

        if (code === NURSE_ACCESS_CODE) {
            socket.emit('loginResponse', { success: true, role: 'nurse', message: 'ברוכה הבאה אחות!' });
            console.log('Login successful: Nurse');
        } else if (code === MOTHER_ACCESS_CODE) {
            socket.emit('loginResponse', { success: true, role: 'mother', message: 'ברוכה הבאה יולדת!', babyId: 'baby1' });
            console.log('Login successful: Mother');
        } else {
            socket.emit('loginResponse', { success: false, message: 'קוד גישה שגוי.' });
            console.log('Login failed: Invalid code');
        }
    });

    socket.on('call_nurse', (data) => {
        const { id, message } = data;
        console.log('Received Socket.IO call_nurse event from mother (baby ' + id + '): ' + message);

        io.emit('nurseCall', { 
            babyId: id,
            message: message,
            timestamp: Date.now()
        });

        console.log('Emitted to Socket.IO: nurseCall for baby ' + id);
    });

    socket.on('updateBabyStatus', (data) => {
        console.log('Received status update from UI:', data);

      
        io.emit('babyData', data);

        if (data.id === 'baby1' && data.status === 'בוכה') {
            console.log('Baby1 בוכה! שולח פקודת רטט ל-Socket.IO clients...');
            io.emit('vibrate_command', { cmd: "vibrate", state: true });
            console.log('Sent to Socket.IO: {"cmd": "vibrate", "state": true}');
        } else if (data.id === 'baby1' && data.status !== 'בוכה') {
            console.log('Baby1 לא בוכה יותר. שולח פקודת כיבוי רטט ל-Socket.IO clients...');
            io.emit('vibrate_command', { cmd: "vibrate", state: false });
            console.log('Sent to Socket.IO: {"cmd": "vibrate", "state": false}');
        }
    });
});

const tcpServer = net.createServer((socket) => {
   

    let espId = null;
    let dataBuffer = '';

    // פונקציה להשוואה שטחית בין אובייקטים
    function shallowEqual(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    }

    socket.on('data', (data) => {
        const rawData = data.toString();
        console.log('Received raw TCP data from ESP32:', rawData);
        dataBuffer += rawData;

        try {
            let lastNewlineIndex = dataBuffer.lastIndexOf('\n');
            if (lastNewlineIndex !== -1) {
                const completeMessagesString = dataBuffer.substring(0, lastNewlineIndex + 1);
                const remainingData = dataBuffer.substring(lastNewlineIndex + 1);
                dataBuffer = remainingData;

                const messages = completeMessagesString.split('\n').filter(Boolean);

                messages.forEach(messageString => {
                    const trimmedMessageString = messageString.trim();
                    if (trimmedMessageString.length === 0) return;

                    try {
                        const message = JSON.parse(trimmedMessageString);
                        const { id, pressure, status, mealStartTime, mealEndTime, mealDuration, event, message: espCallMessage } = message;

                        if (!id) {
                            console.warn('Received TCP data without ID. Ignoring:', trimmedMessageString);
                            return;
                        }

                        if (event === "call_nurse") {
                            console.log(`Received nurse call event from ESP32 for baby ${id}: ${espCallMessage || 'No message provided'}`);
                            io.emit('nurseCall', {
                                babyId: id,
                                message: espCallMessage || "קריאת אחות אוטומטית מ-ESP",
                                timestamp: Date.now()
                            });
                            console.log('Emitted to Socket.IO (from TCP - nurseCall):', { babyId: id, message: espCallMessage });
                        }
                        else if (id === 'baby1') {
                            espId = id;
                            const babyDataToEmit = {
                                id: id,
                                pressure: pressure,
                                status: status,
                                mealStartTime: mealStartTime,
                                mealEndTime: mealEndTime,
                                mealDuration: mealDuration
                            };

                            // בדיקה אם המצב שונה מהמצב האחרון
                            const lastState = lastBabyStates[id] || {};
                            if (!shallowEqual(lastState, babyDataToEmit)) {
                                lastBabyStates[id] = babyDataToEmit;

                                io.emit('babyData', babyDataToEmit);
                                console.log('Emitted to Socket.IO (from TCP - babyData):', babyDataToEmit);
                            } else {
                                console.log('No change detected in babyData for', id, '- no emit');
                            }
                        } else {
                            console.warn('Received TCP data from unexpected ID or unknown event type: ' + id + ' - ' + trimmedMessageString);
                        }
                    } catch (err) {
                        console.error('Error parsing JSON from TCP data. Problematic string:', trimmedMessageString, 'Error:', err.message);
                    }
                });
            }
        } catch (err) {
            console.error('Error processing TCP data buffer. Raw data:', rawData, 'Buffer:', dataBuffer, 'Error:', err.message);
        }
    });

    socket.on('end', () => {
        console.log('ESP32 (' + (espId || 'unknown') + ') disconnected (TCP)');
        if (dataBuffer.length > 0) {
            console.warn('TCP socket ended with unprocessed data in buffer:', dataBuffer);
        }
    });

    socket.on('error', (err) => {
        console.error('TCP Socket error for ' + (espId || 'unknown') + ' (TCP): ' + err.message);
    });
});

tcpServer.listen(3001, () => {
    console.log('TCP Server listening on port 3001 (for baby1 ESP)');
});

httpServer.listen(3002, () => {
    console.log('WebSocket Server listening on port 3002 (for React UI & Vibration ESP)');
});
