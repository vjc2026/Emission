import {
    TextInput,
    PasswordInput,
    Button,
    Title,
    Text,
    Anchor,
    Group,
    Container,
    Modal,
  } from '@mantine/core';
  import React, { useState, useEffect } from 'react';
  import { useRouter } from 'next/router';
  import classes from './Login.module.css';
  
  const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const [adminModalOpened, setAdminModalOpened] = useState(false);
    const router = useRouter();
  
    const handleLogin = async () => {
      try {
        const response = await fetch('https://emission-mah2.onrender.com/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: username,
            password: password,
          }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          localStorage.setItem('token', result.token);
          router.push('/main');
        } else {
          setError(result.error || 'Login failed');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('An error occurred. Please try again later.');
      }
    };
  
    const handleAdminLogin = async () => {
      try {
        const response = await fetch('https://emission-mah2.onrender.com/admin_login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: adminUsername,
            password: adminPassword,
          }),
        });
  
        if (!response.ok) {
          const result = await response.json();
          setAdminError(result.error || 'Admin login failed');
          return;
        }
  
        const result = await response.json();
        localStorage.setItem('token', result.token);
        router.push('/AdminPages/AdminDashboard');
      } catch (error) {
        console.error('Error:', error);
        setAdminError('An error occurred. Please try again later.');
      }
    };
  
    const handleRegister = () => {
      router.push('/Register');
    };
  
    const handleForgotPassword = () => {
      router.push('/ForgotPasswordPage');
    };
  
    const handleAdminPage = () => {
      setAdminModalOpened(true);
    };
  
    const refreshToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
  
        const response = await fetch('https://emission-mah2.onrender.com/refresh-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };
  
    useEffect(() => {
      const refreshInterval = setInterval(refreshToken, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(refreshInterval);
    }, []);
  
    return (
      <div className={classes.container}>
        <div className={classes.left}>
          <Container size={420} my={40}>
            <Title ta="center" className={classes.title} style={{ color: 'white' }}>
              Welcome back!
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
              Do not have an account yet?{' '}
              <Anchor size="sm" component="button" style={{ color: 'green' }} onClick={handleRegister}>
                Create account
              </Anchor>
            </Text>
  
            <TextInput
              style={{ color: 'white' }}
              label="Email"
              placeholder="Enter your email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PasswordInput
              style={{ color: 'white' }}
              label="Password"
              placeholder="Enter your password"
              required
              mt="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Group justify="space-between" mt="lg">
              <Anchor component="button" onClick={handleAdminPage} style={{ color: 'green' }} size="sm">
                Admin Page
              </Anchor>
              <Anchor component="button" onClick={handleForgotPassword} style={{ color: 'green' }} size="sm">
                Forgot password?
              </Anchor>
            </Group>
            {error && <Text c="red" size="sm" ta="center" mt="md">{error}</Text>}
            <Button fullWidth mt="xl" color="green" onClick={handleLogin}>
              Sign in
            </Button>
          </Container>
        </div>
  
        <div className={classes.right}></div>
  
        <Modal
          opened={adminModalOpened}
          onClose={() => setAdminModalOpened(false)}
          title="Admin Login"
        >
          <TextInput
            label="Admin Email"
            placeholder="Enter your admin email"
            required
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
          <PasswordInput
            label="Admin Password"
            placeholder="Enter your admin password"
            required
            mt="md"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          {adminError && <Text c="red" size="sm" ta="center" mt="md">{adminError}</Text>}
          <Button fullWidth mt="xl" color="green" onClick={handleAdminLogin}>
            Admin Sign in
          </Button>
        </Modal>
      </div>
    );
  };
  
  export default LoginPage;