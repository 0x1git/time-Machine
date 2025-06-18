import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState([]);

  const fetchAssignedTasks = async () => {
    if (!currentUser?._id) return;
    
    try {
      const response = await axios.get(`/tasks?assignee=${currentUser._id}`);
      const pendingTasks = response.data.filter(task => 
        task.status !== 'completed' && task.status !== 'done' && task.status !== 'cancelled'
      );
      setAssignedTasks(pendingTasks);
      setAssignedTasksCount(pendingTasks.length);
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchAssignedTasks();
    }
  }, [currentUser]);

  const refreshAssignedTasks = () => {
    fetchAssignedTasks();
  };

  const value = {
    assignedTasksCount,
    assignedTasks,
    refreshAssignedTasks
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
