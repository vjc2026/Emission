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
} from '@tabler/icons-react';
import {
  Flex, Button, Group, Avatar, Text, Box, Paper, Loader, Menu, ActionIcon, Indicator, Modal, UnstyledButton
} from '@mantine/core';
import ButtonComponent from './Components/Button';
import TextComponent from './Components/Text';
import History from './Components/history';
import Dashboard from './Components/Dashboard';
import Compare from './Components/Compare';
import TEST from './Components/TEST';
import UserSpecs from './Components/UserSpecs';
import '@mantine/core/styles.css';
import StatisticsComponent from './Components/Statistics';
import CodeCalculator from './Components/CodeCalculator';
import styles from './Components/Main.module.css';

// DLSU Colors
const dlsuGreen = '#006F3C';
const dlsuLightGreen = '#008C4C';

const data = [
  { link: '/main', label: 'Dashboard', icon: IconBell },
  { link: '/main', label: 'Statistics', icon: IconChartBar },
  { link: '/main', label: 'Team Projects', icon: IconDashboard },
  { link: '/main', label: 'Projects Session Tracker', icon: IconHistory },
  { link: '/main', label: 'Code Optimizer', icon: Icon3dCubeSphere },
  { link: '/main', label: 'Compare Devices', icon: IconAccessPoint },
];

const MainContent: React.FC = () => {
  // ...existing state declarations...
  const [opened, setOpened] = useState(false);
  const [currentComponent, setCurrentComponent] = useState<string>('component1');
  const [userData, setUserData] = useState<{ name: string; organization: string; profile_image: string | null }>({ name: '', organization: '', profile_image: null });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{ id: string; message: string; sender_name: string } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const router = useRouter();
  const [active, setActive] = useState(router.pathname);

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

  const handleTest = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    event.preventDefault();
    router.push('/Components/TEST');
  };

  const toggleNavbar = () => {
    setIsMinimized(!isMinimized);
  };

  const links = data.map((item) => (
    <Link href={item.link} key={item.label}>
      <div
        className={`${styles.link} ${isMinimized ? styles.minimizedLink : ''}`}
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
              setCurrentComponent('component4');
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

  return (
    <>
      {/* New Header */}
      <header style={{
        background: dlsuGreen,
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src="https://i.ibb.co/5KcMwkj/with-bg-Icon.jpg"
            alt="Website Icon"
            style={{ width: '50px', height: '50px', borderRadius: '50%' }}
          />
          <Text size="xl" fw={700} style={{ color: 'white' }}>
            Emission Sense
          </Text>
        </div>
        <Group align="md">
          <Menu shadow="md" width={300}>
            <Menu.Target>
              <Indicator label={notifications.length} size={16} color="red">
                <ActionIcon variant="transparent">
                  <IconBell size={24} color="white" />
                </ActionIcon>
              </Indicator>
            </Menu.Target>
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
                    '&:hover': { transform: 'scale(1.05)' },
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
      </header>

      {/* Container for Sidebar and Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
        <nav className={`${styles.navbar} ${isMinimized ? styles.minimized : ''}`}>
          <button className={styles.toggleButton} onClick={toggleNavbar}>
            {isMinimized ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
          <div className={styles.navbarMain}>
            {links}
          </div>
          <div className={styles.footer}>
            <div className={styles.link} onClick={handleLogout}>
              <IconLogout className={styles.linkIcon} stroke={1.5} />
              {!isMinimized && <span>Logout</span>}
            </div>
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
          </Paper>
        </main>
      </div>

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