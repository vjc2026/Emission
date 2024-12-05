import { Text, Card, Container, Grid, Title, Stack, Flex } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';  // Importing Mantine's useMediaQuery hook

export function TextComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');  // Determine if screen is mobile

  return (
    <Flex justify="center" align="center" style={{ height: '90vh', padding: isMobile ? '1rem' : '0' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* About the Website Card */}
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#e8f5e9' }}>
            <Title order={2} style={{ color: '#388e3c' }}>About the Website</Title>
            <Text size={isMobile ? 'sm' : 'md'} style={{ color: '#1b5e20', marginTop: '1rem' }}>
              EmissionSense is a platform designed to help users track and manage their carbon emissions during software development projects. Our goal is to provide insights and tools to promote sustainable practices in the tech industry.
            </Text>
          </Card>

          {/* How to Use It & About Us Cards */}
          <Flex justify={isMobile ? 'center' : 'space-between'} align="stretch" style={{ gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#e8f5e9', flex: 1 }}>
              <Title order={2} style={{ color: '#388e3c' }}>How to Use It</Title>
              <Text size={isMobile ? 'sm' : 'md'} style={{ color: '#1b5e20', marginTop: '1rem' }}>
                To get started, create an account and log in. Once logged in, you can create new projects, start and stop timers to track your work sessions, and view detailed statistics about your carbon emissions. Use the provided tools to analyze your data and make informed decisions to reduce your carbon footprint.
              </Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#e8f5e9', flex: 1 }}>
              <Title order={2} style={{ color: '#388e3c' }}>About Us</Title>
              <Text size={isMobile ? 'sm' : 'md'} style={{ color: '#1b5e20', marginTop: '1rem' }}>
                EmissionSense was created by the research group DigiBytes. Our team is dedicated to promoting sustainability in the tech industry through innovative solutions and research. We believe that by providing tools and insights, we can help individuals and organizations make a positive impact on the environment.
              </Text>
            </Card>
          </Flex>

          {/* Features and Contact Us Cards in a Grid */}
          <Grid gutter="xl">
            <Grid.Col span={isMobile ? 12 : 6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#e8f5e9' }}>
                <Title order={2} style={{ color: '#388e3c' }}>Features</Title>
                <Text size={isMobile ? 'sm' : 'md'} style={{ color: '#1b5e20', marginTop: '1rem' }}>
                  Our platform offers a variety of features including real-time tracking of carbon emissions, detailed analytics, project management tools, and personalized recommendations to help you reduce your carbon footprint.
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={isMobile ? 12 : 6}>
              <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#e8f5e9' }}>
                <Title order={2} style={{ color: '#388e3c' }}>Contact Us</Title>
                <Text size={isMobile ? 'sm' : 'md'} style={{ color: '#1b5e20', marginTop: '1rem' }}>
                  If you have any questions or feedback, feel free to reach out to us at support@emissionsense.com. We are always here to help and would love to hear from you.
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </Flex>
  );
}

export default TextComponent;
