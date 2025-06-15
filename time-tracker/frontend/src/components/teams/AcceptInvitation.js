import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiCheck, FiX, FiMail, FiUsers } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
`;

const Icon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.success ? '#27ae60' : props.error ? '#e74c3c' : '#3498db'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: 32px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin: 0 8px;

  &:hover {
    background: #2980b9;
  }

  &.secondary {
    background: #6b7280;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TeamInfo = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  text-align: left;
`;

const TeamName = styled.h3`
  color: #2c3e50;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RoleBadge = styled.span`
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser, login, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    }
  }, [token]);

  useEffect(() => {
    // Auto-accept invitation when user becomes authenticated
    if (currentUser && token && !accepting && !success && !error) {
      handleAcceptInvitation();
    }
  }, [currentUser, token]);

  const fetchInvitationDetails = async () => {
    try {
      // First, we need to verify the token exists and get invitation details
      // Since we need to be authenticated to accept, we'll handle this in the accept flow
      setLoading(false);
    } catch (error) {
      setError('Invalid or expired invitation');
      setLoading(false);
    }
  };  const handleAcceptInvitation = async () => {
    if (!currentUser) {
      // Redirect to login with return URL
      navigate(`/login?returnUrl=/accept-invitation/${token}`);
      return;
    }

    setAccepting(true);
    setError(''); // Clear any previous errors
    try {
      const response = await axios.post(`/teams/accept-invitation/${token}`);
      
      // Refresh user data to update organization context
      await refreshUser();
      
      setSuccess(true);
      toast.success('Successfully joined the team!');
      
      // Redirect to teams page after a delay
      setTimeout(() => {
        navigate('/teams');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error accepting invitation:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <LoadingSpinner />
          <Description>Loading invitation details...</Description>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <Card>
          <Icon success>
            <FiCheck />
          </Icon>
          <Title>Welcome to the Team!</Title>
          <Description>
            You've successfully joined the team. You'll be redirected to your teams page shortly.
          </Description>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card>
          <Icon error>
            <FiX />
          </Icon>
          <Title>Invitation Error</Title>
          <Description>{error}</Description>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Icon>
          <FiMail />
        </Icon>
        <Title>Team Invitation</Title>
        <Description>
          You've been invited to join a team! 
          {!currentUser && ' Please log in to accept this invitation.'}
        </Description>

        {currentUser ? (
          <>
            <Description>
              Welcome <strong>{currentUser.name}</strong>! Click below to accept the invitation and join the team.
            </Description>
            <Button 
              onClick={handleAcceptInvitation}
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Button 
              className="secondary" 
              onClick={handleDecline}
              disabled={accepting}
            >
              Decline
            </Button>
          </>
        ) : (
          <>            <Button onClick={() => navigate(`/login?returnUrl=/accept-invitation/${token}`)}>
              Log In to Accept
            </Button>
            <Button 
              className="secondary" 
              onClick={() => navigate(`/register?invitationToken=${token}&returnUrl=/teams`)}
            >
              Create Account
            </Button>
          </>
        )}
      </Card>
    </Container>
  );
};

export default AcceptInvitation;
