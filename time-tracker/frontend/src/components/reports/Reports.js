import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FiDownload, FiCalendar, FiClock, FiDollarSign, FiUsers } from 'react-icons/fi';
import axios from 'axios';
import BreakReports from './BreakReports';
import { PermissionGate } from '../common/PermissionGate';

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

const ReportsContainer = styled.div`
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

const FiltersRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const Select = styled.select`
  padding: 8px 12px;
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
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
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

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 350px;
  
  @media (max-width: 768px) {
    padding: 16px;
    min-height: 300px;
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const TimesheetCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TimesheetHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: between;
  align-items: center;
`;

const TimesheetTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
`;

const ExportButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: #218838;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  
  @media (max-width: 768px) {
    -webkit-overflow-scrolling: touch;
  }
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e9ecef;

  &:hover {
    background: #f8f9fa;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #495057;
`;

const ProjectTag = styled.span`
  padding: 4px 8px;
  background: ${props => props.color || '#3498db'}20;
  color: ${props => props.color || '#3498db'};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e1e5e9;
  margin-bottom: 32px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.active ? '#3498db' : '#6b7280'};
  border-bottom: 3px solid ${props => props.active ? '#3498db' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3498db;
  }
`;

const TeamReportCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const TeamReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e1e5e9;
`;

const TeamReportTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const UserStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const UserStatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const UserName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
`;

const UserTimeStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const TimeLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const TimeValue = styled.span`
  font-weight: 600;
  color: #2c3e50;
`;

const ProjectSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
`;

const ProjectSummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const ProjectSummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProjectName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserDisplayName = styled.span`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const UserDisplayEmail = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const Reports = () => {
  const [timeByProject, setTimeByProject] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [timesheet, setTimesheet] = useState([]);
  const [totals, setTotals] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'team'
  const [teamOverview, setTeamOverview] = useState({});
  const [selectedProjectTeam, setSelectedProjectTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    project: ''
  });
  // Debounced effect for filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'individual') {
        fetchReportData();
      } else {
        fetchTeamData();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, activeTab]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    }
  };

  const fetchTeamData = async () => {
    try {
      setTeamLoading(true);
      setError('');
      
      if (filters.project) {
        // Fetch specific project team data
        const response = await axios.get(`/reports/project-team/${filters.project}`, { 
          params: { startDate: filters.startDate, endDate: filters.endDate } 
        });
        setSelectedProjectTeam(response.data);
      } else {
        // Fetch team overview for all projects
        const response = await axios.get('/reports/team-overview', { 
          params: { startDate: filters.startDate, endDate: filters.endDate } 
        });
        setTeamOverview(response.data);
        setSelectedProjectTeam(null);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data. Please try again.');
      setTeamOverview({});
      setSelectedProjectTeam(null);
    } finally {
      setTeamLoading(false);
    }
  };  const fetchReportData = async () => {
    try {
      setChartsLoading(true);
      setError('');
      
      // Add cache busting timestamp
      const cacheBuster = Date.now();
      
      console.log('🔍 DEBUG: Fetching report data with filters:', filters);
      console.log('🔍 DEBUG: Project filter applied:', filters.project || 'None (all projects)');
      
      const [projectTimeResponse, dailyResponse, timesheetResponse] = await Promise.all([        
        axios.get('/reports/time-by-project', { 
          params: { ...filters, _cb: cacheBuster },
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        }),
        axios.get('/reports/daily-activity', { 
          params: { days: 30, _cb: cacheBuster },
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        }),
        axios.get('/reports/timesheet', { 
          params: { ...filters, limit: 50, _cb: cacheBuster },
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        })
      ]);      console.log('🔍 DEBUG: Timesheet response:', timesheetResponse.data);
      console.log('🔍 DEBUG: Totals received:', timesheetResponse.data.totals);
      console.log('🔍 DEBUG: Time entries count:', timesheetResponse.data.timeEntries?.length || 0);
      console.log('🔍 DEBUG: Project time data:', projectTimeResponse.data);

      setTimeByProject(projectTimeResponse.data || []);
      setDailyActivity(dailyResponse.data || []);
      setTimesheet(timesheetResponse.data.timeEntries || []);
      setTotals(timesheetResponse.data.totals || {});
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try again.');
      // Set empty states on error
      setTimeByProject([]);
      setDailyActivity([]);
      setTimesheet([]);
      setTotals({});
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  };  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0h 0m";
    }
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const projectChartData = {
    labels: timeByProject.map(item => item.projectName),
    datasets: [
      {
        data: timeByProject.map(item => item.totalDuration / 3600),
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#f39c12',
          '#e74c3c',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#f1c40f'
        ],
        borderWidth: 0,
      }
    ]
  };

  const dailyChartData = {
    labels: dailyActivity.map(day => formatDate(day.date)),
    datasets: [
      {
        label: 'Hours Worked',
        data: dailyActivity.map(day => day.totalDuration / 3600),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const hours = context.parsed || 0;
            return `${context.label}: ${formatTime(hours * 3600)}`;
          }
        }
      }
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const hours = context.parsed.y || 0;
            return `Hours: ${formatTime(hours * 3600)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'h';
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };
  if (loading) {
    return (
      <ReportsContainer>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
          <span style={{ marginLeft: '1rem', color: '#6b7280' }}>Loading reports...</span>
        </div>
      </ReportsContainer>
    );
  }

  if (error) {
    return (
      <ReportsContainer>
        <PageHeader>
          <PageTitle>Reports & Analytics</PageTitle>
        </PageHeader>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#ef4444', 
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <p>{error}</p>
          <button 
            onClick={fetchReportData}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </ReportsContainer>
    );
  }
  return (
    <ReportsContainer>
      <PageHeader>
        <PageTitle>Reports & Analytics</PageTitle>
      </PageHeader>

      <TabsContainer>
        <Tab 
          active={activeTab === 'individual'} 
          onClick={() => setActiveTab('individual')}
        >
          Individual Reports
        </Tab>
        <Tab 
          active={activeTab === 'team'} 
          onClick={() => setActiveTab('team')}
        >
          Team Reports
        </Tab>
      </TabsContainer>

      <FiltersRow>
        <FilterGroup>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </FilterGroup>
        
        <FilterGroup>
          <Label>End Date</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </FilterGroup>
        
        <FilterGroup>
          <Label>Project</Label>
          <Select
            value={filters.project}
            onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
          >
            <option value="">
              {activeTab === 'team' ? 'All Projects Overview' : 'All Projects'}
            </option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FilterGroup>
      </FiltersRow>

      {activeTab === 'individual' && (
        <>
          <StatsGrid>            <StatCard color="#3498db">
              <StatValue>{formatTime(totals.totalDuration || 0)}</StatValue>
              <StatLabel>
                <FiClock size={16} />
                Total Time Tracked
              </StatLabel>
            </StatCard>

            <StatCard color="#28a745">
              <StatValue>{formatTime(totals.billableDuration || 0)}</StatValue>
              <StatLabel>
                <FiDollarSign size={16} />
                Billable Time
              </StatLabel>
            </StatCard>

            <StatCard color="#17a2b8">
              <StatValue>{totals.totalEntries || 0}</StatValue>
              <StatLabel>
                <FiCalendar size={16} />
                Time Entries
              </StatLabel>
            </StatCard>

            <StatCard color="#f39c12">
              <StatValue>{timeByProject.length}</StatValue>
              <StatLabel>
                Active Projects
              </StatLabel>
            </StatCard>
          </StatsGrid>

          <ChartsGrid>
            <ChartCard>
              <ChartTitle>Daily Activity</ChartTitle>
              {chartsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : dailyActivity.length > 0 ? (
                <Line data={dailyChartData} options={lineChartOptions} />
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No activity data available for the selected period
                </div>
              )}
            </ChartCard>

            <ChartCard>
              <ChartTitle>Time by Project</ChartTitle>
              {chartsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : timeByProject.length > 0 ? (
                <Doughnut data={projectChartData} options={chartOptions} />
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No project data available for the selected period
                </div>
              )}
            </ChartCard>
          </ChartsGrid>

          <TimesheetCard>
            <TimesheetHeader>
              <TimesheetTitle>Timesheet</TimesheetTitle>
              <ExportButton>
                <FiDownload size={16} />
                Export
              </ExportButton>
            </TimesheetHeader>
            
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Project</TableHeaderCell>
                    <TableHeaderCell>Task</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Duration</TableHeaderCell>
                    <TableHeaderCell>Billable</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {timesheet.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell>{formatDateTime(entry.startTime)}</TableCell>
                      <TableCell>
                        {entry.project && (
                          <ProjectTag color={entry.project.color}>
                            {entry.project.name}
                          </ProjectTag>
                        )}
                      </TableCell>
                      <TableCell>{entry.task?.name || '-'}</TableCell>
                      <TableCell>{entry.description || '-'}</TableCell>
                      <TableCell>{formatTime(entry.duration)}</TableCell>
                      <TableCell>{entry.billable ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
            {timesheet.length === 0 && !chartsLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No time entries found for the selected period.
              </div>
            )}
          </TimesheetCard>
        </>
      )}

      {activeTab === 'team' && (
        <>
          {teamLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div className="loading-spinner"></div>
              <span style={{ marginLeft: '1rem', color: '#6b7280' }}>Loading team data...</span>
            </div>
          ) : selectedProjectTeam ? (
            // Specific project team report
            <TeamReportCard>
              <TeamReportHeader>
                <div>
                  <TeamReportTitle>{selectedProjectTeam.project.name}</TeamReportTitle>
                  <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                    {new Date(selectedProjectTeam.dateRange.startDate).toLocaleDateString()} - {new Date(selectedProjectTeam.dateRange.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#3498db' }}>
                    {formatTime(selectedProjectTeam.summary.totalTime)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {selectedProjectTeam.summary.totalUsers} team members
                  </div>
                </div>
              </TeamReportHeader>

              <UserStatsGrid>
                {selectedProjectTeam.teamStats.map(userStat => (
                  <UserStatCard key={userStat.user._id} color="#3498db">
                    <UserName>{userStat.user.name}</UserName>
                    <UserEmail>{userStat.user.email}</UserEmail>
                    <UserTimeStats>
                      <TimeLabel>Total Time:</TimeLabel>
                      <TimeValue>{formatTime(userStat.totalTime)}</TimeValue>
                    </UserTimeStats>
                    <UserTimeStats>
                      <TimeLabel>Entries:</TimeLabel>
                      <TimeValue>{userStat.entries.length}</TimeValue>
                    </UserTimeStats>
                    <UserTimeStats>
                      <TimeLabel>First Entry:</TimeLabel>
                      <TimeValue>{formatDateTime(userStat.firstEntry)}</TimeValue>
                    </UserTimeStats>
                    <UserTimeStats>
                      <TimeLabel>Last Entry:</TimeLabel>
                      <TimeValue>{formatDateTime(userStat.lastEntry)}</TimeValue>
                    </UserTimeStats>
                  </UserStatCard>
                ))}
              </UserStatsGrid>

              {selectedProjectTeam.teamStats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No team activity found for the selected period.
                </div>
              )}
            </TeamReportCard>
          ) : teamOverview.projects ? (
            // All projects overview
            <>
              <StatsGrid>
                <StatCard color="#3498db">
                  <StatValue>{formatTime(teamOverview.summary?.totalTime || 0)}</StatValue>
                  <StatLabel>
                    <FiClock size={16} />
                    Total Team Time
                  </StatLabel>
                </StatCard>
                <StatCard color="#28a745">
                  <StatValue>{teamOverview.summary?.totalProjects || 0}</StatValue>
                  <StatLabel>
                    Active Projects
                  </StatLabel>
                </StatCard>
                <StatCard color="#17a2b8">
                  <StatValue>{teamOverview.summary?.totalUsers || 0}</StatValue>
                  <StatLabel>
                    <FiUsers size={16} />
                    Active Users
                  </StatLabel>
                </StatCard>
              </StatsGrid>

              <ProjectSummaryGrid>
                {teamOverview.projects.map(project => (
                  <ProjectSummaryCard key={project.project._id} color={project.project.color}>
                    <ProjectSummaryHeader>
                      <ProjectName>{project.project.name}</ProjectName>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: project.project.color }}>
                          {formatTime(project.totalTime)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {project.userCount} members
                        </div>
                      </div>
                    </ProjectSummaryHeader>
                    <UsersList>
                      {project.users.map(userStat => (
                        <UserItem key={userStat.user._id}>
                          <UserInfo>
                            <UserDisplayName>{userStat.user.name}</UserDisplayName>
                            <UserDisplayEmail>{userStat.user.email}</UserDisplayEmail>
                          </UserInfo>
                          <TimeValue>{formatTime(userStat.time)}</TimeValue>
                        </UserItem>
                      ))}
                    </UsersList>
                  </ProjectSummaryCard>
                ))}
              </ProjectSummaryGrid>

              {teamOverview.projects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No team projects found for the selected period.
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Break Reports Section */}
      <PermissionGate permission="canViewTeamReports">
        <BreakReports filters={filters} />
      </PermissionGate>
    </ReportsContainer>
  );
};

export default Reports;
