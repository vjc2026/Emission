import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Router from 'next/router';
import { AppShell, Burger, Flex, Button, UnstyledButton, Group, Avatar, Text, Box, Paper, Loader, Menu, ActionIcon, Indicator, Modal, Anchor } from '@mantine/core';
import { IconBell, IconDashboard, IconUser, IconChartBar, IconHistory, IconLogout } from '@tabler/icons-react';
import ButtonComponent from './Components/Button';
import TextComponent from './Components/Text';
import History from './Components/history';
import TEST from './Components/TEST';
import UserSpecs from './Components/UserSpecs';
import '@mantine/core/styles.css';
import StatisticsComponent from './Components/Statistics';
import { useRouter } from 'next/router';
import CodeCalculator from './Components/CodeCalculator';

// DLSU Colors
const dlsuGreen = '#006F3C';
const dlsuLightGreen = '#008C4C';

// ProtectedRoute component to restrict access based on token
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const router = useRouter();

  const handleTest = () => {
    router.push('/Components/TEST');
};


  useEffect(() => {
    // Simulate async token check
    setTimeout(() => {
      if (!token) {
        router.push('/');  // Redirect to login if no token
      }
      setLoading(false);
    }, 1000); // Simulate delay or async operation
  }, [token, history]);

  if (loading) {
    return <Loader />;
  }

  return token ? element : null;
};

const MainContent: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [currentComponent, setCurrentComponent] = useState<string>('component1');
  const [userData, setUserData] = useState<{ name: string; organization: string; profile_image: string | null }>({ name: '', organization: '', profile_image: null });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{ id: string; message: string; sender_name: string } | null>(null);

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
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUserData();
    fetchNotifications();
  }, []);

  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  interface Notification {
    id: string;
    message: string;
    sender_name: string;
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
          // Handle successful response
        } else {
          // Handle error response
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
          // Handle successful response
        } else {
          // Handle error response
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

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        style={{
          background: dlsuGreen,
          borderBottom: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Flex justify="space-between" align="center" style={{ padding: '10px 20px', height: '100%' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened(!opened)}
            hiddenFrom="sm"
            size="sm"
            color="white"
          />
          <Flex align="center" gap="md">
            <img
              src="https://i.ibb.co/5KcMwkj/with-bg-Icon.jpg"
              alt="Website Icon"
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
            <Text size="xl" fw={700} c="white">
              Emission Sense
            </Text>
          </Flex>
          <Group>
            <Menu shadow="md" width={300}>
              <Menu.Target>
                <Indicator label={notifications.length} size={16} color="red">
                  <ActionIcon variant="transparent">
                    <IconBell size={24} color="white" />
                  </ActionIcon>
                </Indicator>
              </Menu.Target>
              <Anchor component="button" onClick={handleTest} style={{ color: 'white' }} size="sm">
              TestPage
            </Anchor>
              <Menu.Dropdown>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <Menu.Item key={index} onClick={() => handleOpenModal(notification)}>
                      <Text fw={500}>{notification.message}</Text>
                      <Text size="xs" color="dimmed">From: {notification.sender_name}</Text>
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item>No notifications</Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={userData.profile_image}
                  radius="xl"
                  size="md"
                  styles={{
                    root: {
                      border: '1px solid white',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item ta="center" onClick={() => setCurrentComponent('component2')}>Your Profile</Menu.Item>
                <Menu.Item ta="center" onClick={handleLogout}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Flex>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          background: 'white',
          borderRight: 'none',
          boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        }}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
          <Button
            leftSection={<IconDashboard size={20} />}
            variant={currentComponent === 'component1' ? 'filled' : 'light'}
            onClick={() => setCurrentComponent('component1')}
            fullWidth
            styles={{
              root: {
                backgroundColor: currentComponent === 'component1' ? dlsuGreen : undefined,
                '&:hover': {
                  backgroundColor: dlsuLightGreen,
                },
                color: currentComponent === 'component1' ? 'white' : dlsuGreen,
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            leftSection={<IconChartBar size={20} />}
            variant={currentComponent === 'component3' ? 'filled' : 'light'}
            onClick={() => setCurrentComponent('component3')}
            fullWidth
            styles={{
              root: {
                backgroundColor: currentComponent === 'component3' ? dlsuGreen : undefined,
                '&:hover': {
                  backgroundColor: dlsuLightGreen,
                },
                color: currentComponent === 'component3' ? 'white' : dlsuGreen,
              },
            }}
          >
            Statistics
          </Button>
          <Button
            leftSection={<IconHistory size={20} />}
            variant={currentComponent === 'component4' ? 'filled' : 'light'}
            onClick={() => setCurrentComponent('component4')}
            fullWidth
            styles={{
              root: {
                backgroundColor: currentComponent === 'component4' ? dlsuGreen : undefined,
                '&:hover': {
                  backgroundColor: dlsuLightGreen,
                },
                color: currentComponent === 'component4' ? 'white' : dlsuGreen,
              },
            }}
          >
            Projects Session Tracker
          </Button>
          <Button
            leftSection={<IconHistory size={20} />}
            variant={currentComponent === 'component5' ? 'filled' : 'light'}
            onClick={() => setCurrentComponent('component5')}
            fullWidth
            styles={{
              root: {
                backgroundColor: currentComponent === 'component5' ? dlsuGreen : undefined,
                '&:hover': {
                  backgroundColor: dlsuLightGreen,
                },
                color: currentComponent === 'component5' ? 'white' : dlsuGreen,
              },
            }}
          >
           Code Optimizer
          </Button>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Paper>
          {currentComponent === 'component1' && <TextComponent />}
          {currentComponent === 'component2' && <ButtonComponent />}
          {currentComponent === 'component3' && <StatisticsComponent />}
          {currentComponent === 'component4' && <History />}
          {currentComponent === 'component5' && <CodeCalculator />}
        </Paper>
      </AppShell.Main>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Project Invitation"
      >
        {selectedNotification && (
          <>
            <Text fw={500}>{selectedNotification.message}</Text>
            <Text size="xs" color="dimmed">From: {selectedNotification.sender_name}</Text>
            <Group align="apart" mt="md">
              <Button color="green" onClick={handleAccept}>Accept</Button>
              <Button color="red" onClick={handleIgnore}>Ignore</Button>
            </Group>
          </>
        )}
      </Modal>
    </AppShell>
  );
};

const App: React.FC = () => {
  
 
  return (
    <Routes>
      <Route path="/main" element={<ProtectedRoute element={<MainContent />} />} />
      <Route path="/history" element={<ProtectedRoute element={<History />} />} />
      <Route path="/test" element={<ProtectedRoute element={<TEST />} />} />
      <Route path="/user-specs" element={<ProtectedRoute element={<UserSpecs />} />} />
      <Route path="/code-calculator" element={<ProtectedRoute element={<CodeCalculator />} />} />
    </Routes>
  );
};

export default App;