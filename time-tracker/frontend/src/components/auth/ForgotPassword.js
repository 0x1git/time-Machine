import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const ResetContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const ResetCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.h1`
  text-align: center;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  text-align: center;
  margin-bottom: 2rem;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
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
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  font-size: 0.875rem;
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

const RateLimitInfo = styled.div`
  background: #fef3cd;
  color: #92400e;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fde68a;
  font-size: 0.875rem;
  text-align: center;
`;

const RateLimitedWarning = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const Step = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#3498db' : '#d1d5db'};
  transition: background-color 0.2s;
`;

const OTPInput = styled(Input)`
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  font-weight: bold;
`;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      // Handle rate limit info
      if (response.data.rateLimitInfo) {
        setRateLimitInfo(response.data.rateLimitInfo);
      }
      
      setSuccess('Password reset code sent to your email!');
      setStep(2);
    } catch (err) {
      if (err.response?.status === 429) {
        // Rate limited
        const rateLimitData = err.response.data;
        setError(rateLimitData.message);
        setRateLimitInfo({
          rateLimited: true,
          remainingTimeMinutes: rateLimitData.remainingTimeMinutes
        });
      } else {
        setError(err.response?.data?.message || 'Failed to send reset code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(response.data.resetToken);
      setSuccess('Code verified! Enter your new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/auth/reset-password', { resetToken, newPassword });
      setSuccess('Password reset successfully! You can now login with your new password.');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Title>Forgot Password?</Title>
            <Subtitle>
              Enter your email address and we'll send you a verification code to reset your password.
            </Subtitle>
            <Form onSubmit={handleEmailSubmit}>
              <InputGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </InputGroup>              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              
              {rateLimitInfo && rateLimitInfo.rateLimited && (
                <RateLimitedWarning>
                  ⚠️ Rate Limited! You have exceeded the maximum number of password reset requests. 
                  Please wait {rateLimitInfo.remainingTimeMinutes} more minute(s) before trying again.
                </RateLimitedWarning>
              )}
              
              {rateLimitInfo && !rateLimitInfo.rateLimited && rateLimitInfo.remainingRequests !== undefined && (
                <RateLimitInfo>
                  📊 You have {rateLimitInfo.remainingRequests} remaining password reset requests out of 5.
                </RateLimitInfo>
              )}
              
              <Button type="submit" disabled={loading || (rateLimitInfo && rateLimitInfo.rateLimited)}>
                {loading ? 'Sending...' : (rateLimitInfo && rateLimitInfo.rateLimited) ? 'Rate Limited' : 'Send Reset Code'}
              </Button>
            </Form>
          </>
        );

      case 2:
        return (
          <>
            <Title>Enter Verification Code</Title>
            <Subtitle>
              We've sent a 6-digit verification code to {email}. Enter it below to continue.
            </Subtitle>
            <Form onSubmit={handleOTPSubmit}>
              <InputGroup>
                <Label htmlFor="otp">Verification Code</Label>
                <OTPInput
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </InputGroup>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              
              <Button type="submit" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </Form>
          </>
        );

      case 3:
        return (
          <>
            <Title>Set New Password</Title>
            <Subtitle>
              Enter your new password below. Make sure it's at least 6 characters long.
            </Subtitle>
            <Form onSubmit={handlePasswordSubmit}>
              <InputGroup>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </InputGroup>
              
              <InputGroup>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </InputGroup>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Form>
          </>
        );

      case 4:
        return (
          <>
            <Title>Password Reset Complete!</Title>
            <SuccessMessage>{success}</SuccessMessage>
            <LinkText>
              <Link to="/login">Return to Login</Link>
            </LinkText>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ResetContainer>
      <ResetCard>
        <Logo>TimeTracker</Logo>
        
        {step < 4 && (
          <StepIndicator>
            <Step active={step >= 1} />
            <Step active={step >= 2} />
            <Step active={step >= 3} />
          </StepIndicator>
        )}
        
        {renderStepContent()}
        
        {step === 1 && (
          <LinkText>
            Remember your password? <Link to="/login">Sign in</Link>
          </LinkText>
        )}
        
        {(step === 2 || step === 3) && (
          <LinkText>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit'
              }}
            >
              Use different email
            </button>
          </LinkText>
        )}
      </ResetCard>
    </ResetContainer>
  );
};

export default ForgotPassword;
