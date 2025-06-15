import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit, FiTrash2, FiUser, FiCalendar, FiFlag } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const TasksContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
`;

const TasksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const TaskCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
`;

const TaskTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.todo {
    background: #f3f4f6;
    color: #374151;
  }
  
  &.in-progress {
    background: #dbeafe;
    color: #1d4ed8;
  }
  
  &.completed {
    background: #dcfce7;
    color: #166534;
  }
  
  &.on-hold {
    background: #fef3c7;
    color: #92400e;
  }
`;

const PriorityBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.low {
    background: #f0f9ff;
    color: #0369a1;
  }
  
  &.medium {
    background: #fef3c7;
    color: #92400e;
  }
  
  &.high {
    background: #fef2f2;
    color: #dc2626;
  }
  
  &.urgent {
    background: #991b1b;
    color: white;
  }
`;

const TaskDescription = styled.p`
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProjectTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: ${props => props.color || '#3498db'}20;
  color: ${props => props.color || '#3498db'};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const AddButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: #2980b9;
  }
`;

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'on-hold': 'On Hold'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <TasksContainer>
      <PageHeader>
        <PageTitle>Tasks</PageTitle>
        <AddButton>
          <FiPlus size={20} />
          New Task
        </AddButton>
      </PageHeader>

      <TasksGrid>
        {tasks.map(task => (
          <TaskCard key={task._id}>
            <TaskHeader>
              <div>
                <TaskTitle>{task.name}</TaskTitle>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge className={task.status}>
                    {getStatusLabel(task.status)}
                  </StatusBadge>
                  <PriorityBadge className={task.priority}>
                    <FiFlag size={12} style={{ marginRight: '4px' }} />
                    {getPriorityLabel(task.priority)}
                  </PriorityBadge>
                </div>
              </div>
              <TaskActions>
                <ActionButton>
                  <FiEdit size={16} />
                </ActionButton>
                <ActionButton>
                  <FiTrash2 size={16} />
                </ActionButton>
              </TaskActions>
            </TaskHeader>

            {task.description && (
              <TaskDescription>{task.description}</TaskDescription>
            )}

            <TaskMeta>
              {task.assignee && (
                <MetaItem>
                  <FiUser size={14} />
                  {task.assignee.name}
                </MetaItem>
              )}
              {task.dueDate && (
                <MetaItem>
                  <FiCalendar size={14} />
                  {new Date(task.dueDate).toLocaleDateString()}
                </MetaItem>
              )}
            </TaskMeta>

            {task.project && (
              <ProjectTag color={task.project.color}>
                {task.project.name}
              </ProjectTag>
            )}
          </TaskCard>
        ))}
      </TasksGrid>

      {tasks.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#6b7280' }}>
          <p>No tasks found. Create your first task to get started!</p>
        </div>
      )}
    </TasksContainer>
  );
};

export default Tasks;
