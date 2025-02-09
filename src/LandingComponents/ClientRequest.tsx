import React, { useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Container,
  Title,
  Group,
  Paper,
} from '@mantine/core';
import classes from './ClientRequest.module.css';

const ClientRequest: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here (e.g., send data to an API)
    console.log({
      fullName,
      contactNumber,
      email,
      projectTitle,
      projectDescription,
    });
    // Reset form fields after submission
    setFullName('');
    setContactNumber('');
    setEmail('');
    setProjectTitle('');
    setProjectDescription('');
  };

  return (
    <Container size="md" className={classes.container}>
      <Paper p="md" radius="md">
        <Title ta="center" mb="md" className={classes.title}>
          Request a Project
        </Title>
        <form onSubmit={handleSubmit} className={classes.form}>
          <TextInput
            label="Full Name"
            placeholder="Your Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={classes.input}
          />
          <TextInput
            label="Contact Number"
            placeholder="Your Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
            className={classes.input}
          />
          <TextInput
            label="Email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            className={classes.input}
          />
          <TextInput
            label="Project Title"
            placeholder="Project Title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
            className={classes.input}
          />
          <Textarea
            label="Project Description"
            placeholder="Describe your project"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            required
            minRows={3}
            className={classes.input}
          />
          <Group align="right" mt="md" className={classes.buttonGroup}>
            <Button type="submit" color="blue" className={classes.submitButton}>
              Submit Request
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default ClientRequest;
