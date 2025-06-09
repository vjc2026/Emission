import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import {
  Table,
  TextInput,
  Text,
  Button,
  Modal,
  Group,
  Container,
  Title,
  Tabs,
  NumberInput,
  Paper,
  ActionIcon,
  Tooltip,
  Badge,
  Divider,
  Flex,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCpu,
  IconDeviceGamepad2,
  IconDatabase,
  IconRefresh,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import styles from './AdminUsers.module.css';

interface CPU {
  id: number;
  manufacturer: string;
  series: string;
  model: string;
  generation: string;
  avg_watt_usage: number;
}

interface CPUMobile {
  id: number;
  generation: string;
  model: string;
  cpu_watts: number;
}

interface GPU {
  id: number;
  manufacturer: string;
  series: string;
  model: string;
  avg_watt_usage: number;
}

interface GPUMobile {
  id: number;
  manufacturer: string;
  model: string;
  gpu_watts: number;
}

interface RAM {
  id: number;
  ddr_generation: string;
  voltage: number;
  avg_watt_usage: number;
}

const ITEMS_PER_PAGE = 10;

const DeviceMaintenance: React.FC = () => {
  const router = useRouter();
  
  // State variables
  const [activeTab, setActiveTab] = useState<string>('cpus');
  
  // Data states
  const [cpus, setCpus] = useState<CPU[]>([]);
  const [cpusMobile, setCpusMobile] = useState<CPUMobile[]>([]);
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [gpusMobile, setGpusMobile] = useState<GPUMobile[]>([]);
  const [rams, setRams] = useState<RAM[]>([]);
  
  // Modal states
  const [cpuModalOpened, setCpuModalOpened] = useState(false);
  const [cpuMobileModalOpened, setCpuMobileModalOpened] = useState(false);
  const [gpuModalOpened, setGpuModalOpened] = useState(false);
  const [gpuMobileModalOpened, setGpuMobileModalOpened] = useState(false);
  const [ramModalOpened, setRamModalOpened] = useState(false);
  
  // Editing states
  const [editingCpu, setEditingCpu] = useState<CPU | null>(null);
  const [editingCpuMobile, setEditingCpuMobile] = useState<CPUMobile | null>(null);
  const [editingGpu, setEditingGpu] = useState<GPU | null>(null);
  const [editingGpuMobile, setEditingGpuMobile] = useState<GPUMobile | null>(null);
  const [editingRam, setEditingRam] = useState<RAM | null>(null);
  
  // Search states
  const [cpuSearch, setCpuSearch] = useState('');
  const [cpuMobileSearch, setCpuMobileSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [gpuMobileSearch, setGpuMobileSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');
  
  // Pagination states
  const [cpuPage, setCpuPage] = useState(1);
  const [cpuMobilePage, setCpuMobilePage] = useState(1);
  const [gpuPage, setGpuPage] = useState(1);
  const [gpuMobilePage, setGpuMobilePage] = useState(1);
  const [ramPage, setRamPage] = useState(1);

  // Forms
  const cpuForm = useForm({
    initialValues: {
      manufacturer: '',
      series: '',
      model: '',
      generation: '',
      avg_watt_usage: 0,
    },
  });

  const cpuMobileForm = useForm({
    initialValues: {
      generation: '',
      model: '',
      cpu_watts: 0,
    },
  });

  const gpuForm = useForm({
    initialValues: {
      manufacturer: '',
      series: '',
      model: '',
      avg_watt_usage: 0,
    },
  });

  const gpuMobileForm = useForm({
    initialValues: {
      manufacturer: '',
      model: '',
      gpu_watts: 0,
    },
  });

  const ramForm = useForm({
    initialValues: {
      ddr_generation: '',
      voltage: 0,
      avg_watt_usage: 0,
    },
  });

  // Fetch functions
  const fetchCpus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('https://emissionserver.vercel.app/admin/cpus', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCpus(data);
    } catch (error) {
      console.error('Error fetching CPUs:', error);
    }
  };

  const fetchCpusMobile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('https://emissionserver.vercel.app/admin/cpus-mobile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCpusMobile(data);
    } catch (error) {
      console.error('Error fetching mobile CPUs:', error);
    }
  };

  const fetchGpus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('https://emissionserver.vercel.app/admin/gpus', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGpus(data);
    } catch (error) {
      console.error('Error fetching GPUs:', error);
    }
  };

  const fetchGpusMobile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('https://emissionserver.vercel.app/admin/gpus-mobile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGpusMobile(data);
    } catch (error) {
      console.error('Error fetching mobile GPUs:', error);
    }
  };

  const fetchRams = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('https://emissionserver.vercel.app/admin/rams', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setRams(data);
    } catch (error) {
      console.error('Error fetching RAMs:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchCpus();
    fetchCpusMobile();
    fetchGpus();
    fetchGpusMobile();
    fetchRams();
  }, []);

  // Submit functions
  const handleCpuSubmit = async (values: typeof cpuForm.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let response;
      if (editingCpu) {
        response = await fetch(`https://emissionserver.vercel.app/admin/cpus/${editingCpu.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch('https://emissionserver.vercel.app/admin/cpus', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: editingCpu ? 'CPU updated successfully' : 'CPU created successfully',
        color: 'green',
      });
      
      cpuForm.reset();
      setEditingCpu(null);
      setCpuModalOpened(false);
      fetchCpus();
    } catch (error) {
      console.error('Error saving CPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save CPU',
        color: 'red',
      });
    }
  };

  const handleCpuMobileSubmit = async (values: typeof cpuMobileForm.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let response;
      if (editingCpuMobile) {
        response = await fetch(`https://emissionserver.vercel.app/admin/cpus-mobile/${editingCpuMobile.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch('https://emissionserver.vercel.app/admin/cpus-mobile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: editingCpuMobile ? 'Mobile CPU updated successfully' : 'Mobile CPU created successfully',
        color: 'green',
      });
      
      cpuMobileForm.reset();
      setEditingCpuMobile(null);
      setCpuMobileModalOpened(false);
      fetchCpusMobile();
    } catch (error) {
      console.error('Error saving mobile CPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save mobile CPU',
        color: 'red',
      });
    }
  };

  const handleGpuSubmit = async (values: typeof gpuForm.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let response;
      if (editingGpu) {
        response = await fetch(`https://emissionserver.vercel.app/admin/gpus/${editingGpu.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch('https://emissionserver.vercel.app/admin/gpus', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: editingGpu ? 'GPU updated successfully' : 'GPU created successfully',
        color: 'green',
      });
      
      gpuForm.reset();
      setEditingGpu(null);
      setGpuModalOpened(false);
      fetchGpus();
    } catch (error) {
      console.error('Error saving GPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save GPU',
        color: 'red',
      });
    }
  };

  const handleGpuMobileSubmit = async (values: typeof gpuMobileForm.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let response;
      if (editingGpuMobile) {
        response = await fetch(`https://emissionserver.vercel.app/admin/gpus-mobile/${editingGpuMobile.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch('https://emissionserver.vercel.app/admin/gpus-mobile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: editingGpuMobile ? 'Mobile GPU updated successfully' : 'Mobile GPU created successfully',
        color: 'green',
      });
      
      gpuMobileForm.reset();
      setEditingGpuMobile(null);
      setGpuMobileModalOpened(false);
      fetchGpusMobile();
    } catch (error) {
      console.error('Error saving mobile GPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save mobile GPU',
        color: 'red',
      });
    }
  };

  const handleRamSubmit = async (values: typeof ramForm.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let response;
      if (editingRam) {
        response = await fetch(`https://emissionserver.vercel.app/admin/rams/${editingRam.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch('https://emissionserver.vercel.app/admin/rams', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: editingRam ? 'RAM updated successfully' : 'RAM created successfully',
        color: 'green',
      });
      
      ramForm.reset();
      setEditingRam(null);
      setRamModalOpened(false);
      fetchRams();
    } catch (error) {
      console.error('Error saving RAM:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save RAM',
        color: 'red',
      });
    }
  };

  // Delete functions
  const handleDeleteCpu = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`https://emissionserver.vercel.app/admin/cpus/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: 'CPU deleted successfully',
        color: 'green',
      });
      
      fetchCpus();
    } catch (error) {
      console.error('Error deleting CPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete CPU',
        color: 'red',
      });
    }
  };

  const handleDeleteCpuMobile = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`https://emissionserver.vercel.app/admin/cpus-mobile/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: 'Mobile CPU deleted successfully',
        color: 'green',
      });
      
      fetchCpusMobile();
    } catch (error) {
      console.error('Error deleting mobile CPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete mobile CPU',
        color: 'red',
      });
    }
  };

  const handleDeleteGpu = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`https://emissionserver.vercel.app/admin/gpus/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: 'GPU deleted successfully',
        color: 'green',
      });
      
      fetchGpus();
    } catch (error) {
      console.error('Error deleting GPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete GPU',
        color: 'red',
      });
    }
  };

  const handleDeleteGpuMobile = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`https://emissionserver.vercel.app/admin/gpus-mobile/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: 'Mobile GPU deleted successfully',
        color: 'green',
      });
      
      fetchGpusMobile();
    } catch (error) {
      console.error('Error deleting mobile GPU:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete mobile GPU',
        color: 'red',
      });
    }
  };

  const handleDeleteRam = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`https://emissionserver.vercel.app/admin/rams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      notifications.show({
        title: 'Success',
        message: 'RAM deleted successfully',
        color: 'green',
      });
      
      fetchRams();
    } catch (error) {
      console.error('Error deleting RAM:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete RAM',
        color: 'red',
      });
    }
  };

  // Helper functions for editing
  const handleEditCpu = (cpu: CPU) => {
    setEditingCpu(cpu);
    cpuForm.setValues(cpu);
    setCpuModalOpened(true);
  };

  const handleEditCpuMobile = (cpu: CPUMobile) => {
    setEditingCpuMobile(cpu);
    cpuMobileForm.setValues(cpu);
    setCpuMobileModalOpened(true);
  };

  const handleEditGpu = (gpu: GPU) => {
    setEditingGpu(gpu);
    gpuForm.setValues(gpu);
    setGpuModalOpened(true);
  };

  const handleEditGpuMobile = (gpu: GPUMobile) => {
    setEditingGpuMobile(gpu);
    gpuMobileForm.setValues(gpu);
    setGpuMobileModalOpened(true);
  };

  const handleEditRam = (ram: RAM) => {
    setEditingRam(ram);
    ramForm.setValues(ram);
    setRamModalOpened(true);
  };

  // Helper functions for adding new items
  const handleAddCpu = () => {
    setEditingCpu(null);
    cpuForm.reset();
    setCpuModalOpened(true);
  };

  const handleAddCpuMobile = () => {
    setEditingCpuMobile(null);
    cpuMobileForm.reset();
    setCpuMobileModalOpened(true);
  };

  const handleAddGpu = () => {
    setEditingGpu(null);
    gpuForm.reset();
    setGpuModalOpened(true);
  };

  const handleAddGpuMobile = () => {
    setEditingGpuMobile(null);
    gpuMobileForm.reset();
    setGpuMobileModalOpened(true);
  };

  const handleAddRam = () => {
    setEditingRam(null);
    ramForm.reset();
    setRamModalOpened(true);
  };

  // Filter functions
  const getFilteredCpus = () => {
    return cpus.filter(cpu => 
      cpu.manufacturer.toLowerCase().includes(cpuSearch.toLowerCase()) ||
      cpu.series.toLowerCase().includes(cpuSearch.toLowerCase()) ||
      cpu.model.toLowerCase().includes(cpuSearch.toLowerCase()) ||
      cpu.generation.toLowerCase().includes(cpuSearch.toLowerCase())
    );
  };

  const getFilteredCpusMobile = () => {
    return cpusMobile.filter(cpu => 
      cpu.generation.toLowerCase().includes(cpuMobileSearch.toLowerCase()) ||
      cpu.model.toLowerCase().includes(cpuMobileSearch.toLowerCase())
    );
  };

  const getFilteredGpus = () => {
    return gpus.filter(gpu => 
      gpu.manufacturer.toLowerCase().includes(gpuSearch.toLowerCase()) ||
      gpu.series.toLowerCase().includes(gpuSearch.toLowerCase()) ||
      gpu.model.toLowerCase().includes(gpuSearch.toLowerCase())
    );
  };

  const getFilteredGpusMobile = () => {
    return gpusMobile.filter(gpu => 
      gpu.manufacturer.toLowerCase().includes(gpuMobileSearch.toLowerCase()) ||
      gpu.model.toLowerCase().includes(gpuMobileSearch.toLowerCase())
    );
  };

  const getFilteredRams = () => {
    return rams.filter(ram => 
      ram.ddr_generation.toLowerCase().includes(ramSearch.toLowerCase())
    );
  };

  return (
    <AdminLayout>
      <Container size="xl" py="md">
        <Group align="apart" mb="lg">
          <Title order={2}>
            <Group>
              <IconDatabase size={32} />
              Device Maintenance
            </Group>
          </Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => {
              fetchCpus();
              fetchCpusMobile();
              fetchGpus();
              fetchGpusMobile();
              fetchRams();
            }}
          >
            Refresh All
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'cpus')}>
          <Tabs.List>
            <Tabs.Tab value="cpus" leftSection={<IconCpu size={16} />}>
              Desktop CPUs ({cpus.length})
            </Tabs.Tab>
            <Tabs.Tab value="cpus-mobile" leftSection={<IconCpu size={16} />}>
              Mobile CPUs ({cpusMobile.length})
            </Tabs.Tab>
            <Tabs.Tab value="gpus" leftSection={<IconDeviceGamepad2 size={16} />}>
              Desktop GPUs ({gpus.length})
            </Tabs.Tab>
            <Tabs.Tab value="gpus-mobile" leftSection={<IconDeviceGamepad2 size={16} />}>
              Mobile GPUs ({gpusMobile.length})
            </Tabs.Tab>
            <Tabs.Tab value="rams" leftSection={<IconDatabase size={16} />}>
              RAM Types ({rams.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Desktop CPUs Tab */}
          <Tabs.Panel value="cpus">
            <Paper withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Search CPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={cpuSearch}
                  onChange={(e) => setCpuSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddCpu}
                >
                  Add CPU
                </Button>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Manufacturer</Table.Th>
                    <Table.Th>Series</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>Generation</Table.Th>
                    <Table.Th>Avg Watt Usage</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredCpus().map((cpu) => (
                    <Table.Tr key={cpu.id}>
                      <Table.Td>{cpu.id}</Table.Td>
                      <Table.Td>{cpu.manufacturer}</Table.Td>
                      <Table.Td>{cpu.series}</Table.Td>
                      <Table.Td>{cpu.model}</Table.Td>
                      <Table.Td>{cpu.generation}</Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {cpu.avg_watt_usage}W
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditCpu(cpu)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteCpu(cpu.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {getFilteredCpus().length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No CPUs found
                </Text>
              )}
            </Paper>
          </Tabs.Panel>

          {/* Mobile CPUs Tab */}
          <Tabs.Panel value="cpus-mobile">
            <Paper withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Search mobile CPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={cpuMobileSearch}
                  onChange={(e) => setCpuMobileSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddCpuMobile}
                >
                  Add Mobile CPU
                </Button>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Generation</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>CPU Watts</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredCpusMobile().map((cpu) => (
                    <Table.Tr key={cpu.id}>
                      <Table.Td>{cpu.id}</Table.Td>
                      <Table.Td>{cpu.generation}</Table.Td>
                      <Table.Td>{cpu.model}</Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {cpu.cpu_watts}W
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditCpuMobile(cpu)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteCpuMobile(cpu.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {getFilteredCpusMobile().length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No mobile CPUs found
                </Text>
              )}
            </Paper>
          </Tabs.Panel>

          {/* Desktop GPUs Tab */}
          <Tabs.Panel value="gpus">
            <Paper withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Search GPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={gpuSearch}
                  onChange={(e) => setGpuSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddGpu}
                >
                  Add GPU
                </Button>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Manufacturer</Table.Th>
                    <Table.Th>Series</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>Avg Watt Usage</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredGpus().map((gpu) => (
                    <Table.Tr key={gpu.id}>
                      <Table.Td>{gpu.id}</Table.Td>
                      <Table.Td>{gpu.manufacturer}</Table.Td>
                      <Table.Td>{gpu.series}</Table.Td>
                      <Table.Td>{gpu.model}</Table.Td>
                      <Table.Td>
                        <Badge color="green" variant="light">
                          {gpu.avg_watt_usage}W
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditGpu(gpu)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteGpu(gpu.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {getFilteredGpus().length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No GPUs found
                </Text>
              )}
            </Paper>
          </Tabs.Panel>

          {/* Mobile GPUs Tab */}
          <Tabs.Panel value="gpus-mobile">
            <Paper withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Search mobile GPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={gpuMobileSearch}
                  onChange={(e) => setGpuMobileSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddGpuMobile}
                >
                  Add Mobile GPU
                </Button>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Manufacturer</Table.Th>
                    <Table.Th>Model</Table.Th>
                    <Table.Th>GPU Watts</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredGpusMobile().map((gpu) => (
                    <Table.Tr key={gpu.id}>
                      <Table.Td>{gpu.id}</Table.Td>
                      <Table.Td>{gpu.manufacturer}</Table.Td>
                      <Table.Td>{gpu.model}</Table.Td>
                      <Table.Td>
                        <Badge color="green" variant="light">
                          {gpu.gpu_watts}W
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditGpuMobile(gpu)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteGpuMobile(gpu.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {getFilteredGpusMobile().length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No mobile GPUs found
                </Text>
              )}
            </Paper>
          </Tabs.Panel>

          {/* RAM Types Tab */}
          <Tabs.Panel value="rams">
            <Paper withBorder p="md" mt="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Search RAM types..."
                  leftSection={<IconSearch size={16} />}
                  value={ramSearch}
                  onChange={(e) => setRamSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddRam}
                >
                  Add RAM Type
                </Button>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>DDR Generation</Table.Th>
                    <Table.Th>Voltage</Table.Th>
                    <Table.Th>Avg Watt Usage</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredRams().map((ram) => (
                    <Table.Tr key={ram.id}>
                      <Table.Td>{ram.id}</Table.Td>
                      <Table.Td>{ram.ddr_generation}</Table.Td>
                      <Table.Td>
                        <Badge color="orange" variant="light">
                          {ram.voltage}V
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="purple" variant="light">
                          {ram.avg_watt_usage}W
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditRam(ram)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteRam(ram.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {getFilteredRams().length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No RAM types found
                </Text>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>

        {/* CPU Modal */}
        <Modal
          opened={cpuModalOpened}
          onClose={() => {
            setCpuModalOpened(false);
            setEditingCpu(null);
            cpuForm.reset();
          }}
          title={editingCpu ? 'Edit CPU' : 'Add New CPU'}
          size="md"
        >
          <form onSubmit={cpuForm.onSubmit(handleCpuSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="Intel, AMD, etc."
              {...cpuForm.getInputProps('manufacturer')}
              mb="md"
              required
            />
            <TextInput
              label="Series"
              placeholder="Core i7, Ryzen 7, etc."
              {...cpuForm.getInputProps('series')}
              mb="md"
              required
            />
            <TextInput
              label="Model"
              placeholder="i7-12700K, Ryzen 7 5800X, etc."
              {...cpuForm.getInputProps('model')}
              mb="md"
              required
            />
            <TextInput
              label="Generation"
              placeholder="12th Gen, Zen 3, etc."
              {...cpuForm.getInputProps('generation')}
              mb="md"
              required
            />
            <NumberInput
              label="Average Watt Usage"
              placeholder="65"
              min={0}
              {...cpuForm.getInputProps('avg_watt_usage')}
              mb="md"
              required
            />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setCpuModalOpened(false);
                  setEditingCpu(null);
                  cpuForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCpu ? 'Update' : 'Create'}
              </Button>
            </Group>
          </form>
        </Modal>

        {/* Mobile CPU Modal */}
        <Modal
          opened={cpuMobileModalOpened}
          onClose={() => {
            setCpuMobileModalOpened(false);
            setEditingCpuMobile(null);
            cpuMobileForm.reset();
          }}
          title={editingCpuMobile ? 'Edit Mobile CPU' : 'Add New Mobile CPU'}
          size="md"
        >
          <form onSubmit={cpuMobileForm.onSubmit(handleCpuMobileSubmit)}>
            <TextInput
              label="Generation"
              placeholder="Apple M1, Snapdragon 888, etc."
              {...cpuMobileForm.getInputProps('generation')}
              mb="md"
              required
            />
            <TextInput
              label="Model"
              placeholder="M1 Pro, SD 888, etc."
              {...cpuMobileForm.getInputProps('model')}
              mb="md"
              required
            />
            <NumberInput
              label="CPU Watts"
              placeholder="10"
              min={0}
              {...cpuMobileForm.getInputProps('cpu_watts')}
              mb="md"
              required
            />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setCpuMobileModalOpened(false);
                  setEditingCpuMobile(null);
                  cpuMobileForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCpuMobile ? 'Update' : 'Create'}
              </Button>
            </Group>
          </form>
        </Modal>

        {/* GPU Modal */}
        <Modal
          opened={gpuModalOpened}
          onClose={() => {
            setGpuModalOpened(false);
            setEditingGpu(null);
            gpuForm.reset();
          }}
          title={editingGpu ? 'Edit GPU' : 'Add New GPU'}
          size="md"
        >
          <form onSubmit={gpuForm.onSubmit(handleGpuSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="NVIDIA, AMD, Intel"
              {...gpuForm.getInputProps('manufacturer')}
              mb="md"
              required
            />
            <TextInput
              label="Series"
              placeholder="GeForce RTX, Radeon RX, etc."
              {...gpuForm.getInputProps('series')}
              mb="md"
              required
            />
            <TextInput
              label="Model"
              placeholder="RTX 4090, RX 7900 XTX, etc."
              {...gpuForm.getInputProps('model')}
              mb="md"
              required
            />
            <NumberInput
              label="Average Watt Usage"
              placeholder="300"
              min={0}
              {...gpuForm.getInputProps('avg_watt_usage')}
              mb="md"
              required
            />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setGpuModalOpened(false);
                  setEditingGpu(null);
                  gpuForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGpu ? 'Update' : 'Create'}
              </Button>
            </Group>
          </form>
        </Modal>

        {/* Mobile GPU Modal */}
        <Modal
          opened={gpuMobileModalOpened}
          onClose={() => {
            setGpuMobileModalOpened(false);
            setEditingGpuMobile(null);
            gpuMobileForm.reset();
          }}
          title={editingGpuMobile ? 'Edit Mobile GPU' : 'Add New Mobile GPU'}
          size="md"
        >
          <form onSubmit={gpuMobileForm.onSubmit(handleGpuMobileSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="Apple, Qualcomm, etc."
              {...gpuMobileForm.getInputProps('manufacturer')}
              mb="md"
              required
            />
            <TextInput
              label="Model"
              placeholder="M1 GPU, Adreno 660, etc."
              {...gpuMobileForm.getInputProps('model')}
              mb="md"
              required
            />
            <NumberInput
              label="GPU Watts"
              placeholder="15"
              min={0}
              {...gpuMobileForm.getInputProps('gpu_watts')}
              mb="md"
              required
            />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setGpuMobileModalOpened(false);
                  setEditingGpuMobile(null);
                  gpuMobileForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGpuMobile ? 'Update' : 'Create'}
              </Button>
            </Group>
          </form>
        </Modal>

        {/* RAM Modal */}
        <Modal
          opened={ramModalOpened}
          onClose={() => {
            setRamModalOpened(false);
            setEditingRam(null);
            ramForm.reset();
          }}
          title={editingRam ? 'Edit RAM Type' : 'Add New RAM Type'}
          size="md"
        >
          <form onSubmit={ramForm.onSubmit(handleRamSubmit)}>
            <TextInput
              label="DDR Generation"
              placeholder="DDR4, DDR5, LPDDR5, etc."
              {...ramForm.getInputProps('ddr_generation')}
              mb="md"
              required
            />
            <NumberInput
              label="Voltage"
              placeholder="1.2"
              min={0}
              step={0.1}
              decimalScale={1}
              {...ramForm.getInputProps('voltage')}
              mb="md"
              required
            />
            <NumberInput
              label="Average Watt Usage"
              placeholder="3"
              min={0}
              {...ramForm.getInputProps('avg_watt_usage')}
              mb="md"
              required
            />
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setRamModalOpened(false);
                  setEditingRam(null);
                  ramForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRam ? 'Update' : 'Create'}
              </Button>
            </Group>
          </form>
        </Modal>
      </Container>
    </AdminLayout>
  );
};

export default DeviceMaintenance;
