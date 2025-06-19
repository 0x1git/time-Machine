import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import OTPVerification from "./OTPVerification";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-toastify";

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow-y: auto;
`;

const RegisterCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  margin: auto;

  @media (max-height: 800px) {
    margin: 20px auto;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    margin: 10px;
    max-width: calc(100vw - 20px);
  }
`;

const Logo = styled.h1`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;

  @media (max-height: 800px) {
    margin-bottom: 1rem;
    font-size: 1.6rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-height: 800px) {
    gap: 0.6rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.3rem;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  @media (max-height: 800px) {
    padding: 8px 12px;
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
  margin-top: 0.8rem;

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-height: 800px) {
    padding: 10px;
    font-size: 15px;
    margin-top: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 13px;
  margin-top: 0.3rem;
  text-align: center;

  @media (max-height: 800px) {
    font-size: 12px;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1rem;
  color: #6b7280;
  font-size: 14px;

  a {
    color: #3498db;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-height: 800px) {
    margin-top: 0.8rem;
    font-size: 13px;
  }
`;

const InvitationInfo = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const InvitationTitle = styled.h3`
  color: #1976d2;
  margin: 0 0 8px 0;
  font-size: 1.1rem;
`;

const InvitationDetails = styled.p`
  color: #0d47a1;
  margin: 0;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationData, setInvitationData] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const { registerWithOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const invitationToken = searchParams.get("invitationToken");

  // Load invitation details if token is present
  useEffect(() => {
    if (invitationToken) {
      loadInvitationDetails();
    }
  }, [invitationToken]);

  const loadInvitationDetails = async () => {
    setLoadingInvitation(true);
    try {
      const response = await axios.get(`/teams/invitation/${invitationToken}`);
      setInvitationData(response.data);

      // Pre-fill email and company name from invitation
      setFormData((prev) => ({
        ...prev,
        email: response.data.email,
        companyName: response.data.organizationName,
      }));
    } catch (error) {
      console.error("Failed to load invitation:", error);
      setError("Invalid or expired invitation link");
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Company name is only required if not joining via invitation
    if (!invitationToken && !formData.companyName.trim()) {
      setError("Company name is required");
      setLoading(false);
      return;
    }

    try {
      if (!emailVerified) {
        // First step: Send email verification OTP
        await axios.post("/otp/send-verification", {
          email: formData.email,
          name: formData.name,
        });

        setShowEmailVerification(true);
        toast.success("Verification code sent to your email");
      } else {
        // This shouldn't happen as the form should be hidden when email is verified
        setError("Email already verified. Please proceed with registration.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send verification email"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerificationSuccess = async (otpData) => {
    setEmailVerified(true);
    setShowEmailVerification(false);

    // Now proceed with actual registration
    // The email verification was successful, so we can register without re-verifying OTP
    setLoading(true);
    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        emailVerified: true, // Flag to indicate email was already verified
      };

      if (invitationToken) {
        registrationData.invitationToken = invitationToken;
      }

      // Call the backend registration endpoint
      const response = await axios.post("/auth/register", registrationData);

      if (response.data.token) {
        // Save auth data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.organization) {
          localStorage.setItem(
            "organization",
            JSON.stringify(response.data.organization)
          );
        }

        // Set axios auth header
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        toast.success("Account created successfully!");
        navigate(returnUrl || "/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setEmailVerified(false); // Reset if registration fails
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEmailVerification = () => {
    setShowEmailVerification(false);
    setLoading(false);
  };

  if (showEmailVerification) {
    return (
      <RegisterContainer>
        <OTPVerification
          email={formData.email}
          type="email_verification"
          onVerificationSuccess={handleEmailVerificationSuccess}
          onCancel={handleCancelEmailVerification}
          title="Verify Your Email"
          description={`We've sent a verification code to ${formData.email}. Please enter the code to continue with your registration.`}
        />
      </RegisterContainer>
    );
  }
  return (
    <RegisterContainer>
      <RegisterCard>
        <Logo>TimeTracker</Logo>

        {loadingInvitation && (
          <InvitationInfo>
            <LoadingSpinner />
            Loading invitation details...
          </InvitationInfo>
        )}

        {invitationData && (
          <InvitationInfo>
            <InvitationTitle>Team Invitation</InvitationTitle>
            <InvitationDetails>
              You've been invited to join{" "}
              <strong>{invitationData.teamName}</strong> at{" "}
              <strong>{invitationData.organizationName}</strong> as a{" "}
              <strong>{invitationData.role}</strong>.
            </InvitationDetails>
          </InvitationInfo>
        )}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={!!invitationData}
              required
            />
          </InputGroup>

          {!invitationData && (
            <InputGroup>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter your company name"
                required
              />
            </InputGroup>
          )}

          {invitationData && (
            <InputGroup>
              <Label htmlFor="organizationName">Organization</Label>
              <Input
                type="text"
                value={formData.companyName}
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </InputGroup>
          )}

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
          </InputGroup>

          <InputGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading || loadingInvitation}>
            {loading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                {invitationData ? "Joining team..." : "Creating account..."}
              </div>
            ) : invitationData ? (
              "Join Team"
            ) : (
              "Create Account"
            )}
          </Button>
        </Form>

        <LinkText>
          Already have an account?{" "}
          <Link
            to={`/login${
              returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""
            }`}
          >
            Sign in
          </Link>
        </LinkText>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
