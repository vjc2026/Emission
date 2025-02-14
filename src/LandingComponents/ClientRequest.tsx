import React, { useState, useRef } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Container,
  Title,
  Text,
  Paper,
  Group,
  Box,
} from '@mantine/core';
import { motion, useInView } from 'framer-motion';
import { IconSend } from '@tabler/icons-react';
import classes from './ClientRequest.module.css';

const ClientRequest: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const formRef = useRef(null);
  const isInView = useInView(formRef, { once: true });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
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
    <Box className={classes.wrapper}>
      <Container size="xl" py={100} className={classes.container}>
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <Title 
            ta="center" 
            mb="xl"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #9fffe7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Begin Your Sustainable Journey
          </Title>
          <Text 
            ta="center"
            mb={50}
            style={{ 
              color: '#b4ffe9',
              fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            Join the next generation of eco-conscious developers. Let's build a greener future together.
          </Text>

          <Paper 
            className={classes.formWrapper}
            p="xl"
          >
            <form onSubmit={handleSubmit} className={classes.form}>
              <div className={classes.formGrid}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  classNames={{
                    input: classes.input,
                    label: classes.label,
                    wrapper: classes.inputWrapper
                  }}
                />
                <TextInput
                  label="Contact Number"
                  placeholder="Enter your contact number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  classNames={{
                    input: classes.input,
                    label: classes.label,
                    wrapper: classes.inputWrapper
                  }}
                />
              </div>

              <TextInput
                label="Email Address"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                classNames={{
                  input: classes.input,
                  label: classes.label,
                  wrapper: classes.inputWrapper
                }}
              />

              <TextInput
                label="Project Title"
                placeholder="Give your green project a name"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
                classNames={{
                  input: classes.input,
                  label: classes.label,
                  wrapper: classes.inputWrapper
                }}
              />

              <Textarea
                label="Project Description"
                placeholder="Tell us about your project's environmental goals"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                required
                minRows={4}
                classNames={{
                  input: classes.input,
                  label: classes.label,
                  wrapper: classes.inputWrapper
                }}
              />

              <Group justify="center" mt={40}>
                <Button
                  type="submit"
                  size="lg"
                  leftSection={<IconSend size={18} />}
                  className={classes.submitButton}
                >
                  Launch Your Project
                </Button>
              </Group>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ClientRequest;
