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

const RateLimitInfo = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  margin: 1rem 0;
  text-align: center;
`;

const RateLimitTitle = styled.div`
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const RateLimitText = styled.div`
  color: #7f1d1d;
  font-size: 13px;
`;

const RequestsInfo = styled.div`
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 8px;
  margin: 1rem 0;
  text-align: center;
  font-size: 13px;
  color: #1e40af;
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
}) => {  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const [remainingRequests, setRemainingRequests] = useState(5);

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

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitTime > 0) {
      const timer = setTimeout(
        () => setRateLimitTime(rateLimitTime - 1),
        60000 // 1 minute
      );
      return () => clearTimeout(timer);
    } else if (rateLimited && rateLimitTime === 0) {
      setRateLimited(false);
      setRemainingRequests(5); // Reset remaining requests
    }
  }, [rateLimitTime, rateLimited]);

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
    if (resendCooldown > 0 || rateLimited) return;

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
        
        // Update rate limit info
        if (response.data.rateLimitInfo) {
          setRemainingRequests(response.data.rateLimitInfo.remainingRequests);
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || "Failed to resend code";
      
      // Handle rate limiting
      if (errorData?.rateLimited) {
        setRateLimited(true);
        setRateLimitTime(errorData.remainingTimeMinutes);
        toast.error(`Rate limited! Please wait ${errorData.remainingTimeMinutes} minutes before trying again.`);
      } else {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
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
        />        {error && <ErrorMessage>{error}</ErrorMessage>}

        {rateLimited && (
          <RateLimitInfo>
            <RateLimitTitle>⚠️ Rate Limited</RateLimitTitle>
            <RateLimitText>
              You have exceeded the maximum number of OTP requests (5).
              <br />
              Please wait {rateLimitTime} more minute(s) before trying again.
            </RateLimitText>
          </RateLimitInfo>
        )}

        {!rateLimited && remainingRequests < 5 && (
          <RequestsInfo>
            📊 Remaining OTP requests: {remainingRequests}/5
          </RequestsInfo>
        )}

        {timeLeft > 0 && <Timer>Code expires in {formatTime(timeLeft)}</Timer>}

        <Button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify Code"}
        </Button>
      </form>

      <div>        <ResendButton
          onClick={handleResend}
          disabled={loading || resendCooldown > 0 || rateLimited}
        >
          {rateLimited 
            ? `Rate limited (${rateLimitTime}m remaining)`
            : resendCooldown > 0 
            ? `Resend in ${resendCooldown}s` 
            : "Resend Code"
          }
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
