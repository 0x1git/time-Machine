import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCoffee, FiUser, FiLogIn, FiLogOut, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const KioskContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const KioskCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

const KioskTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
`;

const KioskSubtitle = styled.p`
  color: #6b7280;
  font-size: 1.2rem;
  margin-bottom: 40px;
`;

const EmployeeSection = styled.div`
  margin-bottom: 32px;
`;

const EmployeeSelect = styled.select`
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  margin-bottom: 24px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
`;

const ActionButton = styled.button`
  padding: 24px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-height: 120px;
  justify-content: center;

  &.break-start {
    background: #ff6b35;
    color: white;

    &:hover {
      background: #e55a2b;
      transform: translateY(-2px);
    }
  }

  &.break-end {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
      transform: translateY(-2px);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const BreakTypeSection = styled.div`
  margin-bottom: 24px;
`;

const BreakTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const BreakTypeButton = styled.button`
  padding: 16px 12px;
  border: 2px solid ${props => props.selected ? '#3498db' : '#e5e7eb'};
  background: ${props => props.selected ? '#3498db' : 'white'};
  color: ${props => props.selected ? 'white' : '#374151'};
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3498db;
    background: ${props => props.selected ? '#2980b9' : '#f8f9fa'};
  }
`;

const StatusDisplay = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const StatusText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const StatusMeta = styled.div`
  color: #6b7280;
  font-size: 14px;
`;

const Kiosk = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBreakType, setSelectedBreakType] = useState('coffee');
  const [activeBreak, setActiveBreak] = useState(null);
  const [runningEntry, setRunningEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const breakTypes = [
    { value: 'coffee', label: 'Coffee' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'personal', label: 'Personal' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      checkEmployeeStatus();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users');
      setEmployees(response.data.filter(user => user.role === 'employee'));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const checkEmployeeStatus = async () => {
    if (!selectedEmployee) return;

    try {
      // Check for running time entry
      const timeResponse = await axios.get(`/time-entries/running?userId=${selectedEmployee}`);
      setRunningEntry(timeResponse.data);

      // Check for active break
      const breakResponse = await axios.get(`/breaks/active?userId=${selectedEmployee}`);
      setActiveBreak(breakResponse.data);
    } catch (error) {
      // Employee might not have active timer or break
      setRunningEntry(null);
      setActiveBreak(null);
    }
  };

  const startBreak = async () => {
    if (!selectedEmployee || !runningEntry) {
      toast.error('Employee must be clocked in to start a break');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/breaks/start', {
        timeEntryId: runningEntry._id,
        breakType: selectedBreakType,
        userId: selectedEmployee
      });
      
      setActiveBreak(response.data);
      toast.success(`${selectedBreakType.charAt(0).toUpperCase() + selectedBreakType.slice(1)} break started!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;

    setLoading(true);
    try {
      await axios.put(`/breaks/end/${activeBreak._id}?userId=${selectedEmployee}`);
      setActiveBreak(null);
      toast.success('Break ended!');
    } catch (error) {
      toast.error('Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const canStartBreak = selectedEmployee && runningEntry && !activeBreak;
  const canEndBreak = selectedEmployee && activeBreak;

  return (
    <KioskContainer>
      <KioskCard>
        <KioskTitle>
          <FiCoffee style={{ marginRight: '16px' }} />
          Break Station
        </KioskTitle>
        <KioskSubtitle>
          Select your name and manage your breaks
        </KioskSubtitle>

        <EmployeeSection>
          <EmployeeSelect
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map(employee => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </EmployeeSelect>
        </EmployeeSection>

        {selectedEmployee && (
          <>
            <StatusDisplay>
              <StatusText>
                <FiUser style={{ marginRight: '8px' }} />
                {employees.find(e => e._id === selectedEmployee)?.name}
              </StatusText>
              <StatusMeta>
                {runningEntry ? (
                  <>
                    <FiClock style={{ marginRight: '4px' }} />
                    Clocked in at {formatTime(runningEntry.startTime)} • Project: {runningEntry.project?.name}
                  </>
                ) : (
                  'Not currently clocked in'
                )}
              </StatusMeta>
              {activeBreak && (
                <StatusMeta style={{ marginTop: '8px', color: '#d68910', fontWeight: '600' }}>
                  On {activeBreak.breakType} break since {formatTime(activeBreak.startTime)}
                </StatusMeta>
              )}
            </StatusDisplay>

            {!activeBreak && canStartBreak && (
              <BreakTypeSection>
                <StatusText>Select Break Type:</StatusText>
                <BreakTypeGrid>
                  {breakTypes.map(type => (
                    <BreakTypeButton
                      key={type.value}
                      selected={selectedBreakType === type.value}
                      onClick={() => setSelectedBreakType(type.value)}
                    >
                      {type.label}
                    </BreakTypeButton>
                  ))}
                </BreakTypeGrid>
              </BreakTypeSection>
            )}

            <ActionGrid>
              <ActionButton
                className="break-start"
                onClick={startBreak}
                disabled={!canStartBreak || loading}
              >
                <FiCoffee size={32} />
                Start Break
              </ActionButton>

              <ActionButton
                className="break-end"
                onClick={endBreak}
                disabled={!canEndBreak || loading}
              >
                <FiLogOut size={32} />
                End Break
              </ActionButton>
            </ActionGrid>

            {!runningEntry && (
              <StatusMeta style={{ textAlign: 'center', fontSize: '16px' }}>
                Please clock in using the main timer before starting a break
              </StatusMeta>
            )}
          </>
        )}
      </KioskCard>
    </KioskContainer>
  );
};

export default Kiosk;
