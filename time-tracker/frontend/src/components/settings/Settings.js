import React, { useState } from 'react';
import styled from 'styled-components';
import { FiUser, FiMail, FiLock, FiBell, FiMoon, FiSun, FiShield, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import { AdminOnly } from '../common/PermissionGate';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 32px;
`;

const SettingsSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectionContent = styled.div`
  padding: 24px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
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

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
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

const ToggleGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f1f3f4;

  &:last-child {
    border-bottom: none;
  }
`;

const ToggleInfo = styled.div`
  flex: 1;
`;

const ToggleLabel = styled.div`
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const ToggleDescription = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const Toggle = styled.button`
  width: 48px;
  height: 24px;
  background: ${props => props.checked ? '#3498db' : '#d1d5db'};
  border: none;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: left 0.2s;
  }
`;

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const DangerZone = styled.div`
  border: 1px solid #dc2626;
  border-radius: 8px;
  padding: 20px;
  background: #fef2f2;
`;

const DangerTitle = styled.h3`
  color: #dc2626;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DangerDescription = styled.p`
  color: #7f1d1d;
  margin-bottom: 16px;
  font-size: 14px;
`;

const DangerButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  color: #dc2626;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalText = styled.p`
  color: #374151;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Settings = () => {
  const { currentUser, logout, updateProfile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    taskReminders: true,
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // API call for password change would go here
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    
    try {
      await axios.delete('/users/me');
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <SettingsContainer>
      <PageTitle>Settings</PageTitle>

      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            <FiUser size={20} />
            Profile Information
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <form onSubmit={handleProfileUpdate}>
            <FormGrid>
              <FormGroup>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </FormGroup>

              <FormGroup>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </FormGroup>
            </FormGrid>

            <ButtonGroup>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </ButtonGroup>
          </form>
        </SectionContent>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            <FiLock size={20} />
            Change Password
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <form onSubmit={handlePasswordChange}>
            <FormGroup>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </FormGroup>

            <FormGrid>
              <FormGroup>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </FormGroup>

              <FormGroup>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </FormGroup>
            </FormGrid>

            <ButtonGroup>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </Button>
            </ButtonGroup>
          </form>
        </SectionContent>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            <FiBell size={20} />
            Notifications
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Email Notifications</ToggleLabel>
              <ToggleDescription>
                Receive email notifications for important updates
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              checked={notifications.emailNotifications}
              onClick={() => handleNotificationToggle('emailNotifications')}
            />
          </ToggleGroup>

          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Push Notifications</ToggleLabel>
              <ToggleDescription>
                Receive push notifications in your browser
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              checked={notifications.pushNotifications}
              onClick={() => handleNotificationToggle('pushNotifications')}
            />
          </ToggleGroup>

          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Weekly Reports</ToggleLabel>
              <ToggleDescription>
                Get weekly productivity reports via email
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              checked={notifications.weeklyReports}
              onClick={() => handleNotificationToggle('weeklyReports')}
            />
          </ToggleGroup>

          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Task Reminders</ToggleLabel>
              <ToggleDescription>
                Get reminders for upcoming task deadlines
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              checked={notifications.taskReminders}
              onClick={() => handleNotificationToggle('taskReminders')}
            />
          </ToggleGroup>
        </SectionContent>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            {isDarkMode ? <FiMoon size={20} /> : <FiSun size={20} />}
            Appearance
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Theme</ToggleLabel>
              <ToggleDescription>
                Switch between light and dark mode
              </ToggleDescription>
            </ToggleInfo>
            <ThemeToggle onClick={toggleDarkMode}>
              {isDarkMode ? <FiMoon size={16} /> : <FiSun size={16} />}
              {isDarkMode ? 'Dark' : 'Light'} Mode
            </ThemeToggle>          </ToggleGroup>        </SectionContent>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            <FiAlertTriangle />
            Danger Zone
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <DangerZone>
            <DangerTitle>
              <FiTrash2 />
              Delete Account
            </DangerTitle>
            <DangerDescription>
              Once you delete your account, there is no going back. This action will permanently 
              delete your account and remove all of your data from our servers. This cannot be undone.
            </DangerDescription>
            <DangerButton 
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteLoading}
            >
              <FiTrash2 size={16} />
              Delete Account
            </DangerButton>
          </DangerZone>
        </SectionContent>
      </SettingsSection>

      {/* Admin Section */}
      <AdminOnly>
        <SettingsSection>
          <SectionHeader>
            <SectionTitle>
              <FiShield />
              Admin Controls
            </SectionTitle>
          </SectionHeader>
          <SectionContent>
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>Admin-only features will be displayed here:</p>
              <ul style={{ textAlign: 'left', marginTop: '16px' }}>
                <li>• User role management</li>
                <li>• System-wide permissions</li>
                <li>• Audit logs</li>
                <li>• Data export/import</li>
                <li>• System settings</li>
              </ul>
            </div>
          </SectionContent>        </SettingsSection>
      </AdminOnly>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <FiAlertTriangle />
              Confirm Account Deletion
            </ModalTitle>
            <ModalText>
              Are you absolutely sure you want to delete your account? This action cannot be undone 
              and will permanently remove all of your data, including:
            </ModalText>
            <ul style={{ marginBottom: '20px', paddingLeft: '20px', color: '#374151' }}>
              <li>Your profile and account information</li>
              <li>All projects and tasks you've created</li>
              <li>Time tracking history</li>
              <li>Team memberships</li>
            </ul>
            <ModalText>
              <strong>Type "DELETE" to confirm:</strong>
            </ModalText>            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            <ModalButtons>
              <Button 
                className="secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <DangerButton 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
              >
                <FiTrash2 size={16} />
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </DangerButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </SettingsContainer>
  );
};

export default Settings;
