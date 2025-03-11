// Login.jsx - User Login Page
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/resumeApi";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const response = await login(email, password);
        if (response.token) {
            navigate("/dashboard"); // Redirect to dashboard
        } else {
            setError(response.error || "Login failed");
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://127.0.0.1:8000/auth/google/login/";  // ✅ Redirect to Django Google OAuth
    };

    return (
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            <button onClick={handleGoogleLogin} style={{ marginTop: "10px", backgroundColor: "#4285F4", color: "white", padding: "10px" }}>
                Login with Google
            </button>
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
        </div>
    );
};

export default Login;
