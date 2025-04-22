import { 
  Text, 
  Group, 
  Card, 
  Container, 
  Loader, 
  Stack, 
  Title, 
  Grid, 
  Badge, 
  Select, 
  Box, 
  Paper, 
  RingProgress, 
  Tabs, 
  ActionIcon, 
  Divider, 
  ScrollArea, 
  useMantineTheme, 
  ThemeIcon,
  SimpleGrid,
  Progress,
  Center,
  Tooltip,
  Switch
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { 
  IconLeaf, 
  IconInfoCircle, 
  IconFilter, 
  IconChartBar, 
  IconList, 
  IconRefresh, 
  IconChevronDown, 
  IconChevronUp, 
  IconPlant,
  IconUsers,
  IconCalendar,
  IconChartPie,
  IconChartLine,
  IconBuildingFactory
} from '@tabler/icons-react';

export function StatisticsComponent() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);

  // Use media query to check for mobile screens
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Access theme for consistent colors
  const theme = useMantineTheme();

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch('https://node-iota-livid.vercel.app/user', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (userResponse.ok) {          const userData = await userResponse.json();
          setOrganization(userData.user.organization);

          const projectsResponse = await fetch('https://node-iota-livid.vercel.app/user_project_display_combined', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects);
            setFilteredProjects(projectsData.projects); // Initialize filtered projects with all projects
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

  // Apply filters whenever the filters or projects change
  useEffect(() => {
    let result = [...projects];
    
    if (statusFilter) {
      result = result.filter(project => project.status === statusFilter);
    }
    
    if (stageFilter) {
      result = result.filter(project => project.stage === stageFilter);
    }
    
    if (organizationFilter) {
      result = result.filter(project => project.organization === organizationFilter);
    }
    
    // Filter for active or completed projects only
    if (showActiveOnly) {
      result = result.filter(project => 
        project.status === 'Complete' || 
        project.status === 'Completed' || 
        project.status === 'In Progress' || 
        project.status === 'In-Progress'
      );
    }
    
    setFilteredProjects(result);
  }, [projects, statusFilter, stageFilter, organizationFilter, showActiveOnly]);
  const calculateTotalEmissions = () => {
    return filteredProjects.reduce((total, project) => total + project.carbon_emit, 0).toFixed(4);
  };

  // Calculate stats for visualization
  const calculateEmissionsByStatus = () => {
    const statusMap: Record<string, number> = {};
    filteredProjects.forEach(project => {
      const status = project.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + project.carbon_emit;
    });
    return statusMap;
  };

  const calculateEmissionsByStage = () => {
    const stageMap: Record<string, number> = {};
    filteredProjects.forEach(project => {
      const stage = project.stage || 'Unknown';
      stageMap[stage] = (stageMap[stage] || 0) + project.carbon_emit;
    });
    return stageMap;
  };

  // Calculate project counts by status
  const getProjectCountsByStatus = () => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(project => {
      const status = project.status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  // Extract unique values for filters
  const getUniqueValues = (field: string) => {
    const values = projects.map(project => project[field]);
    return [...new Set(values)].filter(Boolean);
  };

  const uniqueStatuses = getUniqueValues('status');
  const uniqueStages = getUniqueValues('stage');
  const uniqueOrganizations = getUniqueValues('organization');
  
  // Get color for status badges
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In-Progress': return 'yellow';
      case 'Archived': return 'red';
      case 'Completed': return 'green';
      default: return 'blue';
    }
  };
  // Format duration from seconds to readable format
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}s`;
    
    return result.trim();
  };
  
  // Prepare data for dashboard cards
  const totalProjects = filteredProjects.length;
  const totalEmissions = parseFloat(calculateTotalEmissions());
  const avgEmissionPerProject = totalProjects ? totalEmissions / totalProjects : 0;
  
  // Get most active project (highest session duration)
  const mostActiveProject = filteredProjects.length 
    ? filteredProjects.reduce((prev, current) => (prev.session_duration > current.session_duration) ? prev : current, filteredProjects[0])
    : null;
    
  // Get project with highest emissions
  const highestEmissionProject = filteredProjects.length
    ? filteredProjects.reduce((prev, current) => (prev.carbon_emit > current.carbon_emit) ? prev : current, filteredProjects[0])
    : null;
    
  // Prepare data for status distribution chart
  const statusCounts = getProjectCountsByStatus();
  const statusEmissions = calculateEmissionsByStatus();
  
  // Prepare data for stage distribution chart
  const stageEmissions = calculateEmissionsByStage();
  
  // Function to get a color from the theme for charts
  const getChartColor = (index: number) => {
    const colors = [
      theme.colors.blue[6], 
      theme.colors.green[6], 
      theme.colors.yellow[6], 
      theme.colors.orange[6], 
      theme.colors.red[6], 
      theme.colors.grape[6]
    ];
    return colors[index % colors.length];
  };
  
  // Function to create segments for the ring progress
  const createRingProgressSegments = (dataMap: Record<string, number>) => {
    const total = Object.values(dataMap).reduce((sum, value) => sum + value, 0);
    return Object.entries(dataMap).map(([key, value], index) => ({
      value: total ? (value / total) * 100 : 0,
      color: getChartColor(index),
      tooltip: `${key}: ${value.toFixed(2)} kg CO2`,
      label: key
    }));
  };
  
  // Create segments for charts
  const statusSegments = createRingProgressSegments(statusEmissions);
  const stageSegments = createRingProgressSegments(stageEmissions);
  
  return (
    <Container size="xl" px={isMobile ? "xs" : "md"}>
      <Paper shadow="xs" p="md" radius="md" withBorder mb="md">              <Group justify="space-between" mb="xs">
                <Group>
                  <ThemeIcon size="lg" variant="light" radius="xl" color="green">
                    <IconBuildingFactory size={20} />
                  </ThemeIcon>
                  <Title order={2} style={{ fontSize: isMobile ? '1.3rem' : '1.8rem' }}>
                    {organization} Dashboard
                  </Title>
                </Group>
                
                <ActionIcon 
                  variant="light" 
                  color="blue" 
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label="Toggle filters"
                >
                  <IconFilter size={20} />
                </ActionIcon>
              </Group>
        
        {error && (
          <Paper p="xs" withBorder radius="md" bg="red.0" mb="md">
            <Group>
              <ThemeIcon color="red" variant="light" radius="xl">
                <IconInfoCircle size={18} />
              </ThemeIcon>
              <Text color="red" size="sm">{error}</Text>
            </Group>
          </Paper>
        )}
      </Paper>
      
      {loading ? (
        <Center style={{ height: '60vh' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" variant="dots" color="green" />
            <Text color="dimmed">Loading project statistics...</Text>
          </Stack>
        </Center>
      ) : (
        <>
          {showFilters && (
            <Paper shadow="xs" p="md" radius="md" withBorder mb="md">
              <Stack gap="xs">
                <Title order={4}>Filters</Title>
                <SimpleGrid cols={isMobile ? 1 : 3}>
                  <Select
                    label="Status"
                    placeholder="All Statuses"
                    data={uniqueStatuses.map(status => ({ value: status, label: status }))}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    clearable
                    leftSection={<IconFilter size={14} />}
                  />
                  <Select
                    label="Stage"
                    placeholder="All Stages"
                    data={uniqueStages.map(stage => ({ value: stage, label: stage }))}
                    value={stageFilter}
                    onChange={setStageFilter}
                    clearable
                    leftSection={<IconFilter size={14} />}
                  />
                  <Select
                    label="Organization"
                    placeholder="All Organizations"
                    data={uniqueOrganizations.map(org => ({ value: org, label: org }))}
                    value={organizationFilter}
                    onChange={setOrganizationFilter}
                    clearable
                    leftSection={<IconFilter size={14} />}
                  />
                </SimpleGrid>
                  <Group align="apart">
                  <Group>
                    <Text size="sm" color="dimmed">
                      Showing {filteredProjects.length} of {projects.length} projects
                    </Text>
                    <Switch
                      label="Show active/completed only"
                      checked={showActiveOnly}
                      onChange={(event) => setShowActiveOnly(event.currentTarget.checked)}
                      color="green"
                      size="sm"
                    />
                  </Group>
                  <ActionIcon 
                    variant="subtle" 
                    color="blue" 
                    onClick={() => {
                      setStatusFilter(null);
                      setStageFilter(null);
                      setOrganizationFilter(null);
                      setShowActiveOnly(false);
                    }}
                    aria-label="Clear filters"
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Paper>
          )}
          
          {/* Summary Cards */}
          <SimpleGrid 
            cols={isMobile ? 1 : 4} 
            mb="xl"
          >
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Group align="apart">
                <div>
                  <Text size="xs" color="dimmed" fw={700}>
                    Projects
                  </Text>
                  <Title order={2}>{totalProjects}</Title>
                </div>
                <ThemeIcon size={48} radius="md" color="blue" variant="light">
                  <IconChartBar size={24} />
                </ThemeIcon>
              </Group>
              <Text size="xs" color="dimmed" mt="md">
                Total active projects in system
              </Text>
            </Paper>
            
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Group align="apart">
                <div>
                  <Text size="xs" color="dimmed"  fw={700}>
                    Total Emissions
                  </Text>
                  <Title order={2}>{totalEmissions.toFixed(2)}</Title>
                </div>
                <ThemeIcon size={48} radius="md" color="green" variant="light">
                  <IconLeaf size={24} />
                </ThemeIcon>
              </Group>
              <Text size="xs" color="dimmed" mt="md">
                kg CO₂ across all projects
              </Text>
            </Paper>
            
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Group align="apart">
                <div>
                  <Text size="xs" color="dimmed"  fw={700}>
                    Per Project
                  </Text>
                  <Title order={2}>{avgEmissionPerProject.toFixed(2)}</Title>
                </div>
                <ThemeIcon size={48} radius="md" color="yellow" variant="light">
                  <IconPlant size={24} />
                </ThemeIcon>
              </Group>
              <Text size="xs" color="dimmed" mt="md">
                Average kg CO₂ per project
              </Text>
            </Paper>
            
            {highestEmissionProject && (
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Group align="apart">
                  <div>
                    <Text size="xs" color="dimmed"  fw={700}>
                      Highest Emission
                    </Text>
                    <Title order={3} style={{ fontSize: '1.5rem', wordBreak: 'break-word' }}>
                      {highestEmissionProject.carbon_emit.toFixed(2)} kg
                    </Title>
                  </div>
                  <ThemeIcon size={48} radius="md" color="red" variant="light">
                    <IconInfoCircle size={24} />
                  </ThemeIcon>
                </Group>
                <Text size="xs" mt="md" lineClamp={1}>
                  From: {highestEmissionProject.project_name}
                </Text>
              </Paper>
            )}
          </SimpleGrid>
          
          {/* Tabs for different views */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)} mb="md">
            <Tabs.List>
              <Tabs.Tab value="list" leftSection={<IconList size={16} />}>
                Projects List
              </Tabs.Tab>
              <Tabs.Tab value="charts" leftSection={<IconChartPie size={16} />}>
                Statistics
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          
          {/* Projects List View */}
          {activeTab === 'list' && (
            <ScrollArea h={isMobile ? undefined : 400} offsetScrollbars>
              <Grid gutter="md">
                {filteredProjects.map((project) => (
                  <Grid.Col span={isMobile ? 12 : 6} key={project.id}>
                    <Card shadow="sm" p="md" radius="md" withBorder>
                      <Card.Section p="md">
                        <Group align="apart">
                          <Text fw={600} lineClamp={1}>
                            {project.project_name}
                          </Text>
                          <Badge color={getStatusColor(project.status)} variant="light">
                            {project.status}
                          </Badge>
                        </Group>
                      </Card.Section>
                      
                      <Box mt="md">
                        <Text size="sm" lineClamp={2} mb="md">
                          {project.project_description}
                        </Text>
                        
                        <Divider mb="md" />
                        
                        <SimpleGrid cols={2}>
                          <Group gap="xs">
                            <ThemeIcon size="sm" color="blue" variant="light" radius="xl">
                              <IconUsers size={14} />
                            </ThemeIcon>
                            <Text size="xs">{project.owner}</Text>
                          </Group>
                          
                          <Group gap="xs">
                            <ThemeIcon size="sm" color="grape" variant="light" radius="xl">
                              <IconCalendar size={14} />
                            </ThemeIcon>
                            <Text size="xs">{formatDuration(project.session_duration)}</Text>
                          </Group>
                          
                          <Group gap="xs">
                            <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                              <IconLeaf size={14} />
                            </ThemeIcon>
                            <Text size="xs">{project.carbon_emit.toFixed(2)} kg CO₂</Text>
                          </Group>
                          
                          <Group gap="xs">
                            <ThemeIcon size="sm" color="orange" variant="light" radius="xl">
                              <IconChartLine size={14} />
                            </ThemeIcon>
                            <Text size="xs">{project.stage}</Text>
                          </Group>
                        </SimpleGrid>
                      </Box>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </ScrollArea>
          )}
          
          {/* Charts View */}
          {activeTab === 'charts' && (
            <SimpleGrid cols={isMobile ? 1 : 2}>
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Emissions by Status</Title>
                <Group align="center" gap="xl" >
                  <RingProgress
                    size={180}
                    thickness={20}
                    roundCaps
                    sections={statusSegments}
                    label={
                      <Center>
                        <ThemeIcon color="green" variant="light" radius="xl" size="xl">
                          <IconLeaf size={24} />
                        </ThemeIcon>
                      </Center>
                    }
                  />
                  
                  <Stack gap="xs">
                    {statusSegments.map((segment, index) => (
                      <Group key={index} gap="xs">
                        <Box
                        />
                        <Text size="sm">
                          {segment.label}: {statusEmissions[segment.label]?.toFixed(2) || 0} kg CO₂
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Group>
              </Paper>
              
              <Paper shadow="sm" p="md" radius="md" withBorder>
                <Title order={4} mb="md">Emissions by Stage</Title>
                <Group align="center" gap="xl">
                  <RingProgress
                    size={180}
                    thickness={20}
                    roundCaps
                    sections={stageSegments}
                    label={
                      <Center>
                        <ThemeIcon color="blue" variant="light" radius="xl" size="xl">
                          <IconChartPie size={24} />
                        </ThemeIcon>
                      </Center>
                    }
                  />
                  
                  <Stack gap="xs">
                    {stageSegments.map((segment, index) => (
                      <Group key={index} gap="xs">
                        <Box
                        />
                        <Text size="sm">
                          {segment.label}: {stageEmissions[segment.label]?.toFixed(2) || 0} kg CO₂
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Group>
              </Paper>
              
              <Paper shadow="sm" p="md" radius="md">
                <Title order={4} mb="md">Status Distribution</Title>
                <Box>
                  {Object.entries(statusCounts).map(([status, count], index) => {
                    const percentage = (count / totalProjects) * 100;
                    return (
                      <Box key={status} mb="xs">
                        <Group align="apart" mb={5}>
                          <Group gap="xs">
                            <Box
                            />
                            <Text size="sm">{status}</Text>
                          </Group>
                          <Text size="sm">{count} projects ({percentage.toFixed(1)}%)</Text>
                        </Group>
                        <Progress 
                          value={percentage} 
                          color={getChartColor(index)} 
                          size="md" 
                          radius="xl"
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </SimpleGrid>
          )}
          
          <Group align="right" mt="xl">
            <Paper 
              shadow="md" 
              p="md" 
              radius="md" 
              withBorder 
              style={{ display: 'inline-block' }}
            >
              <Group>
                <ThemeIcon size="lg" color="green" variant="light" radius="xl">
                  <IconLeaf size={20} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" color="dimmed">TOTAL CARBON FOOTPRINT</Text>
                  <Title order={3}>{totalEmissions.toFixed(4)} kg CO₂</Title>
                </Box>
              </Group>
            </Paper>
          </Group>
        </>
      )}
    </Container>
  );
}

export default StatisticsComponent;
