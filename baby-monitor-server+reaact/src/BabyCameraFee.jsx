import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';

function BabyCameraFeed({ babies }) {
    const { babyId } = useParams();
    const navigate = useNavigate();

    const currentBaby = babies.find(baby => baby.id === babyId);

    if (!currentBaby || !currentBaby.cameraIp) {
        return (
            <div className="camera-feed-container">
                <h1 className="title-handwritten">שגיאה</h1>
                <p>לא נמצאה מצלמה עבור תינוק {babyId} או שהתינוק אינו קיים.</p>
                <button onClick={() => navigate('/mother-dashboard')} className="back-button">חזור</button>
            </div>
        );
    }

    const cameraStreamUrl = `http://${currentBaby.cameraIp}:81/stream`;

    return (
        <div className="camera-feed-container">
            <h1 className="title-handwritten">
                מצלמת תינוק: {currentBaby.idNumber.substring(0, 3)}...
            </h1>
            <p>צפייה בשידור חי מהמצלמה:</p>
            <img
                src={cameraStreamUrl}
                alt={`שידור חי מתינוק ${currentBaby.id}`}
                className="baby-camera-stream"
                onError={(e) => {
                    e.target.src = '/placeholder_camera.png';
                    console.error(`Camera stream error for ${currentBaby.id}. Check IP: ${currentBaby.cameraIp}`);
                }}
            />
            <button onClick={() => navigate('/mother-dashboard')} className="back-button">
                חזרה ללוח אם
            </button>
        </div>
    );
}

export default BabyCameraFeed;
