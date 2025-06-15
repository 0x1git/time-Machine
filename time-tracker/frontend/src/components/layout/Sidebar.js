import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { 
  FiHome, 
  FiClock, 
  FiFolderPlus, 
  FiCheckSquare, 
  FiBarChart, 
  FiSettings, 
  FiLogOut,
  FiX,
  FiUsers,
  FiMonitor
} from 'react-icons/fi';

const SidebarContainer = styled.aside`
  width: ${props => props.isOpen ? '260px' : '0'};
  height: 100vh;
  background: #2c3e50;
  color: white;
  transition: width 0.3s ease;
  overflow: hidden;
  position: relative;
  z-index: 1000;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    width: ${props => props.isOpen ? '260px' : '0'};
    box-shadow: ${props => props.isOpen ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'};
  }
`;

const SidebarContent = styled.div`
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #3498db;
`;

const CloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: 20px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #34495e;
    color: white;
  }

  &.active {
    background: #3498db;
    color: white;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #2980b9;
    }
  }

  svg {
    margin-right: 12px;
    font-size: 18px;
  }
`;

const SidebarFooter = styled.div`
  padding: 20px;
  border-top: 1px solid #34495e;
`;

const UserInfo = styled.div`
  margin-bottom: 16px;
`;

const UserName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 0.875rem;
  color: #bdc3c7;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: white;
  }

  svg {
    margin-right: 8px;
  }
`;

const Overlay = styled.div`
  display: ${props => props.show ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;

  @media (min-width: 769px) {
    display: none;
  }
`;

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard', show: true },
      { path: '/timer', icon: FiClock, label: 'Timer', show: true },
    ];

    const conditionalItems = [
      { 
        path: '/projects', 
        icon: FiFolderPlus, 
        label: 'Projects', 
        show: permissions.canCreateProjects() || permissions.canViewAllProjects() 
      },
      { 
        path: '/tasks', 
        icon: FiCheckSquare, 
        label: 'Tasks', 
        show: permissions.canCreateTasks() || permissions.canManageAllTasks()
      },      { 
        path: '/teams', 
        icon: FiUsers, 
        label: 'Teams', 
        show: permissions.canManageTeams() || permissions.isAdminOrManager() || permissions.canViewAllUsers()
      },
      { 
        path: '/reports', 
        icon: FiBarChart, 
        label: 'Reports', 
        show: permissions.canViewTeamReports() || permissions.canViewAllReports()
      },
      { 
        path: '/kiosk', 
        icon: FiMonitor, 
        label: 'Break Kiosk', 
        show: permissions.canAccessKiosk(),
        external: true 
      },
      { 
        path: '/settings', 
        icon: FiSettings, 
        label: 'Settings', 
        show: true
      },
    ];

    return [...baseItems, ...conditionalItems.filter(item => item.show)];
  };

  const navItems = getNavItems();

  return (
    <>
      <Overlay show={isOpen} onClick={onClose} />
      <SidebarContainer isOpen={isOpen}>
        <SidebarContent>
          <SidebarHeader>
            <Logo>TimeTracker</Logo>
            <CloseButton onClick={onClose}>
              <FiX size={24} />
            </CloseButton>
          </SidebarHeader>          <Navigation>
            {navItems.map((item) => 
              item.external ? (
                <NavItem
                  key={item.path}
                  as="a"
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => window.innerWidth <= 768 && onClose()}
                >
                  <item.icon />
                  {item.label}
                </NavItem>
              ) : (
                <NavItem
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth <= 768 && onClose()}
                >
                  <item.icon />
                  {item.label}
                </NavItem>
              )
            )}
          </Navigation>

          <SidebarFooter>
            <UserInfo>
              <UserName>{currentUser?.name}</UserName>
              <UserEmail>{currentUser?.email}</UserEmail>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>
              <FiLogOut />
              Logout
            </LogoutButton>
          </SidebarFooter>
        </SidebarContent>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
