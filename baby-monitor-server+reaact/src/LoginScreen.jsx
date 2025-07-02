import React, { useState } from "react";
import './App.css'; // ודא שהנתיב נכון

function LoginScreen({ socket }) {
    const [accessCode, setAccessCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showNurseLogin, setShowNurseLogin] = useState(false); // מצב לשדה סיסמת אחות
    const [showMotherLogin, setShowMotherLogin] = useState(false); // מצב לשדה סיסמת יולדת

    const handleLogin = (role) => {
        setErrorMessage(""); // איפוס הודעות שגיאה קודמות

        // לוגיקת אימות הקודים
        if (role === 'nurse') {
            if (accessCode === '1111') {
                socket.emit('loginAttempt', { code: accessCode, role: role });
            } else {
                setErrorMessage("קוד גישה אינו תואם. נסה שוב.");
            }
        } else if (role === 'mother') {
            if (accessCode === '0000') {
                socket.emit('loginAttempt', { code: accessCode, role: role });
            } else {
                setErrorMessage("קוד גישה אינו תואם. נסה שוב.");
            }
        }
    };

    return (
        <div className="login-screen-container"> {/* קונטיינר מרכזי */}
            <h1 className="main-title">מערכת מעקב לתינוקות</h1> {/* כותרת ראשית */}

            <div className="login-options-container"> {/* קונטיינר לכפתורי הבחירה */}
                {/* כניסה ליולדות */}
                <button
                    className="role-button"
                    onClick={() => {
                        setShowMotherLogin(true);
                        setShowNurseLogin(false); // הסתר את שדה האחות
                        setAccessCode(""); // נקה את הסיסמה הקודמת
                        setErrorMessage("");
                    }}
                >
                    כניסה ליולדות
                </button>

                {/* כניסה לצוות בית החולים */}
                <button
                    className="role-button"
                    onClick={() => {
                        setShowNurseLogin(true);
                        setShowMotherLogin(false); // הסתר את שדה היולדת
                        setAccessCode(""); // נקה את הסיסמה הקודמת
                        setErrorMessage("");
                    }}
                >
                    כניסה לצוות בית החולים
                </button>
            </div>

            {/* שדה קלט וכפתור עבור יולדת */}
            {showMotherLogin && (
                <div className="login-form-mother">
                    <h2>כניסת יולדות</h2>
                    <div className="input-group">
                        <label htmlFor="mother-code">קוד גישה:</label>
                        <input
                            type="password" // סוג password כדי שהקוד לא יוצג
                            id="mother-code"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="הכנס קוד יולדת"
                            className="login-input"
                        />
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button onClick={() => handleLogin('mother')} className="login-button">התחבר/י</button>
                </div>
            )}

            {/* שדה קלט וכפתור עבור צוות בית החולים */}
            {showNurseLogin && (
                <div className="login-form-nurse">
                    <h2>כניסת צוות</h2>
                    <div className="input-group">
                        <label htmlFor="nurse-code">קוד גישה:</label>
                        <input
                            type="password" // סוג password כדי שהקוד לא יוצג
                            id="nurse-code"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="הכנס קוד צוות"
                            className="login-input"
                        />
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button onClick={() => handleLogin('nurse')} className="login-button">התחבר/י</button>
                </div>
            )}
        </div>
    );
}

export default LoginScreen;