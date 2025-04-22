import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Title, 
  Paper, 
  Text, 
  Group, 
  SimpleGrid, 
  Stack,
  Progress,
  Badge,
  RingProgress,
  Divider,
  Grid,
  ScrollArea,
  Timeline,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { 
  IconFlag,
  IconClipboardCheck,
  IconChartBar,
  IconChartLine,
  IconCalendar,
  IconUsers,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Project {
  id: number;
  project_name: string;
  project_description: string;
  status: string;
  stage: string;
  carbon_emit: number;
  session_duration: number;
  stage_duration: number;
  stage_start_date: string;
  stage_due_date: string;
  project_start_date: string;
  project_due_date: string;
  members: string[];
  owner_email: string;
  owner_name: string;
}

export function ProjectAnalytics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://emission-mah2.onrender.com/user_project_display_combined', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        
        // Enhance projects with member data
        const enhancedProjects = await Promise.all(data.projects.map(async (project: Project) => {
          const membersResponse = await fetch(`http://emission-mah2.onrender.com/project/${project.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (membersResponse.ok) {
            const { members } = await membersResponse.json();
            return { ...project, members: members.map((m: any) => m.email) };
          }
          return project;
        }));

        setProjects(enhancedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        notifications.show({
          title: 'Error',
          message: 'Failed to load project analytics',
          color: 'red',
          icon: <IconAlertCircle />,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const calculateProgress = (project: Project) => {
    if (!project.stage_start_date || !project.stage_due_date) return 0;
    
    const now = new Date();
    const startDate = new Date(project.stage_start_date);
    const dueDate = new Date(project.stage_due_date);
    
    if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) return 0;
    
    const totalDuration = dueDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const getStageColor = (stage: string) => {
    if (stage.includes('Design')) return 'blue';
    if (stage.includes('Development')) return 'violet';
    return 'green';
  };

  const renderGanttChart = () => {
    return (
      <ScrollArea>
        <div style={{ minWidth: '800px', padding: '1rem' }}>
          {projects.map((project) => (
            <div key={project.id} style={{ marginBottom: '1rem' }}>
              <Group mb="xs">
                <Text size="sm" fw={500}>{project.project_name}</Text>
                <Badge color={getStageColor(project.stage)}>{project.stage.split(':')[0]}</Badge>
              </Group>
              <Progress 
                size="xl"
                value={calculateProgress(project)}
                color={getStageColor(project.stage)}
              />
              <Text size="sm" ta="center" mt={4}>
                {Math.round(calculateProgress(project))}%
              </Text>
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">Start: {new Date(project.stage_start_date).toLocaleDateString()}</Text>
                <Text size="xs" c="dimmed">Due: {new Date(project.stage_due_date).toLocaleDateString()}</Text>
              </Group>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderBurndownChart = () => {
    const activeProjects = projects.filter(p => p.status === 'In-Progress');
    const totalDuration = activeProjects.reduce((sum, p) => sum + p.stage_duration, 0);
    const completedDuration = activeProjects.reduce((sum, p) => sum + (p.stage_duration * (calculateProgress(p) / 100)), 0);
    const remainingPercentage = ((totalDuration - completedDuration) / totalDuration) * 100;

    return (
      <Stack align="center">
        <RingProgress
          size={180}
          thickness={20}
          sections={[
            { value: 100 - remainingPercentage, color: 'green' },
            { value: remainingPercentage, color: 'gray' }
          ]}
          label={
            <Text ta="center" size="lg" fw={700}>
              {Math.round(100 - remainingPercentage)}%
              <Text size="xs" c="dimmed">Completed</Text>
            </Text>
          }
        />
      </Stack>
    );
  };

  const renderStageComparison = () => {
    const stages = ['Design', 'Development', 'Testing'];
    const stageStats = stages.map(stage => {
      const stageProjects = projects.filter(p => p.stage.includes(stage));
      const avgProgress = stageProjects.reduce((sum, p) => sum + calculateProgress(p), 0) / (stageProjects.length || 1);
      const totalEmissions = stageProjects.reduce((sum, p) => sum + p.carbon_emit, 0);
      
      return {
        stage,
        count: stageProjects.length,
        avgProgress,
        totalEmissions
      };
    });

    return (
      <Timeline active={1} bulletSize={24} lineWidth={2}>
        {stageStats.map(({ stage, count, avgProgress, totalEmissions }) => (
          <Timeline.Item
            key={stage}
            bullet={<IconChartBar size={12} />}
            title={stage}
          >
            <Text size="sm" mt={4}>Projects: {count}</Text>
            <Text size="sm">Average Progress: {Math.round(avgProgress)}%</Text>
            <Text size="sm">Total Emissions: {totalEmissions.toFixed(2)} kg CO₂</Text>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  if (loading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error}
      </Alert>
    );
  }

  return (
    <Container size="xl">
      <Title order={1} mb="xl">Project Analytics Dashboard</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconFlag size={20} />
            <Text>Active Projects</Text>
          </Group>
          <Text size="xl" fw={700} mt="md">
            {projects.filter(p => p.status === 'In-Progress').length}
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <IconClipboardCheck size={20} />
            <Text>Completed</Text>
          </Group>
          <Text size="xl" fw={700} mt="md">
            {projects.filter(p => p.status === 'Complete').length}
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <IconChartLine size={20} />
            <Text>Total Emissions</Text>
          </Group>
          <Text size="xl" fw={700} mt="md">
            {projects.reduce((sum, p) => sum + p.carbon_emit, 0).toFixed(2)} kg CO₂
          </Text>
        </Paper>
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={12}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">Project Timeline (Gantt Chart)</Title>
            {renderGanttChart()}
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">Project Burndown</Title>
            {renderBurndownChart()}
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">Stage Analysis</Title>
            {renderStageComparison()}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

export default ProjectAnalytics;
