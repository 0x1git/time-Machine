import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../common/PermissionGate';

const ProjectsContainer = styled.div`
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

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const ProjectCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ProjectHeader = styled.div`
  padding: 20px;
  border-left: 4px solid ${props => props.color || '#3498db'};
  position: relative;
`;

const ProjectActions = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
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

  &.danger:hover {
    background: #fef2f2;
    color: #dc2626;
  }
`;

const ProjectName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  margin-right: 60px;
`;

const ProjectDescription = styled.p`
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.875rem;
  color: #6b7280;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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

const ColorPicker = styled.input`
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  background: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
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

const MembersList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
`;

const MemberItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const MemberName = styled.span`
  font-weight: 500;
  color: #2c3e50;
`;

const MemberEmail = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const RemoveButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #c0392b;
  }
`;

const AddMemberForm = styled.form`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const MemberSelect = styled.select`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3498db'
  });  const [memberForm, setMemberForm] = useState({
    userId: ''
  });
  
  const permissions = usePermissions();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProject) {
        await axios.put(`/projects/${editingProject._id}`, formData);
        toast.success('Project updated successfully');
      } else {
        await axios.post('/projects', formData);
        toast.success('Project created successfully');
      }
      
      fetchProjects();
      closeModal();
    } catch (error) {
      toast.error(editingProject ? 'Failed to update project' : 'Failed to create project');
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`/projects/${projectId}`);
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        toast.error('Failed to delete project');
        console.error('Error deleting project:', error);
      }
    }
  };

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color || '#3498db'
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        color: '#3498db'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      color: '#3498db'
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
  // Project member management functions
  const openMembersModal = async (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    
    // Only fetch available members if user has edit permissions
    if (permissions.canEditOwnProjects) {
      try {
        const response = await axios.get(`/projects/${project._id}/available-members`);
        setAvailableMembers(response.data);
      } catch (error) {
        toast.error('Failed to load available members');
        console.error('Error fetching available members:', error);
      }
    }
  };const closeMembersModal = () => {
    setShowMembersModal(false);
    setSelectedProject(null);
    setMemberForm({ userId: '' });
    setAvailableMembers([]);
  };  const addMember = async (e) => {
    e.preventDefault();
    
    if (!memberForm.userId) {
      toast.error('Please select a member to add');
      return;
    }

    try {
      const response = await axios.post(`/projects/${selectedProject._id}/members`, { userId: memberForm.userId });
      toast.success('Member added successfully');
      
      // Update the selected project with the new data
      setSelectedProject(response.data);
      
      // Refresh project data and available members
      fetchProjects();
      const availableMembersResponse = await axios.get(`/projects/${selectedProject._id}/available-members`);
      setAvailableMembers(availableMembersResponse.data);
      setMemberForm({ userId: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
      console.error('Error adding member:', error);
    }
  };
  const removeMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      const response = await axios.delete(`/projects/${selectedProject._id}/members/${userId}`);
      toast.success('Member removed successfully');
      
      // Update the selected project with the new data
      setSelectedProject(response.data.project);
      
      // Refresh projects list and available members
      fetchProjects();
      const availableMembersResponse = await axios.get(`/projects/${selectedProject._id}/available-members`);
      setAvailableMembers(availableMembersResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
      console.error('Error removing member:', error);
    }  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <ProjectsContainer>      <PageHeader>
        <PageTitle>Projects</PageTitle>
        <PermissionGate permission="canCreateProjects">
          <AddButton onClick={() => openModal()}>
            <FiPlus size={20} />
            New Project
          </AddButton>
        </PermissionGate>      </PageHeader>

      {projects.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #ddd'
        }}>
          <h3 style={{ marginBottom: '12px', color: '#555' }}>No Projects Found</h3>
          <p style={{ marginBottom: '20px' }}>
            You don't have access to any projects yet. 
            {permissions.canCreateProjects ? ' Create your first project to get started!' : ' Contact your administrator to be added to a project.'}
          </p>
          {permissions.canCreateProjects && (
            <button 
              onClick={() => openModal()}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <FiPlus size={16} style={{ marginRight: '8px' }} />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <ProjectsGrid>
          {projects.map(project => (
          <ProjectCard key={project._id}>            <ProjectHeader color={project.color}>              <ProjectActions>
                <PermissionGate permission="canEditOwnProjects">
                  <ActionButton onClick={() => openModal(project)}>
                    <FiEdit size={16} />
                  </ActionButton>
                </PermissionGate>
                {/* All project members can view the members list */}
                <ActionButton onClick={() => openMembersModal(project)}>
                  <FiUsers size={16} />
                </ActionButton>
                <PermissionGate permission="canDeleteProjects">
                  <ActionButton 
                    className="danger" 
                    onClick={() => handleDelete(project._id)}
                  >
                    <FiTrash2 size={16} />
                  </ActionButton>
                </PermissionGate>
              </ProjectActions>
              
              <ProjectName>{project.name}</ProjectName>
              {project.description && (
                <ProjectDescription>{project.description}</ProjectDescription>
              )}
              
              <ProjectMeta>
                <MetaItem>
                  <FiUsers size={14} />
                  {project.members?.length || 0} members
                </MetaItem>
                <MetaItem>
                  <FiCalendar size={14} />
                  {new Date(project.createdAt).toLocaleDateString()}
                </MetaItem>
              </ProjectMeta>            </ProjectHeader>
          </ProjectCard>
        ))}
        </ProjectsGrid>
      )}

      {showModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Project Name *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Enter project description"
                />
              </FormGroup>

              <FormGroup>
                <Label>Color</Label>
                <ColorPicker
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                />
              </FormGroup>

              <ModalActions>
                <Button type="button" className="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}      {showMembersModal && selectedProject && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeMembersModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {permissions.canEditOwnProjects ? 'Manage Project Members' : 'Project Members'}
              </ModalTitle>
              <CloseButton onClick={closeMembersModal}>&times;</CloseButton>
            </ModalHeader>

            <div>
              <h3 style={{ marginBottom: '16px', color: '#2c3e50' }}>Current Members</h3>
              <MembersList>
                {selectedProject.members?.map((member) => (
                  <MemberItem key={member._id}>
                    <MemberInfo>
                      <MemberName>{member.user?.name || 'Unknown'}</MemberName>
                      <MemberEmail>{member.user?.email || 'Unknown'}</MemberEmail>
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '500', marginTop: '4px' }}>
                        Team Role: {member.teamRole || 'Unknown'}
                      </div>
                    </MemberInfo>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {/* Only show remove button if user has edit permissions and member is not the owner */}
                      {permissions.canEditOwnProjects && selectedProject.owner !== member.user._id && (
                        <RemoveButton onClick={() => removeMember(member.user._id)}>
                          Remove
                        </RemoveButton>
                      )}
                    </div>
                  </MemberItem>
                ))}
                {(!selectedProject.members || selectedProject.members.length === 0) && (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No members assigned to this project.</p>
                )}
              </MembersList>
            </div>

            {/* Only show add member form if user has edit permissions */}
            {permissions.canEditOwnProjects && (
              <AddMemberForm onSubmit={addMember}>
                <MemberSelect
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                  required
                  disabled={availableMembers.length === 0}
                >
                  <option value="">
                    {availableMembers.length === 0 ? 'No available team members' : 'Select a team member to add'}
                  </option>
                  {availableMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email}) - {member.teamRole}
                    </option>
                  ))}
                </MemberSelect>
                <Button type="submit" className="primary" disabled={availableMembers.length === 0}>
                  Add Member
                </Button>
              </AddMemberForm>
            )}

            {/* Show informational message for members without edit permissions */}
            {!permissions.canEditOwnProjects && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px', 
                border: '1px solid #e9ecef',
                color: '#6c757d',
                fontSize: '0.9em'
              }}>
                <strong>Note:</strong> You can view project members but don't have permission to add or remove members. Contact your project admin or team manager for member management.
              </div>
            )}
          </ModalContent>
        </Modal>
      )}
    </ProjectsContainer>
  );
};

export default Projects;
