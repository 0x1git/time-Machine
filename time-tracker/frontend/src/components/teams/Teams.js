import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus, FiUsers, FiMail, FiEdit, FiTrash2, FiUserPlus, FiX, FiClipboard } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionGate } from '../common/PermissionGate';

const TeamsContainer = styled.div`
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

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
`;

const TeamCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const TeamName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const TeamActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  &.invite {
    color: #3498db;
    
    &:hover {
      background: #eff6ff;
      color: #2563eb;
    }
  }

  &.cancel {
    color: #e74c3c;
    
    &:hover {
      background: #fef2f2;
      color: #dc2626;
    }
  }
`;

const TeamDescription = styled.p`
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const MembersSection = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const MemberDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const MemberName = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const MemberEmail = styled.span`
  color: #6b7280;
  font-size: 12px;
`;

const RoleBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  &.admin {
    background: #fef3c7;
    color: #92400e;
  }
  
  &.manager {
    background: #e0e7ff;
    color: #3730a3;
  }
  
  &.member {
    background: #f3f4f6;
    color: #374151;
  }
`;

const MemberActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  &:disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }
`;

const AssignTaskButton = styled.button`
  background: transparent;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
    color: #2563eb;
  }

  &:disabled {
    color: #d1d5db;
    cursor: not-allowed;
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
  max-height: 80vh;
  overflow-y: auto;
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
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #6b7280;

  &:hover {
    background: #f3f4f6;
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
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 14px;
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
    background: white;
    color: #6b7280;
    border: 1px solid #d1d5db;

    &:hover {
      background: #f9fafb;
    }
  }
`;

const InvitationsList = styled.div`
  margin-top: 20px;
`;

const InvitationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const InvitationInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const InvitationEmail = styled.span`
  font-weight: 500;
  color: #92400e;
`;

const InvitationRole = styled.span`
  font-size: 12px;
  color: #a16207;
`;

const Teams = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);  const [selectedTeam, setSelectedTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [canAssignTasks, setCanAssignTasks] = useState(false);

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: ''
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });  // Check if current user can remove a member from a team
  const canRemoveMember = (team, targetMember) => {
    if (!currentUser || !team) {
      return false;
    }
    
    // Team owner can remove anyone except themselves
    const ownerId = team.owner._id || team.owner;
    if (ownerId.toString() === currentUser._id.toString()) {
      const canRemove = targetMember.user._id.toString() !== currentUser._id.toString();
      return canRemove;
    }
    
    // Find current user's membership in the team
    const currentUserMember = team.members.find(m => m.user._id.toString() === currentUser._id.toString());
    
    if (!currentUserMember) {
      return false;
    }
    
    // Admin or manager with canManageTeam permission can remove non-owners
    const isOwner = ownerId.toString() === targetMember.user._id.toString();
    const isSelf = targetMember.user._id.toString() === currentUser._id.toString();
    const hasPermission = currentUserMember.role === 'admin' || currentUserMember.permissions?.canManageTeam;
    
    if (hasPermission && !isOwner && !isSelf) {
      return true;
    }
    
    return false;
  };  useEffect(() => {
    fetchTeams();
    checkAssignPermissions();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams');
      setTeams(response.data);
    } catch (error) {
      toast.error('Failed to fetch teams');
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (teamId) => {
    try {
      const response = await axios.get(`/teams/${teamId}/invitations`);
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/teams', teamForm);
      toast.success('Team created successfully');
      fetchTeams();
      setShowCreateModal(false);
      setTeamForm({ name: '', description: '' });
    } catch (error) {
      toast.error('Failed to create team');
      console.error('Error creating team:', error);
    }
  };
  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`/teams/${selectedTeam._id}/invite`, inviteForm);
      toast.success('Invitation sent successfully');
      fetchInvitations(selectedTeam._id);
      setInviteForm({ email: '', role: 'member' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
      console.error('Error sending invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await axios.delete(`/teams/${selectedTeam._id}/invitations/${invitationId}`);
      toast.success('Invitation cancelled successfully');
      fetchInvitations(selectedTeam._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleRemoveMember = async (teamId, userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      await axios.delete(`/teams/${teamId}/members/${userId}`);
      toast.success('Member removed successfully');
      fetchTeams(); // Refresh the teams list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
      console.error('Error removing member:', error);
    }
  };

  const handleAssignTask = (member) => {
    // Navigate to tasks page with assignee pre-selected
    navigate(`/tasks?assignee=${member._id}&assigneeName=${encodeURIComponent(member.name)}&action=create`);
    toast.info(`Redirecting to create a task for ${member.name}...`);
  };

  const openInviteModal = (team) => {
    setSelectedTeam(team);
    setShowInviteModal(true);
    fetchInvitations(team._id);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedTeam(null);
    setInvitations([]);
    setInviteForm({ email: '', role: 'member' });
  };

  const openEditModal = (team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTeam(null);
    setTeamForm({ name: '', description: '' });
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/teams/${selectedTeam._id}`, teamForm);
      toast.success('Team updated successfully');
      fetchTeams();
      closeEditModal();
    } catch (error) {
      toast.error('Failed to update team');
      console.error('Error updating team:', error);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  if (loading) {
    return <div>Loading teams...</div>;
  }

  return (
    <TeamsContainer>      <PageHeader>
        <PageTitle>Teams</PageTitle>
        <PermissionGate permission="canManageTeams">
          <AddButton onClick={() => setShowCreateModal(true)}>
            <FiPlus size={18} />
            Create Team
          </AddButton>
        </PermissionGate>
      </PageHeader>

      <TeamsGrid>
        {teams.map(team => (
          <TeamCard key={team._id}>
            <TeamHeader>
              <TeamName>{team.name}</TeamName>
              <TeamActions>
                <IconButton 
                  className="invite" 
                  onClick={() => openInviteModal(team)}
                  title="Invite members"
                >
                  <FiUserPlus size={16} />
                </IconButton>
                <IconButton 
                  title="Edit team"
                  onClick={() => openEditModal(team)}
                >
                  <FiEdit size={16} />
                </IconButton>
              </TeamActions>
            </TeamHeader>

            {team.description && (
              <TeamDescription>{team.description}</TeamDescription>
            )}

            <MembersSection>
              <SectionTitle>
                <FiUsers size={14} style={{ marginRight: 8 }} />
                Members ({team.members?.length || 0})
              </SectionTitle>
              <MembersList>
                {team.members?.map(member => (
                  <MemberItem key={member.user._id}>                    <MemberInfo>
                      <Avatar>
                        {getInitials(member.user.name)}
                      </Avatar>
                      <MemberDetails>
                        <MemberName>{member.user.name}</MemberName>
                        <MemberEmail>{member.user.email}</MemberEmail>
                      </MemberDetails>
                    </MemberInfo>                    <MemberActions>
                      <RoleBadge className={member.role}>
                        {member.role}
                      </RoleBadge>
                      {canAssignTasks && (
                        <AssignTaskButton
                          onClick={() => handleAssignTask(member.user)}
                          title={`Assign task to ${member.user.name}`}
                        >
                          <FiClipboard size={14} />
                        </AssignTaskButton>
                      )}
                      {canRemoveMember(team, member) && (
                        <RemoveButton
                          onClick={() => handleRemoveMember(team._id, member.user._id, member.user.name)}
                          title={`Remove ${member.user.name} from team`}
                        >
                          <FiTrash2 size={14} />
                        </RemoveButton>
                      )}
                    </MemberActions>
                  </MemberItem>
                ))}
              </MembersList>
            </MembersSection>
          </TeamCard>
        ))}
      </TeamsGrid>

      {/* Create Team Modal */}
      {showCreateModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create New Team</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleCreateTeam}>
              <FormGroup>
                <Label>Team Name</Label>
                <Input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Enter team name"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <Textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Enter team description (optional)"
                />
              </FormGroup>

              <ModalActions>
                <Button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  Create Team
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Edit Team</ModalTitle>
              <CloseButton onClick={closeEditModal}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleEditTeam}>
              <FormGroup>
                <Label>Team Name</Label>
                <Input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Enter team name"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <Textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Enter team description (optional)"
                />
              </FormGroup>

              <ModalActions>
                <Button type="button" className="secondary" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  Update Team
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && selectedTeam && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Invite Members to {selectedTeam.name}</ModalTitle>
              <CloseButton onClick={closeInviteModal}>
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleInviteMember}>
              <FormGroup>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Role</Label>
                <Select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormGroup>

              <ModalActions>
                <Button type="button" className="secondary" onClick={closeInviteModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  <FiMail size={16} style={{ marginRight: 8 }} />
                  Send Invitation
                </Button>
              </ModalActions>
            </Form>

            {invitations.length > 0 && (
              <InvitationsList>
                <SectionTitle>Pending Invitations</SectionTitle>                {invitations.map(invitation => (
                  <InvitationItem key={invitation._id}>
                    <InvitationInfo>
                      <InvitationEmail>{invitation.email}</InvitationEmail>
                      <InvitationRole>Role: {invitation.role}</InvitationRole>
                    </InvitationInfo>                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RoleBadge className="member">Pending</RoleBadge>
                      <IconButton 
                        className="cancel"
                        onClick={() => handleCancelInvitation(invitation._id)}
                        title="Cancel invitation"
                      >
                        <FiX size={16} />
                      </IconButton>
                    </div>
                  </InvitationItem>
                ))}
              </InvitationsList>
            )}
          </ModalContent>
        </Modal>
      )}
    </TeamsContainer>
  );
};

export default Teams;
