import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiCoffee, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';

const BreakReportsContainer = styled.div`
  margin-top: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BreakStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const BreakList = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const BreakItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const BreakInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BreakUser = styled.div`
  font-weight: 500;
  color: #2c3e50;
`;

const BreakMeta = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const BreakDuration = styled.div`
  font-weight: 600;
  color: #3498db;
`;

const BreakReports = ({ filters }) => {
  const [breakSummary, setBreakSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentBreaks, setRecentBreaks] = useState([]);

  useEffect(() => {
    fetchBreakData();
  }, [filters]);

  const fetchBreakData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.user,
        projectId: filters.project
      };

      const [summaryResponse, breaksResponse] = await Promise.all([
        axios.get('/breaks/reports/summary', { params }),
        axios.get('/breaks', { params: { ...params, limit: 10 } })
      ]);

      setBreakSummary(summaryResponse.data);
      setRecentBreaks(breaksResponse.data.breaks || []);
    } catch (error) {
      console.error('Error fetching break data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalStats = () => {
    const totalBreakTime = breakSummary.reduce((sum, user) => sum + user.totalBreakTime, 0);
    const totalBreaks = breakSummary.reduce((sum, user) => sum + user.totalBreaks, 0);
    const avgBreakTime = totalBreaks > 0 ? totalBreakTime / totalBreaks : 0;
    
    return {
      totalBreakTime,
      totalBreaks,
      avgBreakTime,
      totalUsers: breakSummary.length
    };
  };

  const getBreakTypeChartData = () => {
    const breakTypes = {};
    
    breakSummary.forEach(user => {
      user.breakTypes.forEach(breakType => {
        if (!breakTypes[breakType.type]) {
          breakTypes[breakType.type] = 0;
        }
        breakTypes[breakType.type] += breakType.totalDuration;
      });
    });

    return {
      labels: Object.keys(breakTypes).map(type => 
        type.charAt(0).toUpperCase() + type.slice(1)
      ),
      datasets: [{
        data: Object.values(breakTypes),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 0
      }]
    };
  };

  const getUserBreakChartData = () => {
    const topUsers = breakSummary
      .sort((a, b) => b.totalBreakTime - a.totalBreakTime)
      .slice(0, 10);

    return {
      labels: topUsers.map(user => user.userName),
      datasets: [{
        label: 'Break Time (minutes)',
        data: topUsers.map(user => Math.round(user.totalBreakTime / 60)),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
      }]
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return <div>Loading break reports...</div>;
  }

  return (
    <BreakReportsContainer>
      <SectionTitle>
        <FiCoffee />
        Break Reports
      </SectionTitle>

      <BreakStatsGrid>
        <StatCard color="#ff6b35">
          <StatValue>{formatDuration(stats.totalBreakTime)}</StatValue>
          <StatLabel>
            <FiClock size={16} />
            Total Break Time
          </StatLabel>
        </StatCard>

        <StatCard color="#28a745">
          <StatValue>{stats.totalBreaks}</StatValue>
          <StatLabel>
            <FiCoffee size={16} />
            Total Breaks
          </StatLabel>
        </StatCard>

        <StatCard color="#3498db">
          <StatValue>{formatDuration(stats.avgBreakTime)}</StatValue>
          <StatLabel>
            <FiTrendingUp size={16} />
            Average Break Duration
          </StatLabel>
        </StatCard>

        <StatCard color="#9b59b6">
          <StatValue>{stats.totalUsers}</StatValue>
          <StatLabel>
            <FiUsers size={16} />
            Employees with Breaks
          </StatLabel>
        </StatCard>
      </BreakStatsGrid>

      <ChartGrid>
        <ChartCard>
          <ChartTitle>Break Types Distribution</ChartTitle>
          <Doughnut 
            data={getBreakTypeChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
            height={300}
          />
        </ChartCard>

        <ChartCard>
          <ChartTitle>Break Time by Employee</ChartTitle>
          <Bar 
            data={getUserBreakChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Minutes'
                  }
                }
              }
            }}
            height={300}
          />
        </ChartCard>
      </ChartGrid>

      <BreakList>
        <ChartTitle>Recent Breaks</ChartTitle>
        {recentBreaks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            No breaks found for the selected period
          </div>
        ) : (
          recentBreaks.map(breakItem => (
            <BreakItem key={breakItem._id}>
              <BreakInfo>
                <BreakUser>{breakItem.user?.name || 'Unknown User'}</BreakUser>
                <BreakMeta>
                  {breakItem.breakType.charAt(0).toUpperCase() + breakItem.breakType.slice(1)} • 
                  {' '}{new Date(breakItem.startTime).toLocaleDateString()} at {new Date(breakItem.startTime).toLocaleTimeString()}
                  {breakItem.project && ` • ${breakItem.project.name}`}
                </BreakMeta>
              </BreakInfo>
              <BreakDuration>
                {formatDuration(breakItem.duration)}
              </BreakDuration>
            </BreakItem>
          ))
        )}
      </BreakList>
    </BreakReportsContainer>
  );
};

export default BreakReports;
