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

const RoleSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-right: 8px;
  font-size: 0.875rem;
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

const MemberInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3498db;
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
  });
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member'
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

  // Project member management functions
  const openMembersModal = async (project) => {
    setSelectedProject(project);
    setShowMembersModal(true);
    try {
      const response = await axios.get(`/projects/${project._id}/available-members`);
      setAvailableMembers(response.data);
    } catch (error) {
      toast.error('Failed to load available members');
      console.error('Error fetching available members:', error);
    }
  };

  const closeMembersModal = () => {
    setShowMembersModal(false);
    setSelectedProject(null);
    setMemberForm({ email: '', role: 'member' });
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${selectedProject._id}/members`, memberForm);
      toast.success('Member added successfully');
      
      // Refresh project data and available members
      fetchProjects();
      const response = await axios.get(`/projects/${selectedProject._id}/available-members`);
      setAvailableMembers(response.data);
      setMemberForm({ email: '', role: 'member' });
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
      await axios.delete(`/projects/${selectedProject._id}/members/${userId}`);
      toast.success('Member removed successfully');
      fetchProjects();
      
      // Refresh available members
      const response = await axios.get(`/projects/${selectedProject._id}/available-members`);
      setAvailableMembers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
      console.error('Error removing member:', error);
    }
  };

  const updateMemberRole = async (userId, newRole) => {
    try {
      await axios.put(`/projects/${selectedProject._id}/members/${userId}/role`, { role: newRole });
      toast.success('Member role updated successfully');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update member role');
      console.error('Error updating member role:', error);
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
    <ProjectsContainer>      <PageHeader>
        <PageTitle>Projects</PageTitle>
        <PermissionGate permission="canCreateProjects">
          <AddButton onClick={() => openModal()}>
            <FiPlus size={20} />
            New Project
          </AddButton>
        </PermissionGate>
      </PageHeader>

      <ProjectsGrid>
        {projects.map(project => (
          <ProjectCard key={project._id}>            <ProjectHeader color={project.color}>
              <ProjectActions>
                <PermissionGate permission="canEditOwnProjects">
                  <ActionButton onClick={() => openModal(project)}>
                    <FiEdit size={16} />
                  </ActionButton>
                </PermissionGate>
                <PermissionGate permission="canEditOwnProjects">
                  <ActionButton onClick={() => openMembersModal(project)}>
                    <FiUsers size={16} />
                  </ActionButton>
                </PermissionGate>
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
              </ProjectMeta>
            </ProjectHeader>
          </ProjectCard>
        ))}
      </ProjectsGrid>

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
              <ModalTitle>Manage Project Members</ModalTitle>
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
                    </MemberInfo>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <RoleSelect
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.user._id, e.target.value)}
                        disabled={selectedProject.owner === member.user._id}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </RoleSelect>
                      {selectedProject.owner !== member.user._id && (
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

            <AddMemberForm onSubmit={addMember}>
              <MemberInput
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="Enter member's email"
                required
              />
              <RoleSelect
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </RoleSelect>
              <Button type="submit" className="primary">
                Add Member
              </Button>
            </AddMemberForm>
          </ModalContent>
        </Modal>
      )}
    </ProjectsContainer>
  );
};

export default Projects;
