import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-toastify";

const OTPContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const Description = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const OTPInput = styled.input`
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 24px;
  text-align: center;
  letter-spacing: 8px;
  font-family: "Courier New", monospace;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &.error {
    border-color: #e74c3c;
  }
`;

const Button = styled.button`
  width: 100%;
  background: #3498db;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResendButton = styled.button`
  background: transparent;
  color: #3498db;
  border: none;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;

  &:hover:not(:disabled) {
    color: #2980b9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 1rem;
`;

const Timer = styled.div`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 1rem;
`;

const OTPVerification = ({
  email,
  type = "email_verification",
  onVerificationSuccess,
  onCancel,
  title,
  description,
}) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint =
        type === "email_verification" ? "/verify-email" : "/verify-login";
      const response = await axios.post(`/otp${endpoint}`, {
        email,
        otp,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        onVerificationSuccess({
          ...response.data,
          otp: otp, // Include the OTP in the response
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/otp/resend", {
        email,
        type,
      });

      if (response.data.success) {
        toast.success("New verification code sent");
        setResendCooldown(60); // 1 minute cooldown
        setTimeLeft(600); // Reset timer to 10 minutes
        setOtp("");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to resend code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const defaultTitle =
    type === "email_verification"
      ? "Verify Your Email"
      : "Two-Factor Authentication";

  const defaultDescription =
    type === "email_verification"
      ? `We've sent a 6-digit verification code to ${email}. Please enter it below to verify your email address.`
      : `We've sent a 6-digit verification code to ${email}. Please enter it below to complete your login.`;

  return (
    <OTPContainer>
      <Title>{title || defaultTitle}</Title>
      <Description>{description || defaultDescription}</Description>

      <form onSubmit={handleSubmit}>
        <OTPInput
          type="text"
          value={otp}
          onChange={handleOTPChange}
          placeholder="000000"
          maxLength={6}
          className={error ? "error" : ""}
          autoFocus
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {timeLeft > 0 && <Timer>Code expires in {formatTime(timeLeft)}</Timer>}

        <Button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify Code"}
        </Button>
      </form>

      <div>
        <ResendButton
          onClick={handleResend}
          disabled={loading || resendCooldown > 0}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </ResendButton>
      </div>

      {onCancel && (
        <Button
          onClick={onCancel}
          style={{ background: "#6c757d", marginTop: "0.5rem" }}
        >
          Cancel
        </Button>
      )}
    </OTPContainer>
  );
};

export default OTPVerification;
