import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleLoginRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://127.0.0.1:8000/auth/user/", {
            credentials: "include",  // ✅ Ensures session-based authentication
        })
        .then(response => response.json())
        .then(data => {
            if (data.email) {
                localStorage.setItem("user", JSON.stringify(data));  // ✅ Save user data
                navigate("/dashboard");  // ✅ Redirect after login
            } else {
                console.log("User not authenticated");
                navigate("/login"); // Redirect to login page if authentication fails
            }
        })
        .catch(error => {
            console.error("Error fetching user:", error);
            navigate("/login");
        });
    }, [navigate]);

    return <div>Logging in...</div>;
};

export default GoogleLoginRedirect;
