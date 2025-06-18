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

const ProjectTag = styled.span`
  padding: 4px 8px;
  background: ${props => props.color || '#3498db'}20;
  color: ${props => props.color || '#3498db'};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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
  const [teamLoading, setTeamLoading] = useState(false);
  const [filters, setFilters] = useState({
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
        console.log('🔍 Project team data received:', response.data);
        setTeamOverview(response.data);
      } else {
        // Fetch general team overview
        const response = await axios.get('/reports/team-overview', { 
          params: { startDate: filters.startDate, endDate: filters.endDate } 
        });
        console.log('🔍 Team overview data received:', response.data);
        setTeamOverview(response.data);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data. Please try again.');
      setTeamOverview({});
    } finally {
      setTeamLoading(false);
    }
  };  const fetchReportData = async () => {
    try {
      setChartsLoading(true);
      setError('');
      
      // Add cache busting timestamp
      const cacheBuster = Date.now();
      
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
      ]);

      setTimeByProject(projectTimeResponse.data || []);
      setDailyActivity(dailyResponse.data || []);
      setTimesheet(timesheetResponse.data.timeEntries || []);
      
      const newTotals = timesheetResponse.data.totals || {};
      setTotals(newTotals);
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
  };const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0h 0m";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    // If less than 1 minute, show seconds for clarity
    if (hours === 0 && minutes === 0 && remainingSeconds > 0) {
      return `${remainingSeconds}s`;
    }
    
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
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const lineChartOptions = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
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
        <PermissionGate permission="canViewTeamReports">
          <Tab 
            active={activeTab === 'team'} 
            onClick={() => setActiveTab('team')}
          >
            Team Reports
          </Tab>
        </PermissionGate>
      </TabsContainer>

      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '6px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

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
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FilterGroup>      </FiltersRow>      {activeTab === 'individual' && (
        <>
          {totals.totalDuration === 0 && timesheet.length === 0 && !chartsLoading && (
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '2rem', 
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#6c757d'
            }}>
              <FiClock size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>No Time Tracked Yet</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Start tracking your time to see reports and analytics here. Use the timer on the dashboard to begin.
              </p>
            </div>
          )}
          
          <StatsGrid><StatCard color="#3498db">
          <StatValue>{formatTime(totals.totalDuration || 0)}</StatValue>
          <StatLabel>
            <FiClock size={16} />
            Total Time Tracked
            {totals.totalDuration > 0 && totals.totalDuration < 60 && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                ({totals.totalDuration} seconds)
              </div>
            )}
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
          <Line data={dailyChartData} options={lineChartOptions} />
        </ChartCard>

        <ChartCard>
          <ChartTitle>Time by Project</ChartTitle>
          {timeByProject.length > 0 ? (
            <Doughnut data={projectChartData} options={chartOptions} />
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              No data available
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
          {timesheet.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No time entries found for the selected period.
          </div>
        )}      </TimesheetCard>
          
          {/* Break Reports Section */}
          <PermissionGate permission="canViewTeamReports">
            <BreakReports filters={filters} />
          </PermissionGate>
        </>
      )}      {activeTab === 'team' && (
        <PermissionGate permission="canViewTeamReports">
          {teamLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px' 
            }}>
              <div className="loading-spinner"></div>
            </div>
          ) : Object.keys(teamOverview).length > 0 ? (
            <div>              <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
                {filters.project ? 'Project Team Overview' : 'Team Overview'}
              </h3>
              
              {teamOverview.summary && (
                <StatsGrid>
                  <StatCard color="#3498db">
                    <StatValue>{teamOverview.summary.totalUsers || 0}</StatValue>
                    <StatLabel>
                      <FiUsers size={16} />
                      Team Members
                    </StatLabel>
                  </StatCard>
                  
                  <StatCard color="#28a745">
                    <StatValue>{formatTime(teamOverview.summary.totalDuration || 0)}</StatValue>
                    <StatLabel>
                      <FiClock size={16} />
                      Total Team Time
                    </StatLabel>
                  </StatCard>
                  
                  <StatCard color="#17a2b8">
                    <StatValue>{teamOverview.summary.totalEntries || 0}</StatValue>
                    <StatLabel>
                      <FiCalendar size={16} />
                      Total Entries
                    </StatLabel>
                  </StatCard>
                  
                  <StatCard color="#f39c12">
                    <StatValue>{teamOverview.summary.totalProjects || teamOverview.summary.totalTasks || 0}</StatValue>
                    <StatLabel>
                      {filters.project ? 'Tasks Worked On' : 'Active Projects'}
                    </StatLabel>
                  </StatCard>
                </StatsGrid>
              )}
                {(teamOverview.teamStats || teamOverview.userStats) && (teamOverview.teamStats?.length > 0 || teamOverview.userStats?.length > 0) && (
                <TimesheetCard style={{ marginTop: '2rem' }}>
                  <TimesheetHeader>
                    <TimesheetTitle>
                      {filters.project ? 'Project Team Performance' : 'Team Performance'}
                    </TimesheetTitle>
                  </TimesheetHeader>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Team Member</TableHeaderCell>
                        <TableHeaderCell>Email</TableHeaderCell>
                        <TableHeaderCell>Total Time</TableHeaderCell>
                        <TableHeaderCell>Billable Time</TableHeaderCell>
                        <TableHeaderCell>Entries</TableHeaderCell>
                        <TableHeaderCell>{filters.project ? 'Tasks' : 'Projects'}</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {(teamOverview.teamStats || teamOverview.userStats || []).map(member => (
                        <TableRow key={member.user._id}>
                          <TableCell>{member.user.name}</TableCell>
                          <TableCell>{member.user.email}</TableCell>
                          <TableCell>{formatTime(member.totalDuration)}</TableCell>
                          <TableCell>{formatTime(member.billableDuration)}</TableCell>
                          <TableCell>{member.totalEntries}</TableCell>
                          <TableCell>{member.projectCount || member.taskCount || 0}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </TimesheetCard>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: '#6b7280',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <FiUsers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Team Data Available</h3>
              <p>No team activity found for the selected date range.</p>
            </div>
          )}
        </PermissionGate>
      )}
    </ReportsContainer>
  );
};

export default Reports;
