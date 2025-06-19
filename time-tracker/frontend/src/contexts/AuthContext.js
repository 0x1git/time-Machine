import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    // Set axios base URL
    axios.defaults.baseURL = API_URL;

    // Check if user is already logged in (token exists)
    const token = localStorage.getItem("token");
    if (token) {
      // Set default auth header for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user data
      axios
        .get("/users/me")
        .then((response) => {
          setCurrentUser(response.data);
        })
        .catch((err) => {
          // If token is invalid or expired, remove it
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []); // Register new user (now requires OTP verification)
  const register = async (
    name,
    email,
    password,
    companyName,
    invitationToken = null,
    emailVerified = false
  ) => {
    try {
      // If email is not verified yet, we shouldn't call this function
      if (!emailVerified) {
        throw new Error("Email verification required before registration");
      }

      const registrationData = {
        name,
        email,
        password,
        companyName,
        // Note: OTP will be provided by the OTP verification component
        // This is just a placeholder - the actual OTP should be passed
        otp: "000000", // This should be provided by the calling component
      };

      // Add invitation token if provided
      if (invitationToken) {
        registrationData.invitationToken = invitationToken;
      }

      const response = await axios.post("/auth/register", registrationData);

      const { token, user, organization } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Set default auth header for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch complete user data with permissions
      const userResponse = await axios.get("/users/me");

      setCurrentUser(userResponse.data);
      setError("");
      return userResponse.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
      throw err;
    }
  };

  // Register user with OTP (new method)
  const registerWithOTP = async (
    name,
    email,
    password,
    companyName,
    otp,
    invitationToken = null
  ) => {
    try {
      const registrationData = {
        name,
        email,
        password,
        companyName,
        otp,
      };

      // Add invitation token if provided
      if (invitationToken) {
        registrationData.invitationToken = invitationToken;
      }

      const response = await axios.post("/auth/register", registrationData);

      const { token, user, organization } = response.data;

      // Save token and user data to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (organization) {
        localStorage.setItem("organization", JSON.stringify(organization));
      }

      // Set default auth header for axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch complete user data with permissions
      const userResponse = await axios.get("/users/me");

      setCurrentUser(userResponse.data);
      setError("");
      return userResponse.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
      throw err;
    }
  }; // Login user (updated to support 2FA)
  const login = async (email, password, token = null) => {
    try {
      if (token) {
        // If token is provided (from OTP verification), use it directly
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const userResponse = await axios.get("/users/me");
        setCurrentUser(userResponse.data);
        setError("");
        return userResponse.data;
      } else {
        // Regular login
        const response = await axios.post("/auth/login", {
          email,
          password,
        });

        const { token: authToken, user } = response.data;

        // Save token to localStorage
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(user));

        // Set default auth header for axios
        axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

        // Fetch complete user data with permissions
        const userResponse = await axios.get("/users/me");

        setCurrentUser(userResponse.data);
        setError("");
        return userResponse.data;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to login");
      throw err;
    }
  };
  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");

    // Remove auth header for axios
    delete axios.defaults.headers.common["Authorization"];

    setCurrentUser(null);
  };
  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/users/me", profileData);
      setCurrentUser(response.data);
      setError("");
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      throw err;
    }
  };

  // Refresh user data (useful after organization changes)
  const refreshUser = async () => {
    try {
      const response = await axios.get("/users/me");
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to refresh user data:", err);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    registerWithOTP,
    login,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
