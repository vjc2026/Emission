import React from 'react';
import { Button, Container, Grid, Title, Text, Card, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router'; // added import
import styles from './Landing.module.css';
import { HowItWorks } from '../LandingComponents/HowItWorks';
import { Testimonials } from '../LandingComponents/Testimonials';
import ClientRequest from '../LandingComponents/ClientRequest';

const LandingPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter(); // added router

  return (
    <>
      <div className={styles.hero}>
        <Title className={styles.heroTitle}>Welcome to EmissionSense</Title>
        <Text className={styles.heroSubtitle}>
          Track, manage and reduce your carbon footprint
        </Text>
        <Button
          size={isMobile ? 'md' : 'lg'}
          mt="xl"
          onClick={() => router.push('/Login')} // added onClick
        >
          Get Started
        </Button>
      </div>

      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Grid gutter="xl">
            <Grid.Col span={isMobile ? 12 : 6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={2}>Features</Title>
                <Text mt="md">
                  Enjoy real-time tracking, detailed analytics, and project management tools designed to help reduce your carbon emissions.
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={isMobile ? 12 : 6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={2}>About Us</Title>
                <Text mt="md">
                  EmissionSense is created by DigiBytes, a research group committed to sustainability in the tech industry.
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={2}>Contact Us</Title>
            <Text mt="md">
              Have questions or feedback? Reach out to us at support@emissionsense.com.
            </Text>
          </Card>
        </Stack>
      </Container>
      
      <HowItWorks />
      <Testimonials />
      <ClientRequest />
    </>
  );
};

export default LandingPage;