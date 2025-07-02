import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // עדיין צריך לניווט חזרה, אם רלוונטי
import './App.css';

function MotherDashboard({ babies }) { 
    const [babyIdInput, setBabyIdInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleIdSubmit = () => {
        setErrorMessage('');
        
        const foundBaby = babies.find(baby => baby.idNumber === babyIdInput);

        if (foundBaby) {
            if (foundBaby.cameraIp) {
        
                window.open(`http://${foundBaby.cameraIp}:81/stream`, '_blank'); 
            } else {
                setErrorMessage('לתינוק זה אין מצלמה מוגדרת.');
            }
        } else {
            setErrorMessage('תעודת הזהות שהוזנה אינה תקינה או שאינה שייכת לתינוק.');
        }
    };

    return (
        <div className="mother-dashboard-container">
            <h1 className="title-handwritten">ברוכה הבאה!</h1>
            <h2>צפייה בתינוק שלך</h2>
            <p>אנא הכנסי את תעודת הזהות של התינוק לצפייה במצלמה:</p>
            <div className="input-group">
                <label htmlFor="babyId">תעודת זהות תינוק:</label>
                <input
                    type="text"
                    id="babyId"
                    value={babyIdInput}
                    onChange={(e) => setBabyIdInput(e.target.value)}
                    placeholder="הכנס תעודת זהות"
                    className="login-input"
                />
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button onClick={handleIdSubmit} className="login-button">צפה במצלמה</button>
            <button onClick={() => navigate('/')} className="back-button">חזרה למסך כניסה</button>
        </div>
    );
}

export default MotherDashboard;