import { useState, useEffect } from 'react';
import { Container, Text, Card, Loader, Stack, Title, Grid, Badge, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export function DashboardComponent() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchJoinedProjects = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://emission-811s.vercel.app/user_project_display_combined', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch projects.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedProjects();
  }, []);

  return (
    <Container>
      <Title order={1} mt="md" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
        Joined Projects
      </Title>

      {error && <Text color="red" style={{ fontSize: isMobile ? 'sm' : 'md' }}>{error}</Text>}

      {loading ? (
        <Loader size="lg" style={{ display: 'block', margin: '0 auto' }} />
      ) : (
        <Stack mt="md">
          <Grid gutter="md">
            {projects.map((project) => (
              <Grid.Col span={isMobile ? 12 : 6} key={project.id}>
                <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                  <Group align="apart" style={{ marginBottom: 5 }}>
                    <Text fw={500} style={{ fontSize: isMobile ? 'sm' : 'md' }}>
                      Project Title: {project.project_name}
                    </Text>
                    <Badge color={project.status === "In-Progress" ? "yellow" : project.status === "Archived" ? "red" : "green"} variant="light">
                      Project {project.status}
                    </Badge>
                  </Group>
                  <Text size="sm" fw="10" style={{ lineHeight: 1.5, fontSize: isMobile ? 'sm' : 'md' }}>
                    Project Description: {project.project_description.length > 100 ? `${project.project_description.substring(0, 100)}.........` : project.project_description}
                  </Text>
                  <Text size="sm" color="dimmed" style={{ fontSize: isMobile ? 'sm' : 'md' }}>
                    Session Duration: {project.session_duration} seconds
                  </Text>
                  <Text size="sm" color="dimmed" style={{ fontSize: isMobile ? 'sm' : 'md' }}>
                    Carbon Emissions: {project.carbon_emit.toFixed(2)} kg CO2
                  </Text>
                  <Text size="sm" color="dimmed" style={{ fontSize: isMobile ? 'sm' : 'md' }}>
                    Stage: {project.stage}
                  </Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      )}
    </Container>
  );
}

export default DashboardComponent;
