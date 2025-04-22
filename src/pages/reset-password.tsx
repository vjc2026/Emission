import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, TextInput, Button, Title, Text, Paper } from '@mantine/core';
import classes from './reset-password.module.css';
import { useRouter } from 'next/router';

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  

  const handleResetPassword = async () => {
    
  // const router = useRouter();
  
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://emission-mah2.onrender.com/resetpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setError('');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error);
        setMessage('');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setMessage('');
    }
  };

  return (
    <Container className={classes.container}>
      <Paper shadow="md" p={30} radius="lg" style={{ backgroundColor: '#f8f9fa', width:'20%' }}>
        <Title 
          ta="center" 
          style={{ 
            color: '#006241', // DLSUD Green
            marginBottom: '1rem',
            fontSize: '1.8rem',
            fontWeight: 600
          }}
        >
          Reset Password
        </Title>
        <Text size="sm" ta="center" mb={20} style={{ color: '#4a4a4a' }}>
          Enter your new password below.
        </Text>

        <TextInput
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.currentTarget.value)}
          required
          styles={{
            label: { color: '#006241', fontWeight: 500 },
            input: {
              '&:focus': {
                borderColor: '#006241'
              }
            }
          }}
          mb="md"
        />
        <TextInput
          label="Confirm Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          required
          styles={{
            label: { color: '#006241', fontWeight: 500 },
            input: {
              '&:focus': {
                borderColor: '#006241'
              }
            }
          }}
          mb="md"
        />

        {error && <Text color="red" size="sm" ta="center" mt={10}>{error}</Text>}
        {message && <Text color="#006241" size="sm" ta="center" mt={10}>{message}</Text>}

        <Button 
          onClick={handleResetPassword} 
          fullWidth 
          mt="xl"
          styles={{
            root: {
              backgroundColor: '#006241',
              '&:hover': {
                backgroundColor: '#004830'
              }
            }
          }}
        >
          Reset Password
        </Button>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
