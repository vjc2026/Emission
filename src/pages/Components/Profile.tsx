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
  Skeleton,
  Group,
  TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router';
import axios from 'axios';

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
        const response = await fetch('http://localhost:5000/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        const { deviceType } = await response.json();
        setDeviceType(deviceType);
  
        // Based on device type, choose the correct endpoint
        const endpoint = deviceType === 'Laptop'
          ? 'http://localhost:5000/displayuserM'
          : 'http://localhost:5000/displayuser';
  
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
        const response = await fetch('http://localhost:5000/profile_display_projects', {
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
        const cpuResponse = await axios.get(`http://localhost:5000/${cpuEndpoint}`);
        setCpuOptions(cpuResponse.data.cpuOptions.map((cpu: { label: string; value: string }) => ({
          label: cpu.label,
          value: cpu.value
        })));
  
        const gpuEndpoint = newDevice === 'Laptop' ? 'gpu-options-mobile' : 'gpu-options';
        const gpuResponse = await axios.get(`http://localhost:5000/${gpuEndpoint}`);
        setGpuOptions(gpuResponse.data.gpuOptions.map((gpu: { label: string; value: string }) => ({
          label: gpu.label,
          value: gpu.value
        })));
  
        const ramResponse = await axios.get('http://localhost:5000/ram-options');
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
        const response = await fetch('http://localhost:5000/user_devices', {
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

      const response = await axios.post('http://localhost:5000/addDevice', formData, {
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
      const response = await fetch('http://localhost:5000/setCurrentDevice', {
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
        const deviceTypeResponse = await fetch('http://localhost:5000/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        const { deviceType } = await deviceTypeResponse.json();
        setDeviceType(deviceType);
  
        const endpoint = deviceType === 'Laptop'
          ? 'http://localhost:5000/displayuserM'
          : 'http://localhost:5000/displayuser';
  
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
    <Container my="md">
      <SimpleGrid cols={isMobile ? 1 : 2} spacing="md">
      <Card
        shadow="sm"
        padding={isMobile ? 'md' : 'xl'}
        style={{ backgroundColor: '#006747', color: 'white', borderRadius: '10px' }}
      >
        <Stack align="center" gap="md">
          {user && user.profile_image && (
            <Image
              src={`${user.profile_image}`}
              alt="Profile Image"
              mx="auto"
              mb="md"
              radius={50}
            />
          )}
          <Text c="white" ta="center" style={{ fontWeight: 600, fontSize: isMobile ? '18px' : '24px' }}>
            {user?.name || 'N/A'}
          </Text>
          <Text c="white" style={{ fontSize: isMobile ? '14px' : '18px' }}>
            {user?.organization || 'N/A'}
          </Text>
        </Stack>
      </Card>

      <Card
        shadow="sm"
        padding={isMobile ? 'md' : 'xl'}
        style={{ backgroundColor: '#ffffff', color: '#333', borderRadius: '10px', marginTop: '1rem' }}
      >
        {error && <Text c="red" size="lg">{error}</Text>}
        {loading ? (
          <Loader size="xl" style={{ display: 'block', margin: '2rem auto' }} />
        ) : (
          <Stack gap="md">
            <Title order={4}>Organization</Title>
            <Text size={isMobile ? 'md' : 'lg'}>{user?.organization || 'N/A'}</Text>
            <Title order={3}>User Device Specifications</Title>
            <Grid>
              <Grid.Col span={isMobile ? 12 : 6}>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>Device Using:</strong> {selectedDevice?.device || deviceType || 'N/A'}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>PSU/Charger Watts:</strong> {selectedDevice?.psu || user?.specifications?.PSU || 'N/A'}
                </Text>
              </Grid.Col>
              <Grid.Col span={isMobile ? 12 : 6}>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>Motherboard:</strong> {selectedDevice?.motherboard || user?.specifications?.motherboard || 'N/A'}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>RAM:</strong> {selectedDevice?.ram || user?.specifications?.RAM || 'N/A'}
                </Text>
              </Grid.Col>
              <Grid.Col span={isMobile ? 12 : 6}>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>GPU:</strong> {selectedDevice?.gpu || user?.specifications?.GPU || 'N/A'}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>GPU Average Watt Usage:</strong> {deviceType === 'Laptop' ? selectedDevice?.gpu_watts ?? user?.specifications?.gpu_watts ?? 'N/A' : selectedDevice?.GPU_avg_watt_usage ?? user?.specifications?.GPU_avg_watt_usage ?? 'N/A'} W
                </Text>
              </Grid.Col>
              <Grid.Col span={isMobile ? 12 : 6}>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>CPU:</strong> {selectedDevice?.cpu || user?.specifications?.CPU || 'N/A'}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>CPU Average Watt Usage:</strong> {deviceType === 'Laptop' ? selectedDevice?.cpu_watts ?? user?.specifications?.cpu_watts ?? 'N/A' : selectedDevice?.CPU_avg_watt_usage ?? user?.specifications?.CPU_avg_watt_usage ?? 'N/A'} W
                </Text>
              </Grid.Col>
            </Grid>
          </Stack>
        )}
      </Card>

      <Card
        shadow="sm"
        padding={isMobile ? 'md' : 'xl'}
        style={{ backgroundColor: '#ffffff', color: '#333', borderRadius: '10px', marginTop: '1rem' }}
      >
        <Title order={4}>Switch Device</Title>
        <Select
          value={currentDeviceId?.toString() || ''}
          onChange={(value) => handleDeviceSwitch(Number(value))}
          data={devices.map((device) => ({
            value: device.id.toString(),
            label: `${device.device} - ${device.cpu} - ${device.gpu}`,
          }))}
          placeholder="Select a device"
          mb="sm"
        />
      </Card>
      </SimpleGrid>

      <Title
        order={2}
        style={{
          color: '#006747',
          fontWeight: 600,
          textAlign: 'center',
          margin: '2rem 0',
          fontSize: isMobile ? '24px' : '32px',
        }}
      >
        Your Projects
      </Title>

      <Select
        value={filter}
        onChange={(value) => value && setFilter(value)}
        data={[
          { value: 'All', label: 'All' },
          { value: 'In-Progress', label: 'In-Progress' },
          { value: 'Complete', label: 'Complete' },
          { value: 'Archived', label: 'Archived' },
        ]}
        placeholder="Filter by status"
        style={{ marginBottom: '1rem' }}
      />

      <Grid gutter={isMobile ? 'sm' : 'xl'} style={{ width: '100%' }}>
        {filteredProjects.length === 0 ? (
          <Grid.Col>
            <Text size="lg" ta="center">No projects found.</Text>
          </Grid.Col>
        ) : (
          filteredProjects.map((project) => (
            <Grid.Col span={isMobile ? 12 : 4} key={project.id}>
              <Card
                shadow="sm"
                padding="lg"
                style={{
                  cursor: 'pointer',
                  borderColor: '#006747',
                  borderWidth: 2,
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                  height: '100%',
                }}
                onClick={() => handleProjectClick(project)}
              >
                <Text fw={700} size={isMobile ? 'lg' : 'xl'} mb="md" style={{ color: '#006747' }}>
                  Project Title: {project.project_name}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>Stage:</strong> {project.stage.length > 35 ? `${project.stage.substring(0, 35)}...` : project.stage}
                </Text>
                <Text size={isMobile ? 'md' : 'lg'}>
                  <strong>Status:</strong> {project.status}
                </Text>
              </Card>
            </Grid.Col>
          ))
        )}
      </Grid>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Project Details"
        size="xl"
        styles={{
          root: { backgroundColor: '#f5f5f5' },
          content: {
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: isMobile ? '1rem' : '2rem',
          },
          title: {
            color: '#006747',
            fontSize: isMobile ? '20px' : '24px',
          },
        }}
      >
        {selectedProject && (
          <Stack gap="lg">
            <Text size={isMobile ? 'xl' : '2xl'} fw={700}>
              {selectedProject.project_name}
            </Text>
            <Text size={isMobile ? 'md' : 'lg'}>
              <strong>Description:</strong> {selectedProject.project_description}
            </Text>
            <Text size={isMobile ? 'md' : 'lg'}>
              <strong>Status:</strong> {selectedProject.status}
            </Text>
            <Text size={isMobile ? 'md' : 'lg'}>
              <strong>Stage:</strong> {selectedProject.stage}
            </Text>
            <Text size={isMobile ? 'md' : 'lg'}>
              <strong>Carbon Emissions:</strong> {selectedProject.carbon_emit} kg CO2e
            </Text>
            <Text size={isMobile ? 'md' : 'lg'}>
              <strong>Session Duration:</strong> {selectedProject.session_duration} seconds
            </Text>
            <Button
              color="red"
              size={isMobile ? 'md' : 'lg'}
              disabled={selectedProject.status.toLowerCase() === 'archived'}
              onClick={async () => {
                const token = localStorage.getItem('token');
                try {
                  const response = await fetch(`http://localhost:5000/archive_project/${selectedProject.id}`, {
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

      <Modal
        opened={addDeviceModalOpened}
        onClose={() => setAddDeviceModalOpened(false)}
        title="Add Another Device"
        size="lg"
        styles={{
          root: { backgroundColor: '#f5f5f5' },
          content: {
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: isMobile ? '1rem' : '2rem',
          },
          title: {
            color: '#006747',
            fontSize: isMobile ? '20px' : '24px',
          },
        }}
      >
        {!newDevice ? (
          <Group ta="center" mt="md">
            <Button fullWidth size="md" onClick={() => setNewDevice('Personal Computer')} color="green">
              Personal Computer
            </Button>
            <Button fullWidth size="md" onClick={() => setNewDevice('Laptop')} color="green">
              Laptop
            </Button>
          </Group>
        ) : (
          <>
            <Select
              label="CPU"
              placeholder="Select your CPU"
              value={cpu}
              onChange={(value) => setCpu(value || '')}
              data={cpuOptions}
              required
              mb="sm"
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
            <Button fullWidth mt="sm" onClick={handleAddDevice} color="green">
              Add Device
            </Button>
          </>
        )}
      </Modal>
      <Button fullWidth mt="sm" onClick={() => setAddDeviceModalOpened(true)} color="green">
        Add Another Device
      </Button>
    </Container>
  );
}

export default HELPComponent;
