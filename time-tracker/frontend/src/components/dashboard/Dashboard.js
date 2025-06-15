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
import { FiClock, FiFolderPlus, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import axios from 'axios';

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

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, dailyActivityResponse] = await Promise.all([
        axios.get('/reports/dashboard'),
        axios.get('/reports/daily-activity?days=7')
      ]);

      setDashboardData({
        ...dashboardResponse.data,
        dailyActivity: dailyActivityResponse.data
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
        </StatCard>

        <StatCard color="#f39c12">
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
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Daily Activity (Last 7 Days)</ChartTitle>
          <Bar data={dailyActivityData} options={chartOptions} />
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
