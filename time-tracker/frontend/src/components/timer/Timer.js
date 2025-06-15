import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlay, FiPause, FiSquare, FiClock, FiCoffee, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const TimerContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const TimerCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
`;

const TimerDisplay = styled.div`
  font-size: 4rem;
  font-weight: 700;
  color: ${props => props.isRunning ? '#28a745' : '#2c3e50'};
  font-family: 'Courier New', monospace;
  margin-bottom: 32px;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const TimerControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const ControlButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 24px;

  &.primary {
    background: ${props => props.isRunning ? '#dc3545' : '#28a745'};
    color: white;

    &:hover {
      background: ${props => props.isRunning ? '#c82333' : '#218838'};
      transform: scale(1.05);
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
      transform: scale(1.05);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimerForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const CurrentActivity = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const ActivityTitle = styled.div`
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 8px;
`;

const ActivityMeta = styled.div`
  color: #666;
  font-size: 14px;
`;

const BreakCard = styled.div`
  background: ${props => props.isOnBreak ? '#fff3cd' : '#f8f9fa'};
  border: 1px solid ${props => props.isOnBreak ? '#ffeaa7' : '#e9ecef'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const BreakControls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
`;

const BreakButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &.start-break {
    background: #ff6b35;
    color: white;

    &:hover {
      background: #e55a2b;
    }
  }

  &.end-break {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BreakTypeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const BreakStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: ${props => props.isOnBreak ? '#d68910' : '#28a745'};
`;

const Timer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [runningEntry, setRunningEntry] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakType, setBreakType] = useState('other');
  const [formData, setFormData] = useState({
    project: '',
    task: '',
    description: ''
  });
  useEffect(() => {
    fetchProjects();
    checkRunningTimer();
    checkActiveBreak();
  }, []);

  useEffect(() => {
    if (formData.project) {
      fetchTasks(formData.project);
    } else {
      setTasks([]);
    }
  }, [formData.project]);

  useEffect(() => {
    let interval;
    if (isRunning && runningEntry) {
      interval = setInterval(() => {
        const startTime = new Date(runningEntry.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, runningEntry]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const response = await axios.get(`/tasks?project=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  const checkRunningTimer = async () => {
    try {
      const response = await axios.get('/time-entries/running');
      if (response.data) {
        setRunningEntry(response.data);
        setIsRunning(true);
        const startTime = new Date(response.data.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
        
        // Populate form with running entry data
        setFormData({
          project: response.data.project._id,
          task: response.data.task?._id || '',
          description: response.data.description || ''
        });
      }
    } catch (error) {
      // No running timer
    }
  };

  const checkActiveBreak = async () => {
    try {
      const response = await axios.get('/breaks/active');
      setActiveBreak(response.data);
    } catch (error) {
      // No active break
    }
  };

  const startTimer = async () => {
    if (!formData.project) {
      toast.error('Please select a project');
      return;
    }

    try {
      const response = await axios.post('/time-entries', {
        project: formData.project,
        task: formData.task || null,
        description: formData.description,
        startTime: new Date().toISOString(),
        duration: 0
      });

      setRunningEntry(response.data);
      setIsRunning(true);
      setElapsedTime(0);
      toast.success('Timer started!');
    } catch (error) {
      toast.error('Failed to start timer');
      console.error('Error starting timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!runningEntry) return;

    try {
      await axios.post(`/time-entries/${runningEntry._id}/stop`);
      setIsRunning(false);
      setRunningEntry(null);
      setElapsedTime(0);
      setFormData({ project: '', task: '', description: '' });
      toast.success('Timer stopped!');
    } catch (error) {
      toast.error('Failed to stop timer');
      console.error('Error stopping timer:', error);
    }
  };
  const updateDescription = async () => {
    if (!runningEntry) return;

    try {
      await axios.put(`/time-entries/${runningEntry._id}`, {
        description: formData.description
      });
      toast.success('Description updated!');
    } catch (error) {
      toast.error('Failed to update description');
      console.error('Error updating description:', error);
    }
  };

  const startBreak = async () => {
    if (!runningEntry) {
      toast.error('No active timer to start break on');
      return;
    }

    try {
      const response = await axios.post('/breaks/start', {
        timeEntryId: runningEntry._id,
        breakType: breakType
      });
      setActiveBreak(response.data);
      toast.success(`${breakType.charAt(0).toUpperCase() + breakType.slice(1)} break started!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start break');
      console.error('Error starting break:', error);
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;

    try {
      await axios.put(`/breaks/end/${activeBreak._id}`);
      setActiveBreak(null);
      toast.success('Break ended!');
    } catch (error) {
      toast.error('Failed to end break');
      console.error('Error ending break:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'description' && runningEntry) {
      // Debounce description updates
      clearTimeout(window.descriptionTimeout);
      window.descriptionTimeout = setTimeout(updateDescription, 1000);
    }
  };

  return (
    <TimerContainer>
      <TimerCard>
        <TimerDisplay isRunning={isRunning}>
          {formatTime(elapsedTime)}
        </TimerDisplay>

        <TimerControls>
          <ControlButton
            className="primary"
            isRunning={isRunning}
            onClick={isRunning ? stopTimer : startTimer}
            disabled={!isRunning && !formData.project}
          >
            {isRunning ? <FiPause /> : <FiPlay />}
          </ControlButton>
        </TimerControls>        {runningEntry && (
          <CurrentActivity>
            <ActivityTitle>
              <FiClock style={{ marginRight: '8px' }} />
              Currently tracking: {runningEntry.project?.name}
            </ActivityTitle>
            <ActivityMeta>
              {runningEntry.task?.name && `Task: ${runningEntry.task.name} • `}
              Started: {new Date(runningEntry.startTime).toLocaleTimeString()}
            </ActivityMeta>
          </CurrentActivity>
        )}

        {/* Break Controls */}
        {runningEntry && (
          <BreakCard isOnBreak={!!activeBreak}>
            <BreakStatus isOnBreak={!!activeBreak}>
              <FiCoffee />
              {activeBreak ? 'On Break' : 'Ready for Break'}
            </BreakStatus>
            
            {activeBreak ? (
              <div>
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  Break Type: {activeBreak.breakType} • Started: {new Date(activeBreak.startTime).toLocaleTimeString()}
                </div>
                <BreakControls>
                  <BreakButton className="end-break" onClick={endBreak}>
                    <FiCheckCircle size={16} />
                    End Break
                  </BreakButton>
                </BreakControls>
              </div>
            ) : (
              <BreakControls>
                <BreakTypeSelect 
                  value={breakType} 
                  onChange={(e) => setBreakType(e.target.value)}
                >
                  <option value="coffee">Coffee Break</option>
                  <option value="lunch">Lunch Break</option>
                  <option value="personal">Personal Break</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </BreakTypeSelect>
                <BreakButton className="start-break" onClick={startBreak}>
                  <FiCoffee size={16} />
                  Start Break
                </BreakButton>
              </BreakControls>
            )}
          </BreakCard>
        )}

        <TimerForm>
          <FormGroup>
            <Label>Project *</Label>
            <Select
              value={formData.project}
              onChange={(e) => handleFormChange('project', e.target.value)}
              disabled={isRunning}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Task (Optional)</Label>
            <Select
              value={formData.task}
              onChange={(e) => handleFormChange('task', e.target.value)}
              disabled={isRunning || !formData.project}
            >
              <option value="">Select a task</option>
              {tasks.map(task => (
                <option key={task._id} value={task._id}>
                  {task.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="What are you working on?"
            />
          </FormGroup>
        </TimerForm>
      </TimerCard>
    </TimerContainer>
  );
};

export default Timer;
