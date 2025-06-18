import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FiClock, FiFolderPlus, FiTrendingUp, FiCalendar, FiClipboard } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const PageSubtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color || '#3498db'}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || '#3498db'};
  margin-right: 16px;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const RecentActivity = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ActivityHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
`;

const ActivityTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
`;

const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color || '#3498db'};
  margin-right: 16px;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityDescription = styled.div`
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const ActivityMeta = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TaskList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TaskItem = styled.div`
  padding: 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #f8f9fa;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f3f4;
    border-color: #d1d5db;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const TaskTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
`;

const TaskStatus = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: capitalize;
  white-space: nowrap;
  background: ${props => {
    switch (props.status) {
      case 'pending': return '#fef3c7';
      case 'in-progress': return '#dbeafe';
      case 'completed': return '#d1fae5';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'pending': return '#92400e';
      case 'in-progress': return '#1e40af';
      case 'completed': return '#065f46';
      default: return '#374151';
    }
  }};
`;

const TaskMeta = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 8px;
`;

const TaskDescription = styled.p`
  font-size: 0.85rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ViewAllTasks = styled.div`
  padding: 12px 16px;
  text-align: center;
  color: #3498db;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #3498db;
  }
`;

const NoTasks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;

  p {
    margin: 12px 0 0 0;
    font-size: 0.9rem;
  }
`;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { assignedTasks, assignedTasksCount } = useNotifications();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, assignedTasks]);const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Fetching dashboard data for user:', currentUser?._id);
        const [dashboardResponse, dailyActivityResponse] = await Promise.all([
        axios.get('/reports/dashboard', { headers }),
        axios.get('/reports/daily-activity?days=7', { headers })
      ]);

      console.log('Assigned tasks from context:', assignedTasks);

      setDashboardData({
        ...dashboardResponse.data,
        dailyActivity: dailyActivityResponse.data,
        assignedTasks: assignedTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const dailyActivityData = {
    labels: dashboardData?.dailyActivity?.map(day => formatDate(day.date)) || [],
    datasets: [
      {
        label: 'Hours Worked',
        data: dashboardData?.dailyActivity?.map(day => day.totalDuration / 3600) || [],
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'h';
          }
        }
      }
    }
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>Welcome back! Here's your productivity overview.</PageSubtitle>
      </DashboardHeader>

      <StatsGrid>
        <StatCard color="#3498db">
          <StatHeader>
            <StatIcon color="#3498db">
              <FiClock size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{formatTime(dashboardData?.todayTime || 0)}</StatValue>
              <StatLabel>Today's Time</StatLabel>
            </StatContent>
          </StatHeader>
        </StatCard>

        <StatCard color="#28a745">
          <StatHeader>
            <StatIcon color="#28a745">
              <FiCalendar size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{formatTime(dashboardData?.weekTime || 0)}</StatValue>
              <StatLabel>This Week</StatLabel>
            </StatContent>
          </StatHeader>
        </StatCard>

        <StatCard color="#17a2b8">
          <StatHeader>
            <StatIcon color="#17a2b8">
              <FiTrendingUp size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{formatTime(dashboardData?.monthTime || 0)}</StatValue>
              <StatLabel>This Month</StatLabel>
            </StatContent>
          </StatHeader>
        </StatCard>        <StatCard color="#f39c12">
          <StatHeader>
            <StatIcon color="#f39c12">
              <FiFolderPlus size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{dashboardData?.activeProjects || 0}</StatValue>
              <StatLabel>Active Projects</StatLabel>
            </StatContent>
          </StatHeader>
        </StatCard>

        <StatCard color="#e74c3c">
          <StatHeader>
            <StatIcon color="#e74c3c">
              <FiClipboard size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{dashboardData?.assignedTasks?.length || 0}</StatValue>
              <StatLabel>Assigned Tasks</StatLabel>
            </StatContent>
          </StatHeader>
        </StatCard>
      </StatsGrid>      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Daily Activity (Last 7 Days)</ChartTitle>
          <Bar data={dailyActivityData} options={chartOptions} />
        </ChartCard>
        
        <ChartCard>
          <ChartTitle>My Assigned Tasks</ChartTitle>
          {dashboardData?.assignedTasks?.length > 0 ? (
            <TaskList>
              {dashboardData.assignedTasks.slice(0, 5).map((task) => (
                <TaskItem key={task._id}>
                  <TaskHeader>
                    <TaskTitle>{task.title}</TaskTitle>
                    <TaskStatus status={task.status}>{task.status}</TaskStatus>
                  </TaskHeader>
                  <TaskMeta>
                    Project: {task.project?.name || 'No project'}
                    {task.dueDate && (
                      <span> • Due: {formatDate(task.dueDate)}</span>
                    )}
                  </TaskMeta>
                  {task.description && (
                    <TaskDescription>{task.description}</TaskDescription>
                  )}
                </TaskItem>
              ))}
              {dashboardData.assignedTasks.length > 5 && (
                <ViewAllTasks>
                  View all {dashboardData.assignedTasks.length} assigned tasks
                </ViewAllTasks>
              )}
            </TaskList>
          ) : (
            <NoTasks>
              <FiClipboard size={48} color="#cbd5e1" />
              <p>No tasks assigned to you</p>
            </NoTasks>
          )}
        </ChartCard>
      </ChartsGrid>

      <RecentActivity>
        <ActivityHeader>
          <ActivityTitle>Recent Time Entries</ActivityTitle>
        </ActivityHeader>
        <ActivityList>
          {dashboardData?.recentEntries?.length > 0 ? (
            dashboardData.recentEntries.map((entry, index) => (
              <ActivityItem key={entry._id || index}>
                <ActivityDot color={entry.project?.color || '#3498db'} />
                <ActivityContent>
                  <ActivityDescription>
                    {entry.description || 'Time tracking'}
                  </ActivityDescription>
                  <ActivityMeta>
                    {entry.project?.name} • {formatTime(entry.duration)} • {formatDate(entry.startTime)}
                  </ActivityMeta>
                </ActivityContent>
              </ActivityItem>
            ))
          ) : (
            <ActivityItem>
              <ActivityContent>
                <ActivityDescription>No recent time entries</ActivityDescription>
                <ActivityMeta>Start tracking time to see your activity here</ActivityMeta>
              </ActivityContent>
            </ActivityItem>
          )}
        </ActivityList>
      </RecentActivity>
    </DashboardContainer>
  );
};

export default Dashboard;
