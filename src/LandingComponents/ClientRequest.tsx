import React, { useState, useRef, useCallback } from 'react';
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
  const formWrapperRef = useRef<HTMLDivElement>(null);
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (formWrapperRef.current) {
      const rect = formWrapperRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      formWrapperRef.current.style.setProperty('--mouse-x', `${x}%`);
      formWrapperRef.current.style.setProperty('--mouse-y', `${y}%`);
    }
  }, []);

  return (
    <Box className={classes.wrapper}>
      <Container size="xl" className={classes.container}>
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <Title 
            ta="center" 
            mb="sm"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #9fffe7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
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
              margin: '0 auto 3rem auto'
            }}
          >
            Join the next generation of eco-conscious developers. Let&apos;s build a greener future together.
          </Text>

          <Paper 
            ref={formWrapperRef}
            onMouseMove={handleMouseMove}
            className={classes.formWrapper}
            p="xl"
          >
            <div className={classes.formOverlay}></div>
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
