import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Image, 
  Grid,
  Loader, 
  Stack,
  Modal,
  Button,
  Flex,
  Select,
  SimpleGrid,
  Group,
  TextInput,
  Paper,
  Badge,
  Transition,
  Box,
  ThemeIcon,
  RingProgress,
  ActionIcon,
  Avatar,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router';
import axios from 'axios';
import { IconDeviceLaptop, IconCpu, IconDeviceDesktop, IconPlus, IconArchive, IconDevices } from '@tabler/icons-react';

export function HELPComponent() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    organization: string;
    profile_image: string | null;
    specifications: {
      GPU: string;
      CPU: string;
      motherboard: string;
      PSU: string;
      RAM: string;
      CPU_avg_watt_usage: number | null;
      GPU_avg_watt_usage: number | null;
      cpu_watts: number | null;
      gpu_watts: number | null;
    };
  } | null>(null);

  const [deviceType, setDeviceType] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [newDevice, setNewDevice] = useState<string | null>(null);
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [ramType, setRamType] = useState('');
  const [ramCapacity, setRamCapacity] = useState('');
  const [motherboard, setMotherboard] = useState('');
  const [psu, setPsu] = useState('');
  
  const [cpuOptions, setCpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [gpuOptions, setGpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [ramOptions, setRamOptions] = useState<{ label: string; value: string }[]>([]);
  
  const router = useRouter();
  const [addDeviceModalOpened, setAddDeviceModalOpened] = useState(false);

  const [devices, setDevices] = useState<any[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
  
      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }
  
      try {
        // Fetch device type first
        const response = await fetch('http://emission-mah2.onrender.com/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        const { deviceType } = await response.json();
        setDeviceType(deviceType);
  
        // Based on device type, choose the correct endpoint
        const endpoint = deviceType === 'Laptop'
          ? 'http://emission-mah2.onrender.com/displayuserM'
          : 'http://emission-mah2.onrender.com/displayuser';
  
        // Fetch user details
        const userResponse = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
          console.log('User data fetched successfully:', data.user); // Log user data to check
          
          // Set the current device
          if (data.currentDevice) {
            setCurrentDeviceId(data.currentDevice.id);
            setSelectedDevice(data.currentDevice);
          }

          // After fetching user, fetch user projects
          fetchUserProjects(data.user.email);  // Pass user email here
        } else if (userResponse.status === 404) {
          setError('User details not found.');
        } else {
          const result = await userResponse.json();
          setError(result.error || 'Failed to fetch user details.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching user details.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProjects = async (_email: string) => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://emission-mah2.onrender.com/profile_display_projects', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch user projects.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching user projects.');
      }
    };

    fetchData(); // Call the function once on component mount
  }, []);  // Empty dependency array ensures it runs only once when the component mounts

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const cpuEndpoint = newDevice === 'Laptop' ? 'cpu-options-mobile' : 'cpu-options';
        const cpuResponse = await axios.get(`http://emission-mah2.onrender.com/${cpuEndpoint}`);
        setCpuOptions(cpuResponse.data.cpuOptions.map((cpu: { label: string; value: string }) => ({
          label: cpu.label,
          value: cpu.value
        })));
  
        const gpuEndpoint = newDevice === 'Laptop' ? 'gpu-options-mobile' : 'gpu-options';
        const gpuResponse = await axios.get(`http://emission-mah2.onrender.com/${gpuEndpoint}`);
        setGpuOptions(gpuResponse.data.gpuOptions.map((gpu: { label: string; value: string }) => ({
          label: gpu.label,
          value: gpu.value
        })));
  
        const ramResponse = await axios.get('http://emission-mah2.onrender.com/ram-options');
        setRamOptions(ramResponse.data.ramOptions.map((ram: { label: string; value: string }) => ({
          label: ram.label,
          value: ram.value
        })));
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
  
    if (newDevice) {
      fetchOptions();
    }
  }, [newDevice]);

  useEffect(() => {
    const fetchDevices = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://emission-mah2.onrender.com/user_devices', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (response.ok) {
          const data = await response.json();
          setDevices(data.devices);
          setCurrentDeviceId(data.currentDeviceId);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch devices.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching devices.');
      }
    };
  
    fetchDevices();
  }, []);

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setModalOpened(true);
  };

  const handleAddDevice = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = {
        device: newDevice || '',
        cpu,
        gpu,
        ram: ramType,
        capacity: `${ramCapacity}GB`,
        motherboard,
        psu,
      };

      const response = await axios.post('http://emission-mah2.onrender.com/addDevice', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setAddDeviceModalOpened(false);
        router.reload();
      } else {
        console.error('Error adding device');
      }
    } catch (error) {
      console.error('Error during submission:', error);
    }
  };

  const handleDeviceSwitch = async (deviceId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://emission-mah2.onrender.com/setCurrentDevice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });
  
      if (response.ok) {
        setCurrentDeviceId(deviceId);
        const selectedDevice = devices.find(device => device.id === deviceId);
        setSelectedDevice(selectedDevice);
  
        // Fetch the updated user details based on the selected device type
        const deviceTypeResponse = await fetch('http://emission-mah2.onrender.com/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        const { deviceType } = await deviceTypeResponse.json();
        setDeviceType(deviceType);
  
        const endpoint = deviceType === 'Laptop'
          ? 'http://emission-mah2.onrender.com/displayuserM'
          : 'http://emission-mah2.onrender.com/displayuser';
  
        const userResponse = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
          setSelectedDevice(data.currentDevice);
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to switch device.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while switching device.');
    }
  };

  const filteredProjects = filter === 'All' 
    ? projects.filter(project => project.status.toLowerCase() !== 'archived') 
    : projects.filter(project => project.status.toLowerCase() === filter.toLowerCase());

  return (
    <Container size="xl" py="xl">
      {/* Hero Section with User Profile */}
      <Paper 
        radius="lg" 
        p="xl" 
        mb="xl"
        styles={(theme) => ({
          root: {
            background: 'linear-gradient(135deg, #006747 0%, #004a33 100%)',
            boxShadow: '0 8px 16px rgba(0, 103, 71, 0.2)',
          }
        })}
      >
        <Flex direction={isMobile ? 'column' : 'row'} align="center" gap="xl">
          <Box style={{ flex: 1 }}>
            {user && user.profile_image ? (
              <Avatar
                src={user.profile_image}
                size={150}
                radius={75}
                mx="auto"
                styles={{
                  root: {
                    border: '4px solid white'
                  }
                }}
              />
            ) : (
              <Avatar
                size={150}
                radius={75}
                color="green"
                mx="auto"
              >{user?.name?.charAt(0) || 'U'}</Avatar>
            )}
          </Box>
          <Stack style={{ flex: 2 }} gap="xs">
            <Text c="white" size="xl" fw={700}>{user?.name || 'N/A'}</Text>
            <Badge size="lg" variant="light">{user?.organization || 'N/A'}</Badge>
            <Text c="white" size="sm" opacity={0.9}>Device Type: {deviceType || 'N/A'}</Text>
          </Stack>
        </Flex>
      </Paper>

      <SimpleGrid cols={isMobile ? 1 : 2} spacing="xl">
        {/* Device Specifications Card */}
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Group justify="space-between" mb="md">
            <Title order={3} c="#006747">Current Device</Title>
            <ThemeIcon size="lg" radius="md" variant="light" color="green">
              <IconDevices size={20} />
            </ThemeIcon>
          </Group>
          
          <Stack gap="md">
            <Select
              label="Switch Device"
              value={currentDeviceId?.toString() || ''}
              onChange={(value) => handleDeviceSwitch(Number(value))}
              data={devices.map((device) => ({
                value: device.id.toString(),
                label: `${device.device} - ${device.cpu}`,
              }))}
              rightSection={<IconDeviceLaptop size={16} />}
            />

            <SimpleGrid cols={2} spacing="sm">
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">CPU</Text>
                <Text size="sm">{selectedDevice?.cpu || user?.specifications?.CPU || 'N/A'}</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {deviceType === 'Laptop' 
                    ? `${selectedDevice?.cpu_watts ?? user?.specifications?.cpu_watts ?? 'N/A'} W` 
                    : `${selectedDevice?.CPU_avg_watt_usage ?? user?.specifications?.CPU_avg_watt_usage ?? 'N/A'} W`}
                </Text>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">GPU</Text>
                <Text size="sm">{selectedDevice?.gpu || user?.specifications?.GPU || 'N/A'}</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {deviceType === 'Laptop'
                    ? `${selectedDevice?.gpu_watts ?? user?.specifications?.gpu_watts ?? 'N/A'} W`
                    : `${selectedDevice?.GPU_avg_watt_usage ?? user?.specifications?.GPU_avg_watt_usage ?? 'N/A'} W`}
                </Text>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">RAM</Text>
                <Text size="sm">{selectedDevice?.ram || user?.specifications?.RAM || 'N/A'}</Text>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">PSU</Text>
                <Text size="sm">{selectedDevice?.psu || user?.specifications?.PSU || 'N/A'}</Text>
              </Paper>
            </SimpleGrid>

            <Button 
              variant="light" 
              color="green" 
              fullWidth 
              leftSection={<IconPlus size={16} />}
              onClick={() => setAddDeviceModalOpened(true)}
            >
              Add New Device
            </Button>
          </Stack>
        </Card>

        {/* Projects Overview Card */}
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Group justify="space-between" mb="md">
            <Title order={3} style={{ color: '#006747' }}>Projects Overview</Title>
            <Select
              size="sm"
              value={filter}
              onChange={(value) => value && setFilter(value)}
              data={[
                { value: 'All', label: 'All Projects' },
                { value: 'In-Progress', label: 'In Progress' },
                { value: 'Complete', label: 'Completed' },
                { value: 'Archived', label: 'Archived' },
              ]}
              styles={{ root: { width: 150 } }}
            />
          </Group>

          <Stack gap="md">
            {filteredProjects.length === 0 ? (
              <Text ta="center" c="dimmed">No projects found</Text>
            ) : (
              filteredProjects.map((project) => (
                <Paper
                  key={project.id}
                  p="md"
                  radius="md"
                  withBorder
                  styles={(theme) => ({
                    root: {
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      },
                    }
                  })}
                  onClick={() => handleProjectClick(project)}
                >
                  <Group justify="space-between">
                    <Box>
                      <Text fw={500}>{project.project_name}</Text>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        Stage: {project.stage}
                      </Text>
                    </Box>
                    <Badge
                      color={
                        project.status.toLowerCase() === 'complete' ? 'green' :
                        project.status.toLowerCase() === 'in-progress' ? 'blue' :
                        project.status.toLowerCase() === 'archived' ? 'gray' : 'yellow'
                      }
                    >
                      {project.status}
                    </Badge>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Project Details Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group>
            <Title order={4} style={{ color: '#006747' }}>Project Details</Title>
            <Badge size="lg">{selectedProject?.status}</Badge>
          </Group>
        }
        size="lg"
        radius="md"
      >
        {selectedProject && (
          <Stack gap="lg">
            <Title order={3}>{selectedProject.project_name}</Title>
            
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" fw={500} c="dimmed">Description</Text>
              <Text mt={4}>{selectedProject.project_description}</Text>
            </Paper>

            <SimpleGrid cols={2} spacing="md">
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">Stage</Text>
                <Text mt={4}>{selectedProject.stage}</Text>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} c="dimmed">Duration</Text>
                <Text mt={4}>{selectedProject.session_duration} seconds</Text>
              </Paper>
            </SimpleGrid>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500} c="dimmed">Carbon Emissions</Text>
                  <Text size="xl" fw={700} c="green">
                    {selectedProject.carbon_emit} kg CO2e
                  </Text>
                </div>
                <RingProgress
                  size={80}
                  thickness={8}
                  sections={[{ value: (selectedProject.carbon_emit / 10) * 100, color: '#006747' }]}
                  label={
                    <Text size="xs" ta="center">
                      {Math.round((selectedProject.carbon_emit / 10) * 100)}%
                    </Text>
                  }
                />
              </Group>
            </Paper>

            <Button
              color="red"
              variant="light"
              leftSection={<IconArchive size={16} />}
              disabled={selectedProject.status.toLowerCase() === 'archived'}
              onClick={async () => {
                const token = localStorage.getItem('token');
                try {
                  const response = await fetch(`http://emission-mah2.onrender.com/archive_project/${selectedProject.id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (response.ok) {
                    setModalOpened(false);
                    setProjects(projects.filter((p) => p.id !== selectedProject.id));
                  } else {
                    setError('Failed to archive project');
                  }
                } catch (err) {
                  console.error('Error archiving project:', err);
                  setError('An error occurred while archiving the project');
                }
              }}
            >
              Archive Project
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Add Device Modal */}
      <Modal
        opened={addDeviceModalOpened}
        onClose={() => setAddDeviceModalOpened(false)}
        title={
          <Title order={4} style={{ color: '#006747' }}>
            Add New Device
          </Title>
        }
        size="lg"
        radius="md"
      >
        {!newDevice ? (
          <SimpleGrid cols={2} spacing="md">
            <Paper
              p="xl"
              radius="md"
              withBorder
              styles={{
                root: {
                  cursor: 'pointer'
                }
              }}
              onClick={() => setNewDevice('Personal Computer')}
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={48} radius="md" color="green">
                  <IconDeviceDesktop size={24} />
                </ThemeIcon>
                <Text fw={500}>Personal Computer</Text>
              </Stack>
            </Paper>

            <Paper
              p="xl"
              radius="md"
              withBorder
              styles={{
                root: {
                  cursor: 'pointer'
                }
              }}
              onClick={() => setNewDevice('Laptop')}
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={48} radius="md" color="green">
                  <IconDeviceLaptop size={24} />
                </ThemeIcon>
                <Text fw={500}>Laptop</Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        ) : (
          <Stack gap="md">
            <Select
              label="CPU"
              placeholder="Select your CPU"
              value={cpu}
              onChange={(value) => setCpu(value || '')}
              data={cpuOptions}
              required
              rightSection={<IconCpu size={16} />}
            />
            <Select
              label="GPU"
              placeholder="Select your GPU"
              value={gpu}
              onChange={(value) => setGpu(value || '')}
              data={gpuOptions}
              required
              mb="sm"
            />
            <Select
              label="RAM Type"
              placeholder="Select RAM type"
              value={ramType}
              onChange={(value) => setRamType(value || '')}
              data={ramOptions}
              required
              mb="sm"
            />
            <TextInput
              label="RAM Capacity (GB)"
              placeholder="Enter RAM capacity"
              value={ramCapacity}
              onChange={(e) => setRamCapacity(e.currentTarget.value)}
              required
              mb="sm"
            />
            <TextInput
              label="Motherboard"
              placeholder="Motherboard"
              value={motherboard}
              onChange={(e) => setMotherboard(e.currentTarget.value)}
              required
              mb="sm"
            />
            <TextInput
              label="PSU"
              placeholder="PSU"
              value={psu}
              onChange={(e) => setPsu(e.currentTarget.value)}
              required
              mb="lg"
            />
            <Button color="green" onClick={handleAddDevice}>
              Add Device
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

export default HELPComponent;
