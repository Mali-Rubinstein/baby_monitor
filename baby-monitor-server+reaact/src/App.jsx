import React, { useState, useEffect } from "react";
import './App.css';
import { io } from "socket.io-client";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginScreen from "./LoginScreen";
import MotherDashboard from "./MotherDashboard";
import BabyCameraFeed from "./BabyCameraFee";

const socket = io("http://localhost:3002", { withCredentials: true });
const BABY_CAMERA_IP_DEFAULT = "192.168.1.110";


function AppContent() {
    const [babies, setBabies] = useState([
        { id: "baby1", idNumber: "312456789", motherIdNumber: "208567321", weight: 3.5, status: "רגוע", cameraIp: BABY_CAMERA_IP_DEFAULT, pressure: 0, mealStartTime: null, mealEndTime: null, mealDuration: null, mealInProgress: false, hasAlert: false },
        { id: "baby2", idNumber: "301234567", motherIdNumber: "223498112", weight: 3.2, status: "רגוע", cameraIp: null, pressure: 0, mealStartTime: null, mealEndTime: null, mealDuration: null, mealInProgress: false, hasAlert: false },
        { id: "baby3", idNumber: "345678901", motherIdNumber: "235678990", weight: 3.8, status: "בוכה", cameraIp: null, pressure: 0, mealStartTime: null, mealEndTime: null, mealDuration: null, mealInProgress: false, hasAlert: false },
        { id: "baby4", idNumber: "356789012", motherIdNumber: "210923456", weight: 3.0, status: "רגוע", cameraIp: null, pressure: 0, mealStartTime: null, mealEndTime: null, mealDuration: null, mealInProgress: false, hasAlert: false },
        { id: "baby5", idNumber: "367890123", motherIdNumber: "278900234", weight: 3.6, status: "רגוע", cameraIp: null, pressure: 0, mealStartTime: null, mealEndTime: null, mealDuration: null, mealInProgress: false, hasAlert: false },
    ]);


    const [nurseCallMessages, setNurseCallMessages] = useState([]);
    const navigate = useNavigate();
    function handleAcknowledgeAlert(babyId) {
        // הסרת ההתראה מהתינוק
        setBabies(prev =>
            prev.map(baby =>
                baby.id === babyId ? { ...baby, hasAlert: false } : baby
            )
        );

        // עדכון הודעת קריאה כטופלה
        setNurseCallMessages(prev =>
            prev.map(msg =>
                msg.babyId === babyId && !msg.handled
                    ? { ...msg, handled: true }
                    : msg
            )
        );
    }

    useEffect(() => {
        socket.on('babyData', (data) => {
            console.log("Received babyData:", data);
            if (!data || !data.id) return;

            setBabies(prevBabies => prevBabies.map(baby => {
                if (baby.id !== data.id) return baby;
                return {
                    ...baby,
                    pressure: data.pressure ?? baby.pressure,
                    status: data.status || baby.status,
                    mealInProgress: data.mealInProgress ?? baby.mealInProgress,
                    mealStartTime: (
                        data.mealStartTime && typeof data.mealStartTime === 'string' && data.mealStartTime.length >= 4
                    )
                        ? data.mealStartTime
                        : baby.mealStartTime,

                    mealEndTime: data.event === "meal_ended" ? data.mealEndTime : (data.mealEndTime ?? baby.mealEndTime),
                    mealDuration: data.event === "meal_ended" ? data.mealDuration : (data.mealDuration ?? baby.mealDuration),
                    hasAlert: data.event === "nurseCall" ? true : baby.hasAlert

                };
            }));
        });



        const handleNurseCall = (callData) => {


            // Update baby's alert status
            setBabies(prevBabies => prevBabies.map(baby => {
                if (baby.id === callData.babyId) {
                    return { ...baby, hasAlert: true };
                }
                return baby;
            }));
        };


        socket.on('connect', () => console.log('Connected to Socket.IO server'));
        socket.on('disconnect', () => console.log('Disconnected from Socket.IO server'));

        socket.on('loginResponse', (res) => {
            if (res?.success) {
                navigate(res.role === 'nurse' ? '/nursery' : '/mother-dashboard');
            } else {
                console.error('Login failed:', res?.message);
            }
        });
        socket.on('nurseCall', handleNurseCall); // Ensure the listener is set
        return () => {
            socket.off('babyData');
            socket.off('nurseCall');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('loginResponse');
        };
    }, [navigate]);

    const formatDuration = (sec) => {
        if (sec == null) return 'N/A';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m} דק' ${s} שנ'`;
    };

    const formatTime = (time) => {
        if (!time || time === 'null') return '---';

        let date;

        if (typeof time === 'string' && time.includes(':')) {
            // זמן כתוב בפורמט של תאריך
            date = new Date(time.replace(' ', 'T')); // הופך "2025-06-17 15:10:46" ל־"2025-06-17T15:10:46"
        } else {
            // מניח שזה מילישניות
            date = new Date(Number(time));
        }

        if (isNaN(date.getTime())) return '---';

        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };



    const NurseryScreen = () => ( // Added props here for consistency
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen flex flex-col items-center">
            <button
                onClick={() => navigate('/')}
                className="self-start mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out shadow-sm"
            >
                חזרה למסך כניסה
            </button>
            <h1 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">מערכת מעקב לתינוקות - אחיות</h1>

            <div className="baby-board">
                {babies.map((baby) => (
                    <div key={baby.id} className={`baby-card ${baby.status === "בוכה" ? "crying highlight-crying" : ""}`}>
                        <div className="camera-feed-mini">
                            <h2>מבט על התינוק {baby.idNumber.substring(0, 3)}...</h2>
                            {baby.cameraIp ? (
                                <>
                                    <img
                                        src={`http://${baby.cameraIp}:81/stream`}
                                        alt={`Baby ${baby.id} Camera Stream`}
                                        className="baby-camera-stream-mini"
                                        onError={(e) => { e.target.src = '/placeholder_camera.png'; }}
                                    />
                                    <a
                                        href={`http://${baby.cameraIp}:81/stream`}

                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="view-camera-button"
                                    >
                                        צפה במצלמה במלואה
                                    </a>
                                </>
                            ) : <p className="no-camera-msg">אין מצלמה מוגדרת</p>}
                        </div>
                        <div className="baby-info">
                            {baby.hasAlert && (
                                <div className="alert-message font-bold text-red-600 text-lg mb-2">
                                    ⚠️  יש התראה מהאמא!
                                    <button
                                        className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        onClick={() => handleAcknowledgeAlert(baby.id)}
                                    >
                                        🟢טופל?
                                    </button>
                                </div>
                            )}
                            
                            <p>ת.ז אמא: {baby.motherIdNumber}</p>  {/* שורה חדשה */}
                            <h2>ת.ז: {baby.idNumber}</h2>
                            <p>משקל: {baby.weight} ק"ג</p>
                            <p className="baby-status-display">מצב: <strong>{baby.status}</strong></p>


                            <div className="meal-info">
                                <p><strong>האכלה אחרונה:</strong></p>
                                {!baby.mealStartTime ? (
                                    <p>📭 טרם נרשמה אכילה.</p>
                                ) : baby.mealInProgress ? (
                                    <p className="eating-message">🍼 התחלת לאכול ב־<strong>{formatTime(baby.mealStartTime)}</strong></p>
                                ) : baby.mealDuration > 0 ? (
                                    <>
                                        <p>התחלה: <strong>{formatTime(baby.mealStartTime)}</strong></p>
                                        <p>🍽️ משך: <strong>{formatDuration(baby.mealDuration)}</strong></p>
                                    </>
                                ) : (
                                    <p>🛑 האכלה בוטלה או נמשכה פחות משנייה.</p>
                                )}
                            </div>
                           
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Routes>
            <Route path="/" element={<LoginScreen socket={socket} />} />
            <Route path="/nursery" element={<NurseryScreen nurseCallMessages={nurseCallMessages} setNurseCallMessages={setNurseCallMessages} />} />


            <Route path="/mother-dashboard" element={<MotherDashboard babies={babies} />} />
            <Route path="/camera/:babyId" element={<BabyCameraFeed babies={babies} />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;