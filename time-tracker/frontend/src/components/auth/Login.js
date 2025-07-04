import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import OTPVerification from "./OTPVerification";
import styled from "styled-components";
import axios from "axios";

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 0.5rem;
  text-align: center;
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;

  a {
    color: #3498db;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #374151;
  cursor: pointer;
`;

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mandatory2FA, setMandatory2FA] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {      // Always try login first (backend will tell us if 2FA is needed)
      const loginResponse = await axios.post("/auth/login", {
        email: formData.email,
        password: formData.password,
        rememberMe: rememberMe,
      });      if (loginResponse.data.require2FA) {
        // Backend says 2FA is needed, send OTP and show verification
        try {
          await axios.post("/otp/send-login", { email: formData.email });
          setShowOTPVerification(true);
          
          // If it's mandatory 2FA, show the OTP verification
          if (loginResponse.data.mandatory2FA) {
            setMandatory2FA(true);
          }
        } catch (otpError) {
          // Handle rate limiting for OTP requests
          if (otpError.response?.data?.rateLimited) {
            setError(`Rate limited! Please wait ${otpError.response.data.remainingTimeMinutes} minutes before requesting a new code.`);
          } else {
            setError(otpError.response?.data?.message || "Failed to send verification code");
          }
          return; // Don't show OTP verification if OTP request failed
        }
      } else {
        // Login successful without 2FA needed
        const { token, user, organization } = loginResponse.data;
        
        // Store auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (organization) {
          localStorage.setItem("organization", JSON.stringify(organization));
        }

        // Set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Navigate to dashboard
        navigate(returnUrl || "/dashboard");
        window.location.reload(); // Refresh to update auth context
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      setError(errorMsg);

      // If email verification is required, show appropriate message
      if (err.response?.data?.requireEmailVerification) {
        setError(
          "Please verify your email before logging in. Check your inbox for the verification code."
        );
      }      // If backend requires 2FA but login failed, check if we need to show OTP
      if (err.response?.data?.require2FA) {
        try {
          await axios.post("/otp/send-login", { email: formData.email });
          setShowOTPVerification(true);
        } catch (otpError) {
          // Handle rate limiting for OTP requests
          if (otpError.response?.status === 429) {
            const errorData = otpError.response.data;
            if (errorData.rateLimited) {
              setError(`Rate limited! Please wait ${errorData.remainingTimeMinutes} minutes before requesting a new code.`);
            } else {
              setError(errorData.message || "Too many requests. Please try again later.");
            }
          } else {
            setError(otpError.response?.data?.message || "Failed to send verification code");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerificationSuccess = async (otpData) => {
    try {
      // OTP verification was successful and returned login data
      if (otpData.token && otpData.user) {
        // Store auth data
        localStorage.setItem("token", otpData.token);
        localStorage.setItem("user", JSON.stringify(otpData.user));
        if (otpData.organization) {
          localStorage.setItem(
            "organization",
            JSON.stringify(otpData.organization)
          );
        }

        // Set axios default header for future requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${otpData.token}`;

        // Navigate to dashboard
        navigate(returnUrl || "/dashboard");
        window.location.reload(); // Refresh to update auth context
      }
    } catch (err) {
      setError("Login failed after OTP verification");
      setShowOTPVerification(false);
    }
  };

  const handleCancelOTP = () => {
    setShowOTPVerification(false);
    setLoading(false);
  };

  if (showOTPVerification) {
    return (
      <LoginContainer>
        <OTPVerification
          email={formData.email}
          type="login_2fa"
          onVerificationSuccess={handleOTPVerificationSuccess}
          onCancel={handleCancelOTP}
        />
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>TimeTracker</Logo>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </InputGroup>          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <CheckboxLabel htmlFor="rememberMe">
              Remember me (Keep me logged in for 7 days)
            </CheckboxLabel>
          </CheckboxContainer>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </Form>

        <LinkText style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </LinkText>

        <LinkText>
          Don't have an account?{" "}
          <Link
            to={`/register${
              returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""
            }`}
          >
            Sign up
          </Link>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
