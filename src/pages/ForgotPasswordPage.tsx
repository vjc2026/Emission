import React, { useState } from 'react';
import { Container, TextInput, Button, Title, Text, Paper } from '@mantine/core';
import styles from './ForgotPassword.module.css';

const ForgotPasswordWithEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendResetEmail = async () => {
    try {
      const response = await fetch('https://emission-mah2.onrender.com/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Password reset email sent successfully.');
        setError('');
      } else {
        setError(result.error || 'Failed to send password reset email.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Container className={styles.container}>
      <Paper shadow="md" p={30} radius="md" style={{ backgroundColor: '#f8f9fa' }}>
        <Title 
          ta="center" 
          style={{ 
            color: '#006241', // DLSUD Green
            marginBottom: '1rem',
            fontSize: '1.8rem',
            fontWeight: 600
          }}
        >
          Forgot your password?
        </Title>
        <Text size="sm" ta="center" mb={20} style={{ color: '#4a4a4a' }}>
          Enter your email to receive a password reset link.
        </Text>

        <TextInput
          label="Email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          styles={{
            label: { color: '#006241', fontWeight: 500 },
            input: {
              '&:focus': {
                borderColor: '#006241'
              }
            }
          }}
        />

        {error && <Text color="red" size="sm" ta="center" mt={10}>{error}</Text>}
        {message && <Text color="#006241" size="sm" ta="center" mt={10}>{message}</Text>}

        <Button 
          onClick={handleSendResetEmail} 
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
          Send Reset Email
        </Button>
      </Paper>
    </Container>
  );
};

export default ForgotPasswordWithEmail;