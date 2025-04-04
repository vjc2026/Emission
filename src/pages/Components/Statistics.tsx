import { Text, Group, Card, Container, Loader, Stack, Title, Grid, Badge } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks'; // Import useMediaQuery for responsive design

export function StatisticsComponent() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');

  // Use media query to check for mobile screens
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch('http://localhost:5000/user', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setOrganization(userData.user.organization);

          const projectsResponse = await fetch('http://localhost:5000/user_projects_only', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects);
          } else {
            const result = await projectsResponse.json();
            setError(result.error || 'Failed to fetch projects.');
          }
        } else {
          const result = await userResponse.json();
          setError(result.error || 'Failed to fetch user details.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const calculateTotalEmissions = () => {
    return projects.reduce((total, project) => total + project.carbon_emit, 0).toFixed(4);
  };

  return (
    <Container>
      <Title order={1} mt="md" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
        Organization: {organization}
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
                    <Group align="apart" style={{ marga: 5 }}>
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
                    Owner: {project.owner}
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
               = </Card>
              </Grid.Col>
            ))}
          </Grid>

          <Text size="lg" fw={500} mt="md" style={{ fontSize: isMobile ? 'sm' : 'lg' }}>
            Total Carbon Emissions: {calculateTotalEmissions()} kg CO2
          </Text>
        </Stack>
      )}
    </Container>
  );
}

export default StatisticsComponent;
