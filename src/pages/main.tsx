import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  IconBell,
  IconDashboard,
  IconUser,
  IconChartBar,
  IconHistory,
  IconLogout,
  Icon3dCubeSphereOff,
  Icon3dCubeSphere,
  IconEngine,
  IconAccessPoint,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconCheck,
} from '@tabler/icons-react';
import {
  Flex, Button, Group, Avatar, Text, Box, Paper, Loader, Menu, ActionIcon, Indicator, Modal, UnstyledButton
} from '@mantine/core';
import ButtonComponent from './Components/Profile';
import TextComponent from './Components/Text';
import History from './Components/CarbonCalculator';
import Dashboard from './Components/Dashboard';
import Compare from './Components/Compare';
import TEST from './Components/TEST';
import ProjectAnalytics from './Components/ProjectAnalytics';
import '@mantine/core/styles.css';
import StatisticsComponent from './Components/Statistics';
import CodeCalculator from './Components/CodeCalculator';
import styles from './Components/Main.module.css';

// DLSU Colors
const dlsuGreen = '#006F3C';
const dlsuLightGreen = '#008C4C';

const primaryData = [
  { link: '/main', label: 'All Projects', icon: IconDashboard },
  { link: '/main', label: 'Joined Projects', icon: IconAccessPoint },
];

const secondaryData = [
  { link: '/main', label: 'Dashboard', icon: IconBell },
  { link: '/main', label: 'Statistics', icon: IconChartBar },
  { link: '/main', label: 'Projects Session Tracker', icon: IconHistory },
  { link: '/main', label: 'Code Optimizer', icon: Icon3dCubeSphere },
  { link: '/main', label: 'Compare Devices', icon: IconAccessPoint },
];

const MainContent: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [currentComponent, setCurrentComponent] = useState<string>('component1');
  const [userData, setUserData] = useState<{ name: string; organization: string; profile_image: string | null }>({ name: '', organization: '', profile_image: null });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: string;
    message: string;
    sender_name: string;
    project_name: string;
    organization: string;
    project_description: string;
    stage: string;
    sender_email: string;
    created_at: string;
  } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSecondaryMinimized, setIsSecondaryMinimized] = useState(false);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const router = useRouter();
  const [active, setActive] = useState(router.pathname);

  // Add filtering for unread notifications
  const unreadNotifications = notifications.filter(
    (notification) =>
      notification.status !== 'read' && notification.status !== 'Marked as read'
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.user.name,
            organization: data.user.organization,
            profile_image: data.user.profile_image || 'https://i.pinimg.com/originals/2e/dd/02/2edd02160b51797f7adb807a79d96d36.jpg', // Fallback image
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          // Update notification badge count
          setNewNotificationCount(prev => data.notifications.length > prev ? 
            data.notifications.length - prev : 
            0
          );
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchUserData();
    fetchNotifications();

    // Set up polling for notifications
    const notificationPollInterval = setInterval(() => {
      fetchNotifications();
    }, 5000); // Check every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(notificationPollInterval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  interface Notification {
    id: string;
    message: string;
    sender_name: string;
    project_name: string;
    organization: string;
    project_description: string;
    stage: string;
    sender_email: string;
    created_at: string;
  }

  const handleOpenModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalOpened(true);
  };

  const handleAccept = async () => {
    if (selectedNotification) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/invitations/${selectedNotification.id}/respond`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ response: 'accepted' }),
        });

        if (response.ok) {
          // ...existing success handling...
        } else {
          // ...existing error handling...
        }
      } catch (error) {
        console.error('Error responding to invitation:', error);
      }
    }
    setModalOpened(false);
  };

  const handleIgnore = async () => {
    if (selectedNotification) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/invitations/${selectedNotification.id}/respond`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ response: 'rejected' }),
        });

        if (response.ok) {
          // ...existing success handling...
        } else {
          // ...existing error handling...
        }
      } catch (error) {
        console.error('Error responding to invitation:', error);
      }
    }
    setModalOpened(false);
  };

  const handleRead = async () => {
    if (selectedNotification) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/invitations/${selectedNotification.id}/respond`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ response: 'Marked as read' }),
        });

        if (response.ok) {
          // ...existing success handling...
        } else {
          // ...existing error handling...
        }
      } catch (error) {
        console.error('Error responding to invitation:', error);
      }
    }
    setModalOpened(false);
  };

  const handleTest = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    event.preventDefault();
    router.push('/Components/TEST');
  };

  const toggleNavbar = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleSecondaryNavbar = () => {
    setIsSecondaryMinimized(!isSecondaryMinimized);
  };

  //First NavBar
  const primaryLinks = primaryData.map((item) => (
    <Link href={item.link} key={item.label}>
      <div
        className={`${styles.link} ${isMinimized ? styles.minimizedLink : ''}`}
        data-active={router.pathname === item.link || undefined}
        onClick={() => {
          setActive(item.link);
          switch (item.label) {
            case 'All Projects':
              setCurrentComponent('component1');
              break;
            case 'My Profile':
              setCurrentComponent('component2');
              break;
            case 'Joined Projects':
              setCurrentComponent('component3');
              break;
            default:
              setCurrentComponent('component1');
              break;
          }
        }}
      >
        <item.icon className={styles.linkIcon} stroke={1.5} />
        {!isMinimized && <span>{item.label}</span>}
      </div>
    </Link>
  ));

  const secondaryLinks = secondaryData.map((item) => (
    <Link href={item.link} key={item.label}>
      <div
        className={`${styles.link} ${isSecondaryMinimized ? styles.minimizedLink : ''}`}
        data-active={router.pathname === item.link || undefined}
        onClick={() => {
          setActive(item.link);
          switch (item.label) {
            case 'Dashboard':
              setCurrentComponent('component1');
              break;
            case 'Statistics':
              setCurrentComponent('component3');
              break;
            case 'Team Projects':
              setCurrentComponent('component8');
              break;
            case 'Projects Session Tracker':
              setCurrentComponent('component5');
              break;
            case 'Code Optimizer':
              setCurrentComponent('component6');
              break;
            case 'Compare Devices':
              setCurrentComponent('component7');
              break;
            default:
              setCurrentComponent('component4');
              break;
          }
        }}
      >
        <item.icon className={styles.linkIcon} stroke={1.5} />
        {!isSecondaryMinimized && <span>{item.label}</span>}
      </div>
    </Link>
  ));

  return (
    <>
      {/* New Header */}
      <header style={{
        background: `linear-gradient(135deg, ${dlsuGreen} 0%, ${dlsuLightGreen} 100%)`,
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px'
        }}>
          <div style={{
            padding: '2px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="https://i.ibb.co/5KcMwkj/with-bg-Icon.jpg"
              alt="Website Icon"
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
          <Text 
            size="xl" 
            fw={700} 
            style={{ 
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Emission Sense
          </Text>
        </div>
        <Group align="center" gap="md">
          <Menu shadow="md" width={350} position="bottom-end">
            <Menu.Target>
              <Indicator 
                label={unreadNotifications.length} 
                size={16} 
                color="red" 
                processing
                withBorder
              >
                <ActionIcon 
                  variant="light" 
                  radius="xl"
                  size="lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <IconBell size={24} color="white" />
                </ActionIcon>
              </Indicator>
            </Menu.Target>
            <Menu.Dropdown>
              <Box p="xs">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="sm">Notifications</Text>
                  {unreadNotifications.length > 0 && (
                    <Text size="xs" c="dimmed">{unreadNotifications.length} unread</Text>
                  )}
                </Group>
              </Box>
              <Menu.Divider />
              <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification, index) => (
                    <Menu.Item 
                      key={index} 
                      onClick={() => handleOpenModal(notification)}
                      py="md"
                    >
                      <Box>
                        <Group justify="space-between" mb={4}>
                          <Group gap={8}>
                            <Box
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#FF6B6B',
                                marginTop: 6
                              }}
                            />
                            <Text fw={600} size="sm">
                              {notification.sender_name}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </Text>
                        </Group>
                        <Text size="sm" lineClamp={2} mb={4}>
                          {notification.message}
                        </Text>
                        <Group gap={8}>
                          <IconDashboard size={14} color="gray" />
                          <Text size="xs" c="dimmed">{notification.project_name}</Text>
                        </Group>
                      </Box>
                    </Menu.Item>
                  ))
                ) : (
                  <Box py="lg" px="md">
                    <Text ta="center" c="dimmed" size="sm">
                      No new notifications
                    </Text>
                  </Box>
                )}
              </Box>
              {unreadNotifications.length > 0 && (
                <>
                  <Menu.Divider />
                  <Menu.Item 
                    component="button" 
                    onClick={handleRead}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      color: dlsuGreen
                    }}
                  >
                    Mark all as read
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar
                    src={userData.profile_image}
                    radius="xl"
                    size="md"
                    styles={{
                      root: {
                        border: '2px solid rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          border: '2px solid white'
                        },
                      },
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}>
                    <Text size="sm" fw={500} c="white" style={{ lineHeight: 1 }}>
                      {userData.name}
                    </Text>
                    <Text size="xs" c="rgba(255, 255, 255, 0.7)" style={{ lineHeight: 1 }}>
                      {userData.organization}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item ta="center" onClick={() => setCurrentComponent('component2')}>Your Profile</Menu.Item>
              <Menu.Item ta="center" onClick={handleLogout}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </header>

      {/* Container for Sidebar and Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
        <nav className={`${styles.navbar} ${isMinimized ? styles.minimized : ''}`}>
          <button className={styles.toggleButton} onClick={toggleNavbar}>
            {isMinimized ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
          <div className={styles.navbarMain}>
            {primaryLinks}
          </div>
          <div className={styles.footer}>
            <div className={styles.link} onClick={handleLogout}>
              <IconLogout className={styles.linkIcon} stroke={1.5} />
              {!isMinimized && <span>Logout</span>}
            </div>
          </div>
        </nav>

        <nav className={`${styles.navbar} ${isSecondaryMinimized ? styles.minimized : ''}`}>
          <button className={styles.toggleButton} onClick={toggleSecondaryNavbar}>
            {isSecondaryMinimized ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
          <div className={styles.navbarMain}>
            {secondaryLinks}
          </div>
        </nav>

        <main style={{ flex: 1, padding: '20px', overflowY: 'auto', height: 'calc(100vh - 70px)' }}>
          <Paper>
            {currentComponent === 'component1' && <TextComponent />}
            {currentComponent === 'component2' && <ButtonComponent />}
            {currentComponent === 'component3' && <StatisticsComponent />}
            {currentComponent === 'component4' && <Dashboard />}
            {currentComponent === 'component5' && <History />}
            {currentComponent === 'component6' && <CodeCalculator />}
            {currentComponent === 'component7' && <Compare />}
            {currentComponent === 'component8' && <TextComponent />}
            {currentComponent === 'component9' && <Dashboard />}
          </Paper>
        </main>
      </div>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Text size="lg" fw={600}>
            Project Invitation
          </Text>
        }
        size="lg"
        styles={{
          header: {
            backgroundColor: dlsuGreen,
            color: 'white',
            padding: '16px'
          },
          title: {
            color: 'white'
          }
        }}
      >
        {selectedNotification && (
          <Box>
            <Text fw={500} mb="md" size="lg">{selectedNotification.message}</Text>
            
            <Paper withBorder p="md" mb="md" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Group mb="xs">
                <IconDashboard size={20} color={dlsuGreen} />
                <Text fw={600} size="lg">Project Details</Text>
              </Group>
              <Box pl={28}>
                <Text mb={8}><b>Name:</b> {selectedNotification.project_name}</Text>
                <Text mb={8}><b>Organization:</b> {selectedNotification.organization}</Text>
                <Text mb={8}><b>Description:</b> {selectedNotification.project_description}</Text>
                <Text><b>Current Stage:</b> {selectedNotification.stage}</Text>
              </Box>
            </Paper>

            <Paper withBorder p="md" mb="md" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Group mb="xs">
                <IconUser size={20} color={dlsuGreen} />
                <Text fw={600} size="lg">Invitation Details</Text>
              </Group>
              <Box pl={28}>
                <Text mb={8}><b>From:</b> {selectedNotification.sender_name}</Text>
                <Text mb={8}><b>Email:</b> {selectedNotification.sender_email}</Text>
                <Text><b>Sent:</b> {new Date(selectedNotification.created_at).toLocaleString()}</Text>
              </Box>
            </Paper>

            <Group justify="flex-end" mt="xl" gap="md">
              <Button 
                variant="outline" 
                color="yellow" 
                leftSection={<IconBell size={16} />}
                onClick={handleRead}
              >
                Mark as Read
              </Button>
              <Button 
                variant="outline"
                color="red" 
                leftSection={<IconX size={16} />}
                onClick={handleIgnore}
              >
                Ignore
              </Button>
              <Button 
                color="green" 
                leftSection={<IconCheck size={16} />}
                onClick={handleAccept}
              >
                Accept
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </>
  );
};

const App: React.FC = () => {
  // ...existing token and redirect logic...
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (!storedToken) {
      router.push('/');
    }
  }, []);

  return token ? <MainContent /> : null;
};

export default App;