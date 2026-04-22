const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
};

export default logout;