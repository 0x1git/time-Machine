import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FiUser,
  FiMail,
  FiLock,
  FiBell,
  FiMoon,
  FiSun,
  FiShield,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePermissions } from "../../hooks/usePermissions";
import { AdminOnly } from "../common/PermissionGate";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  background: ${(props) => (props.checked ? "#3498db" : "#d1d5db")};
  border: none;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${(props) => (props.checked ? "26px" : "2px")};
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

const OTPModal = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const OTPTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
`;

const OTPDescription = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const OTPInput = styled.input`
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 24px;
  text-align: center;
  letter-spacing: 8px;
  font-family: "Courier New", monospace;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &.error {
    border-color: #e74c3c;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 1rem;
  text-align: center;
`;

const OTPButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 1rem;
`;

const Settings = () => {
  const { currentUser, logout, updateProfile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showPasswordOTP, setShowPasswordOTP] = useState(false);
  const [show2FAOTP, setShow2FAOTP] = useState(false);
  const [twoFAAction, setTwoFAAction] = useState(""); // "enable" or "disable"
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    taskReminders: true,
  });

  // Fetch 2FA status on component mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await axios.get("/auth/2fa-status");
        setIs2FAEnabled(response.data.is2FAEnabled);
      } catch (error) {
        console.error("Failed to fetch 2FA status:", error);
      }
    };

    fetch2FAStatus();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Send OTP for password change verification
      await axios.post("/otp/send-login", {
        email: currentUser.email,
      });

      setShowPasswordOTP(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordOTPSubmit = async (enteredOtp) => {
    setLoading(true);
    try {
      // Step 2: Change password with OTP verification
      const response = await axios.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        otp: enteredOtp,
      });

      if (response.data.success) {
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordOTP(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordOTPCancel = () => {
    setShowPasswordOTP(false);
    setOtpValue("");
    setOtpError("");
    setLoading(false);
  };

  const handle2FAToggle = async () => {
    if (is2FAEnabled) {
      // Disable 2FA - require OTP verification
      setTwoFAAction("disable");
      try {
        await axios.post("/otp/send-login", { email: currentUser.email });
        setShow2FAOTP(true);
        toast.success("Verification code sent to your email");
      } catch (error) {
        toast.error("Failed to send verification code");
      }
    } else {
      // Enable 2FA - direct enable
      setLoading(true);
      try {
        const response = await axios.post("/auth/enable-2fa");
        setIs2FAEnabled(true);
        toast.success("Two-factor authentication enabled successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to enable 2FA");
      } finally {
        setLoading(false);
      }
    }
  };

  const handle2FAOTPSubmit = async (enteredOtp) => {
    setLoading(true);
    try {
      if (twoFAAction === "disable") {
        const response = await axios.post("/auth/disable-2fa", {
          otp: enteredOtp,
        });
        setIs2FAEnabled(false);
        toast.success("Two-factor authentication disabled successfully");
      }
      setShow2FAOTP(false);
      setOtpValue("");
      setOtpError("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update 2FA settings");
    } finally {
      setLoading(false);
    }
  };

  const handle2FAOTPCancel = () => {
    setShow2FAOTP(false);
    setOtpValue("");
    setOtpError("");
    setTwoFAAction("");
    setLoading(false);
  };
  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      await axios.delete("/users/me");
      toast.success("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmation("");
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 6) {
      setOtpValue(value);
      setOtpError("");
    }
  };
  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (otpValue.length !== 6) {
      setOtpError("Please enter a 6-digit code");
      return;
    }

    if (show2FAOTP) {
      await handle2FAOTPSubmit(otpValue);
    } else {
      await handlePasswordOTPSubmit(otpValue);
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
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter your full name"
                />
              </FormGroup>

              <FormGroup>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Enter your email"
                />
              </FormGroup>
            </FormGrid>

            <ButtonGroup>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
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
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter current password"
              />
            </FormGroup>

            <FormGrid>
              <FormGroup>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                />
              </FormGroup>

              <FormGroup>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                />
              </FormGroup>
            </FormGrid>            <ButtonGroup>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </ButtonGroup>
          </form>
        </SectionContent>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader>
          <SectionTitle>
            <FiShield size={20} />
            Two-Factor Authentication
          </SectionTitle>
        </SectionHeader>
        <SectionContent>
          <ToggleGroup>
            <ToggleInfo>
              <ToggleLabel>Two-Factor Authentication</ToggleLabel>
              <ToggleDescription>
                {is2FAEnabled 
                  ? "Secure your account with an additional verification step during login"
                  : "Add an extra layer of security to your account by enabling two-factor authentication"
                }
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              checked={is2FAEnabled}
              onClick={handle2FAToggle}
              disabled={loading}
            />
          </ToggleGroup>
          {is2FAEnabled && (
            <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f0f9ff", borderRadius: "8px", border: "1px solid #0ea5e9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <FiShield size={16} color="#0ea5e9" />
                <span style={{ fontWeight: "500", color: "#0369a1" }}>2FA Active</span>
              </div>
              <p style={{ fontSize: "14px", color: "#0369a1", margin: 0 }}>
                Your account is protected with two-factor authentication. You'll be asked for a verification code when signing in.
              </p>
            </div>
          )}
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
              onClick={() => handleNotificationToggle("emailNotifications")}
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
              onClick={() => handleNotificationToggle("pushNotifications")}
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
              onClick={() => handleNotificationToggle("weeklyReports")}
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
              onClick={() => handleNotificationToggle("taskReminders")}
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
              {isDarkMode ? "Dark" : "Light"} Mode
            </ThemeToggle>{" "}
          </ToggleGroup>{" "}
        </SectionContent>
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
              Once you delete your account, there is no going back. This action
              will permanently delete your account and remove all of your data
              from our servers. This cannot be undone.
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
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              <p>Admin-only features will be displayed here:</p>
              <ul style={{ textAlign: "left", marginTop: "16px" }}>
                <li>• User role management</li>
                <li>• System-wide permissions</li>
                <li>• Audit logs</li>
                <li>• Data export/import</li>
                <li>• System settings</li>
              </ul>
            </div>
          </SectionContent>{" "}
        </SettingsSection>
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
              Are you absolutely sure you want to delete your account? This
              action cannot be undone and will permanently remove all of your
              data, including:
            </ModalText>
            <ul
              style={{
                marginBottom: "20px",
                paddingLeft: "20px",
                color: "#374151",
              }}
            >
              <li>Your profile and account information</li>
              <li>All projects and tasks you've created</li>
              <li>Time tracking history</li>
              <li>Team memberships</li>
            </ul>
            <ModalText>
              <strong>Type "DELETE" to confirm:</strong>
            </ModalText>{" "}
            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              style={{ marginBottom: "20px" }}
            />
            <ModalButtons>
              <Button
                className="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <DangerButton
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || deleteLoading}
              >
                <FiTrash2 size={16} />
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </DangerButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {/* Password Change OTP Modal */}
      {showPasswordOTP && (
        <Modal onClick={handlePasswordOTPCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <OTPModal>
              <OTPTitle>Verify Password Change</OTPTitle>
              <OTPDescription>
                We've sent a verification code to {currentUser?.email}. Please
                enter it below to confirm your password change.
              </OTPDescription>
              <form onSubmit={handleOTPSubmit}>
                <OTPInput
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpValue}
                  onChange={handleOTPChange}
                  className={otpError ? "error" : ""}
                  maxLength="6"
                />
                {otpError && <ErrorMessage>{otpError}</ErrorMessage>}
                <OTPButtons>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={handlePasswordOTPCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="primary"
                    disabled={otpValue.length !== 6 || loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </OTPButtons>
              </form>
            </OTPModal>          </ModalContent>
        </Modal>
      )}

      {/* 2FA OTP Modal */}
      {show2FAOTP && (
        <Modal onClick={handle2FAOTPCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <OTPModal>
              <OTPTitle>
                {twoFAAction === "disable" ? "Disable" : "Enable"} Two-Factor Authentication
              </OTPTitle>
              <OTPDescription>
                {twoFAAction === "disable" 
                  ? "We've sent a verification code to your email. Please enter it below to disable 2FA."
                  : "We've sent a verification code to your email. Please enter it below to enable 2FA."
                }
              </OTPDescription>
              <form onSubmit={handleOTPSubmit}>
                <OTPInput
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpValue}
                  onChange={handleOTPChange}
                  className={otpError ? "error" : ""}
                  maxLength="6"
                />
                {otpError && <ErrorMessage>{otpError}</ErrorMessage>}
                <OTPButtons>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={handle2FAOTPCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="primary"
                    disabled={otpValue.length !== 6 || loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </OTPButtons>
              </form>
            </OTPModal>
          </ModalContent>
        </Modal>
      )}
    </SettingsContainer>
  );
};

export default Settings;
