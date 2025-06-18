import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus, FiEdit, FiTrash2, FiUser, FiCalendar, FiFlag } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  margin: 20px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;

  &:hover {
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
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
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
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

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #3498db;
    color: white;
    border: none;

    &:hover {
      background: #2980b9;
    }
  }

  &.secondary {
    background: #f8f9fa;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #e9ecef;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MultiSelectContainer = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  min-height: 40px;
  padding: 8px;
  cursor: pointer;
  
  &:focus-within {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const SelectedMembers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
`;

const MemberTag = styled.span`
  background: #e1f5fe;
  color: #0277bd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RemoveTag = styled.button`
  background: none;
  border: none;
  color: #0277bd;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  
  &:hover {
    color: #01579b;
  }
`;

const MemberDropdown = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  position: absolute;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MemberOption = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Tasks = () => {
  const { currentUser } = useAuth();
  const { refreshAssignedTasks } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);  const [projects, setProjects] = useState([]);  const [teamMembers, setTeamMembers] = useState([]);
  const [canAssignTasks, setCanAssignTasks] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    projectId: '',
    assignees: [],
    dueDate: ''
  });useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTeamMembers();
    checkAssignPermissions();
  }, []);

  // Handle URL parameters for task assignment from teams page
  useEffect(() => {
    const assigneeId = searchParams.get('assignee');
    const assigneeName = searchParams.get('assigneeName');
    const action = searchParams.get('action');
    
    if (assigneeId && action === 'create') {
      // Show notification about pre-filled assignee
      if (assigneeName) {
        toast.info(`Creating a new task for ${assigneeName}`);
      }
        // Wait a bit for data to load before opening modal
      setTimeout(() => {
        setFormData(prev => ({ ...prev, assignees: [assigneeId] }));
        setShowModal(true);
        // Clear URL parameters
        setSearchParams({});
      }, 500);
    }
  }, [searchParams, setSearchParams]);

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

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/teams');
      // Extract all unique team members from all teams the user has access to
      const allMembers = [];
      response.data.forEach(team => {
        team.members.forEach(member => {
          if (!allMembers.find(m => m._id === member.user._id)) {
            allMembers.push({
              _id: member.user._id,
              name: member.user.name,
              email: member.user.email
            });
          }
        });
      });
      setTeamMembers(allMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const checkAssignPermissions = async () => {
    try {
      const response = await axios.get('/teams');
      // Check if user is admin or manager in any team
      let hasPermission = false;
      response.data.forEach(team => {
        const userMember = team.members.find(m => m.user._id === currentUser?._id);
        if (userMember && (userMember.role === 'admin' || userMember.role === 'manager' || userMember.permissions?.canManageTeam)) {
          hasPermission = true;
        }
      });
      setCanAssignTasks(hasPermission);
    } catch (error) {
      console.error('Error checking assign permissions:', error);
      setCanAssignTasks(false);
    }
  };

  // Helper function to display detailed error messages
  const handleApiError = (error, defaultMessage) => {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.details && errorData.action) {
        // Show detailed error with action steps
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{errorData.message}</div>
            <div style={{ marginBottom: '8px' }}>{errorData.details}</div>
            {errorData.projectInfo && (
              <div style={{ marginBottom: '8px', fontSize: '0.9em' }}>
                <strong>Project:</strong> {errorData.projectInfo.name}<br/>
                <strong>Owner:</strong> {errorData.projectInfo.owner}<br/>
                <strong>Members:</strong> {errorData.projectInfo.members}
              </div>
            )}
            <div style={{ fontStyle: 'italic', color: '#666' }}>
              {errorData.action}
            </div>
            {errorData.solution && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.9em' }}>
                <strong>Solution:</strong> {errorData.solution}
              </div>
            )}
          </div>,
          {
            autoClose: 8000, // Show longer for detailed messages
            style: { width: '400px' }
          }
        );
      } else if (errorData.message) {
        toast.error(errorData.message);
      } else {
        toast.error(defaultMessage);
      }
    } else {
      toast.error(defaultMessage);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      if (projects.length === 0) {
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>No Projects Available</div>
            <div style={{ marginBottom: '8px' }}>You don't have access to any projects where you can create tasks.</div>
            <div style={{ fontStyle: 'italic', color: '#666' }}>
              To create tasks, you need to be added as a member to at least one project.
            </div>
            <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.9em' }}>
              <strong>Solution:</strong> Ask a project owner to add you to their project through the project management interface.
            </div>
          </div>,
          {
            autoClose: 8000,
            style: { width: '400px' }
          }
        );
      } else {
        toast.error('Please select a project');
      }
      return;
    }    try {
      const taskData = {
        ...formData,
        project: formData.projectId,
        assignees: formData.assignees || []
      };
      
      if (editingTask && editingTask._id) {
        await axios.put(`/tasks/${editingTask._id}`, taskData);
        toast.success('Task updated successfully');
        if (taskData.assignees.length > 0) {
          toast.info(`Task assigned to ${taskData.assignees.length} user(s)`);
        }
      } else {
        await axios.post('/tasks', taskData);
        toast.success('Task created successfully');
        if (taskData.assignees.length > 0) {
          toast.info(`Task assigned to ${taskData.assignees.length} user(s)`);
        }      }
      fetchTasks();
      refreshAssignedTasks(); // Refresh notification count
      closeModal();
    } catch (error) {
      handleApiError(error, editingTask ? 'Failed to update task' : 'Failed to create task');
      console.error('Error saving task:', error);
    }
  };
  const openModal = (task = null) => {
    // Prevent opening modal if no projects available (for new tasks)
    if (!task && projects.length === 0) {
      toast.error(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Cannot Create Task</div>
          <div style={{ marginBottom: '8px' }}>You don't have access to any projects.</div>
          <div style={{ fontStyle: 'italic', color: '#666' }}>
            Ask a project owner to add you as a member to create tasks.
          </div>
        </div>,
        {
          autoClose: 5000,
          style: { width: '350px' }
        }
      );
      return;
    }    if (task) {      setEditingTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        projectId: task.project?._id || '',
        assignees: task.assignees ? task.assignees.map(a => a._id) : [],
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        name: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        projectId: '',
        assignees: [],
        dueDate: ''
      });
    }
    setShowModal(true);
  };  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);    setFormData({
      name: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      projectId: '',
      assignees: [],
      dueDate: ''
    });
  };
  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        handleApiError(error, 'Failed to delete task');
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAssignee = (memberId) => {
    if (!formData.assignees.includes(memberId)) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, memberId]
      }));
    }
    setShowAssigneeDropdown(false);
  };

  const handleRemoveAssignee = (memberId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter(id => id !== memberId)
    }));
  };

  const getSelectedMembers = () => {
    return formData.assignees.map(id => 
      teamMembers.find(member => member._id === id)
    ).filter(Boolean);
  };

  const getAvailableMembers = () => {
    return teamMembers.filter(member => 
      !formData.assignees.includes(member._id)
    );
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
        <PageTitle>Tasks</PageTitle>        <AddButton 
          onClick={() => openModal(null)}
          disabled={projects.length === 0}
          title={projects.length === 0 ? "You need access to at least one project to create tasks" : "Create a new task"}
          style={{
            opacity: projects.length === 0 ? 0.5 : 1,
            cursor: projects.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
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
              </div>              <TaskActions>
                <ActionButton onClick={() => openModal(task)}>
                  <FiEdit size={16} />
                </ActionButton>
                <ActionButton onClick={() => handleDelete(task._id)}>
                  <FiTrash2 size={16} />
                </ActionButton>
              </TaskActions>
            </TaskHeader>

            {task.description && (
              <TaskDescription>{task.description}</TaskDescription>
            )}            <TaskMeta>
              {task.assignees && task.assignees.length > 0 && (
                <MetaItem>
                  <FiUser size={14} />
                  {task.assignees.map(assignee => assignee.name).join(', ')}
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
      </TasksGrid>      {tasks.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#6b7280' }}>
          {projects.length === 0 ? (
            <div>
              <h3 style={{ color: '#374151', marginBottom: '16px' }}>No Projects Available</h3>
              <p style={{ marginBottom: '16px' }}>You don't have access to any projects where you can create tasks.</p>
              <p style={{ fontSize: '0.9em', fontStyle: 'italic', color: '#9ca3af' }}>
                To create and view tasks, you need to be added as a member to at least one project.
              </p>
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                background: '#f0f9ff', 
                borderRadius: '8px', 
                border: '1px solid #dbeafe',
                display: 'inline-block',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                  How to get project access:
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                  <li>Ask a project owner to add you to their project</li>
                  <li>Or create your own project if you have permission</li>
                  <li>Contact your administrator for help</li>
                </ol>
              </div>
            </div>
          ) : (
            <p>No tasks found. Create your first task to get started!</p>
          )}
        </div>
      )}

      {showModal && (
        <Modal>          <ModalContent>
            <ModalHeader>
              <ModalTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  id="task-priority"
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="task-status">Status</Label>
                <Select
                  id="task-status"
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </Select>
              </FormGroup>              <FormGroup>
                <Label htmlFor="task-project">Project *</Label>
                <Select
                  id="task-project"
                  value={formData.projectId}
                  onChange={(e) => handleFormChange('projectId', e.target.value)}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </Select>              </FormGroup>              {canAssignTasks && (
                <FormGroup style={{ position: 'relative' }}>
                  <Label htmlFor="task-assignees">Assignees</Label>
                  <MultiSelectContainer
                    id="task-assignees"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    <SelectedMembers>
                      {getSelectedMembers().length === 0 && (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                          Click to select team members
                        </span>
                      )}
                      {getSelectedMembers().map(member => (
                        <MemberTag key={member._id}>
                          {member.name}
                          <RemoveTag 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAssignee(member._id);
                            }}
                          >
                            ×
                          </RemoveTag>
                        </MemberTag>
                      ))}
                    </SelectedMembers>

                    {showAssigneeDropdown && (
                      <MemberDropdown>
                        {getAvailableMembers().length === 0 ? (
                          <MemberOption style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                            All team members are assigned
                          </MemberOption>
                        ) : (
                          getAvailableMembers().map(member => (
                            <MemberOption 
                              key={member._id} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddAssignee(member._id);
                              }}
                            >
                              {member.name} ({member.email})                            </MemberOption>
                          ))
                        )}
                      </MemberDropdown>
                    )}
                  </MultiSelectContainer>
                </FormGroup>
              )}

              <FormGroup>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                />
              </FormGroup>              <ModalActions>
                <Button type="button" className="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </TasksContainer>
  );
};

export default Tasks;
