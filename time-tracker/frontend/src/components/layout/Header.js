import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { FiMenu, FiClock, FiPlay, FiPause, FiBell } from 'react-icons/fi';
import axios from 'axios';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  margin-right: 16px;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TimerDisplay = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.isRunning ? '#28a745' : '#6c757d'};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 16px;

  svg {
    margin-right: 8px;
  }
`;

const TimerButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const NotificationBell = styled.div`
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  background: ${props => props.hasNotifications ? '#fef3c7' : 'transparent'};
  color: ${props => props.hasNotifications ? '#d97706' : '#6b7280'};
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
`;

const Header = ({ onToggleSidebar }) => {
  const { currentUser } = useAuth();
  const { assignedTasksCount } = useNotifications();
  const [runningTimer, setRunningTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);  useEffect(() => {
    fetchRunningTimer();
    const interval = setInterval(() => {
      if (runningTimer) {
        const startTime = new Date(runningTimer.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  const fetchRunningTimer = async () => {
    try {
      const response = await axios.get('/time-entries/running');
      setRunningTimer(response.data);
      if (response.data) {
        const startTime = new Date(response.data.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }
    } catch (error) {
      // No running timer
      setRunningTimer(null);
      setElapsedTime(0);
    }
  };

  const stopTimer = async () => {
    if (runningTimer) {
      try {
        await axios.post(`/time-entries/${runningTimer._id}/stop`);
        setRunningTimer(null);
        setElapsedTime(0);
      } catch (error) {
        console.error('Error stopping timer:', error);
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={onToggleSidebar}>
          <FiMenu size={20} />
        </MenuButton>
      </LeftSection>      <RightSection>
        {runningTimer && (
          <TimerDisplay isRunning={true}>
            <FiClock />
            {formatTime(elapsedTime)}
            <TimerButton onClick={stopTimer}>
              <FiPause size={16} />
            </TimerButton>
          </TimerDisplay>
        )}
        
        <NotificationBell hasNotifications={assignedTasksCount > 0}>
          <FiBell size={20} />
          {assignedTasksCount > 0 && (
            <NotificationBadge>
              {assignedTasksCount > 99 ? '99+' : assignedTasksCount}
            </NotificationBadge>
          )}
        </NotificationBell>
        
        <UserAvatar>
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          ) : (
            getUserInitials(currentUser?.name || 'U')
          )}
        </UserAvatar>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
