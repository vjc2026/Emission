import React, { useState } from 'react';
import { Container, TextInput, Button, Title, Text } from '@mantine/core';

const ForgotPasswordWithEmail: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSendResetEmail = async () => {
        try {
            const response = await fetch('http://localhost:5000/send-reset-email', {
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
        <Container size={420} my={40}>
            <Title ta="center">Forgot your password?</Title>
            <Text size="sm" ta="center" mt={5}>
                Enter your email to receive a password reset link.
            </Text>

            <TextInput
                label="Email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: '1rem' }}
            />

            {error && <Text color="red" size="sm" ta="center">{error}</Text>}
            {message && <Text color="green" size="sm" ta="center">{message}</Text>}

            <Button onClick={handleSendResetEmail} fullWidth mt="md">
                Send Reset Email
            </Button>
        </Container>
    );
};

export default ForgotPasswordWithEmail;
