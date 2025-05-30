import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import {
  Table,
  TextInput,
  ScrollArea,
  Text,
  Button,
  Modal,
  Group,
  Container,
  Title,
  Tabs,
  Select,
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
import axios from 'axios';
import styles from './AdminUsers.module.css'; // Reusing existing styles

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
  generation: string;
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

const DeviceMaintenance: React.FC = () => {
  const router = useRouter();
  
  // State for each component type
  const [cpus, setCpus] = useState<CPU[]>([]);
  const [cpusMobile, setCpusMobile] = useState<CPUMobile[]>([]);
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [gpusMobile, setGpusMobile] = useState<GPUMobile[]>([]);
  const [rams, setRams] = useState<RAM[]>([]);
  
  // Search states
  const [cpuSearch, setCpuSearch] = useState('');
  const [cpuMobileSearch, setCpuMobileSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [gpuMobileSearch, setGpuMobileSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');
  
  // Modal states
  const [cpuModalOpened, setCpuModalOpened] = useState(false);
  const [cpuMobileModalOpened, setCpuMobileModalOpened] = useState(false);
  const [gpuModalOpened, setGpuModalOpened] = useState(false);
  const [gpuMobileModalOpened, setGpuMobileModalOpened] = useState(false);
  const [ramModalOpened, setRamModalOpened] = useState(false);
  
  // Edit states
  const [editingCpu, setEditingCpu] = useState<CPU | null>(null);
  const [editingCpuMobile, setEditingCpuMobile] = useState<CPUMobile | null>(null);
  const [editingGpu, setEditingGpu] = useState<GPU | null>(null);
  const [editingGpuMobile, setEditingGpuMobile] = useState<GPUMobile | null>(null);
  const [editingRam, setEditingRam] = useState<RAM | null>(null);

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
      generation: '',
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

  // Fetch data functions
  const fetchCpus = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/admin/cpus');
      setCpus(response.data);
    } catch (error) {
      console.error('Error fetching CPUs:', error);
    }
  };

  const fetchCpusMobile = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/admin/cpus-mobile');
      setCpusMobile(response.data);
    } catch (error) {
      console.error('Error fetching mobile CPUs:', error);
    }
  };

  const fetchGpus = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/admin/gpus');
      setGpus(response.data);
    } catch (error) {
      console.error('Error fetching GPUs:', error);
    }
  };

  const fetchGpusMobile = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/admin/gpus-mobile');
      setGpusMobile(response.data);
    } catch (error) {
      console.error('Error fetching mobile GPUs:', error);
    }
  };

  const fetchRams = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/admin/rams');
      setRams(response.data);
    } catch (error) {
      console.error('Error fetching RAMs:', error);
    }
  };

  useEffect(() => {
    fetchCpus();
    fetchCpusMobile();
    fetchGpus();
    fetchGpusMobile();
    fetchRams();
  }, []);

  // Submit functions
  const handleCpuSubmit = async (values: typeof cpuForm.values) => {
    try {
      if (editingCpu) {
        await axios.put(`https://emission-mah2.onrender.com/admin/cpus/${editingCpu.id}`, values);
      } else {
        await axios.post('https://emission-mah2.onrender.com/admin/cpus', values);
      }
      fetchCpus();
      setCpuModalOpened(false);
      setEditingCpu(null);
      cpuForm.reset();
    } catch (error) {
      console.error('Error saving CPU:', error);
    }
  };

  const handleCpuMobileSubmit = async (values: typeof cpuMobileForm.values) => {
    try {
      if (editingCpuMobile) {
        await axios.put(`https://emission-mah2.onrender.com/admin/cpus-mobile/${editingCpuMobile.id}`, values);
      } else {
        await axios.post('https://emission-mah2.onrender.com/admin/cpus-mobile', values);
      }
      fetchCpusMobile();
      setCpuMobileModalOpened(false);
      setEditingCpuMobile(null);
      cpuMobileForm.reset();
    } catch (error) {
      console.error('Error saving mobile CPU:', error);
    }
  };

  const handleGpuSubmit = async (values: typeof gpuForm.values) => {
    try {
      if (editingGpu) {
        await axios.put(`https://emission-mah2.onrender.com/admin/gpus/${editingGpu.id}`, values);
      } else {
        await axios.post('https://emission-mah2.onrender.com/admin/gpus', values);
      }
      fetchGpus();
      setGpuModalOpened(false);
      setEditingGpu(null);
      gpuForm.reset();
    } catch (error) {
      console.error('Error saving GPU:', error);
    }
  };

  const handleGpuMobileSubmit = async (values: typeof gpuMobileForm.values) => {
    try {
      if (editingGpuMobile) {
        await axios.put(`https://emission-mah2.onrender.com/admin/gpus-mobile/${editingGpuMobile.id}`, values);
      } else {
        await axios.post('https://emission-mah2.onrender.com/admin/gpus-mobile', values);
      }
      fetchGpusMobile();
      setGpuMobileModalOpened(false);
      setEditingGpuMobile(null);
      gpuMobileForm.reset();
    } catch (error) {
      console.error('Error saving mobile GPU:', error);
    }
  };

  const handleRamSubmit = async (values: typeof ramForm.values) => {
    try {
      if (editingRam) {
        await axios.put(`https://emission-mah2.onrender.com/admin/rams/${editingRam.id}`, values);
      } else {
        await axios.post('https://emission-mah2.onrender.com/admin/rams', values);
      }
      fetchRams();
      setRamModalOpened(false);
      setEditingRam(null);
      ramForm.reset();
    } catch (error) {
      console.error('Error saving RAM:', error);
    }
  };

  // Delete functions
  const handleDeleteCpu = async (id: number) => {
    try {
      await axios.delete(`https://emission-mah2.onrender.com/admin/cpus/${id}`);
      fetchCpus();
    } catch (error) {
      console.error('Error deleting CPU:', error);
    }
  };

  const handleDeleteCpuMobile = async (id: number) => {
    try {
      await axios.delete(`https://emission-mah2.onrender.com/admin/cpus-mobile/${id}`);
      fetchCpusMobile();
    } catch (error) {
      console.error('Error deleting mobile CPU:', error);
    }
  };

  const handleDeleteGpu = async (id: number) => {
    try {
      await axios.delete(`https://emission-mah2.onrender.com/admin/gpus/${id}`);
      fetchGpus();
    } catch (error) {
      console.error('Error deleting GPU:', error);
    }
  };

  const handleDeleteGpuMobile = async (id: number) => {
    try {
      await axios.delete(`https://emission-mah2.onrender.com/admin/gpus-mobile/${id}`);
      fetchGpusMobile();
    } catch (error) {
      console.error('Error deleting mobile GPU:', error);
    }
  };

  const handleDeleteRam = async (id: number) => {
    try {
      await axios.delete(`https://emission-mah2.onrender.com/admin/rams/${id}`);
      fetchRams();
    } catch (error) {
      console.error('Error deleting RAM:', error);
    }
  };

  // Edit functions
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

  // Filter functions
  const filteredCpus = cpus.filter(cpu =>
    cpu.manufacturer.toLowerCase().includes(cpuSearch.toLowerCase()) ||
    cpu.model.toLowerCase().includes(cpuSearch.toLowerCase()) ||
    cpu.series.toLowerCase().includes(cpuSearch.toLowerCase())
  );

  const filteredCpusMobile = cpusMobile.filter(cpu =>
    cpu.model.toLowerCase().includes(cpuMobileSearch.toLowerCase()) ||
    cpu.generation.toLowerCase().includes(cpuMobileSearch.toLowerCase())
  );

  const filteredGpus = gpus.filter(gpu =>
    gpu.manufacturer.toLowerCase().includes(gpuSearch.toLowerCase()) ||
    gpu.model.toLowerCase().includes(gpuSearch.toLowerCase()) ||
    gpu.series.toLowerCase().includes(gpuSearch.toLowerCase())
  );

  const filteredGpusMobile = gpusMobile.filter(gpu =>
    gpu.manufacturer.toLowerCase().includes(gpuMobileSearch.toLowerCase()) ||
    gpu.model.toLowerCase().includes(gpuMobileSearch.toLowerCase())
  );

  const filteredRams = rams.filter(ram =>
    ram.ddr_generation.toLowerCase().includes(ramSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <Container size="xl" py="md">
        <Title order={2} mb="lg">Device Maintenance</Title>
        <Text c="dimmed" mb="xl">
          Manage hardware specifications for CPUs, GPUs, and RAM components
        </Text>

        <Tabs defaultValue="cpus" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="cpus" leftSection={<IconCpu size={16} />}>
              Desktop CPUs
            </Tabs.Tab>
            <Tabs.Tab value="cpus-mobile" leftSection={<IconCpu size={16} />}>
              Mobile CPUs
            </Tabs.Tab>
            <Tabs.Tab value="gpus" leftSection={<IconDeviceGamepad2 size={16} />}>
              Desktop GPUs
            </Tabs.Tab>
            <Tabs.Tab value="gpus-mobile" leftSection={<IconDeviceGamepad2 size={16} />}>
              Mobile GPUs
            </Tabs.Tab>            <Tabs.Tab value="rams" leftSection={<IconDatabase size={16} />}>
              RAM Types
            </Tabs.Tab>
          </Tabs.List>

          {/* Desktop CPUs Tab */}
          <Tabs.Panel value="cpus" pt="md">
            <Paper p="md" withBorder>
              <Flex justify="space-between" align="center" mb="md">
                <TextInput
                  placeholder="Search CPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={cpuSearch}
                  onChange={(e) => setCpuSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Group>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchCpus}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      setEditingCpu(null);
                      cpuForm.reset();
                      setCpuModalOpened(true);
                    }}
                  >
                    Add CPU
                  </Button>
                </Group>
              </Flex>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Manufacturer</Table.Th>
                      <Table.Th>Series</Table.Th>
                      <Table.Th>Model</Table.Th>
                      <Table.Th>Generation</Table.Th>
                      <Table.Th>Wattage</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredCpus.map((cpu) => (
                      <Table.Tr key={cpu.id}>
                        <Table.Td>{cpu.id}</Table.Td>
                        <Table.Td>{cpu.manufacturer}</Table.Td>
                        <Table.Td>{cpu.series}</Table.Td>
                        <Table.Td>{cpu.model}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{cpu.generation}</Badge>
                        </Table.Td>
                        <Table.Td>{cpu.avg_watt_usage}W</Table.Td>
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
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          {/* Mobile CPUs Tab */}
          <Tabs.Panel value="cpus-mobile" pt="md">
            <Paper p="md" withBorder>
              <Flex justify="space-between" align="center" mb="md">
                <TextInput
                  placeholder="Search Mobile CPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={cpuMobileSearch}
                  onChange={(e) => setCpuMobileSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Group>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchCpusMobile}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      setEditingCpuMobile(null);
                      cpuMobileForm.reset();
                      setCpuMobileModalOpened(true);
                    }}
                  >
                    Add Mobile CPU
                  </Button>
                </Group>
              </Flex>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Generation</Table.Th>
                      <Table.Th>Model</Table.Th>
                      <Table.Th>Wattage</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredCpusMobile.map((cpu) => (
                      <Table.Tr key={cpu.id}>
                        <Table.Td>{cpu.id}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{cpu.generation}</Badge>
                        </Table.Td>
                        <Table.Td>{cpu.model}</Table.Td>
                        <Table.Td>{cpu.cpu_watts}W</Table.Td>
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
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          {/* Desktop GPUs Tab */}
          <Tabs.Panel value="gpus" pt="md">
            <Paper p="md" withBorder>
              <Flex justify="space-between" align="center" mb="md">
                <TextInput
                  placeholder="Search GPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={gpuSearch}
                  onChange={(e) => setGpuSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Group>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchGpus}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      setEditingGpu(null);
                      gpuForm.reset();
                      setGpuModalOpened(true);
                    }}
                  >
                    Add GPU
                  </Button>
                </Group>
              </Flex>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Manufacturer</Table.Th>
                      <Table.Th>Series</Table.Th>
                      <Table.Th>Model</Table.Th>
                      <Table.Th>Generation</Table.Th>
                      <Table.Th>Wattage</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredGpus.map((gpu) => (
                      <Table.Tr key={gpu.id}>
                        <Table.Td>{gpu.id}</Table.Td>
                        <Table.Td>{gpu.manufacturer}</Table.Td>
                        <Table.Td>{gpu.series}</Table.Td>
                        <Table.Td>{gpu.model}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{gpu.generation}</Badge>
                        </Table.Td>
                        <Table.Td>{gpu.avg_watt_usage}W</Table.Td>
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
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          {/* Mobile GPUs Tab */}
          <Tabs.Panel value="gpus-mobile" pt="md">
            <Paper p="md" withBorder>
              <Flex justify="space-between" align="center" mb="md">
                <TextInput
                  placeholder="Search Mobile GPUs..."
                  leftSection={<IconSearch size={16} />}
                  value={gpuMobileSearch}
                  onChange={(e) => setGpuMobileSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Group>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchGpusMobile}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      setEditingGpuMobile(null);
                      gpuMobileForm.reset();
                      setGpuMobileModalOpened(true);
                    }}
                  >
                    Add Mobile GPU
                  </Button>
                </Group>
              </Flex>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Manufacturer</Table.Th>
                      <Table.Th>Model</Table.Th>
                      <Table.Th>Wattage</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredGpusMobile.map((gpu) => (
                      <Table.Tr key={gpu.id}>
                        <Table.Td>{gpu.id}</Table.Td>
                        <Table.Td>{gpu.manufacturer}</Table.Td>
                        <Table.Td>{gpu.model}</Table.Td>
                        <Table.Td>{gpu.gpu_watts}W</Table.Td>
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
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          {/* RAM Tab */}
          <Tabs.Panel value="rams" pt="md">
            <Paper p="md" withBorder>
              <Flex justify="space-between" align="center" mb="md">
                <TextInput
                  placeholder="Search RAM types..."
                  leftSection={<IconSearch size={16} />}
                  value={ramSearch}
                  onChange={(e) => setRamSearch(e.currentTarget.value)}
                  style={{ flex: 1, maxWidth: 300 }}
                />
                <Group>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchRams}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      setEditingRam(null);
                      ramForm.reset();
                      setRamModalOpened(true);
                    }}
                  >
                    Add RAM Type
                  </Button>
                </Group>
              </Flex>

              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>DDR Generation</Table.Th>
                      <Table.Th>Voltage</Table.Th>
                      <Table.Th>Avg Wattage</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredRams.map((ram) => (
                      <Table.Tr key={ram.id}>
                        <Table.Td>{ram.id}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{ram.ddr_generation}</Badge>
                        </Table.Td>
                        <Table.Td>{ram.voltage}V</Table.Td>
                        <Table.Td>{ram.avg_watt_usage}W</Table.Td>
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
              </ScrollArea>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        {/* Desktop CPU Modal */}
        <Modal
          opened={cpuModalOpened}
          onClose={() => {
            setCpuModalOpened(false);
            setEditingCpu(null);
            cpuForm.reset();
          }}
          title={editingCpu ? "Edit Desktop CPU" : "Add Desktop CPU"}
          size="md"
        >
          <form onSubmit={cpuForm.onSubmit(handleCpuSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="Intel, AMD, etc."
              required
              mb="sm"
              {...cpuForm.getInputProps('manufacturer')}
            />
            <TextInput
              label="Series"
              placeholder="Core i7, Ryzen 7, etc."
              required
              mb="sm"
              {...cpuForm.getInputProps('series')}
            />
            <TextInput
              label="Model"
              placeholder="i7-13700K, Ryzen 7 7700X, etc."
              required
              mb="sm"
              {...cpuForm.getInputProps('model')}
            />
            <TextInput
              label="Generation"
              placeholder="13th Gen, Zen 4, etc."
              required
              mb="sm"
              {...cpuForm.getInputProps('generation')}
            />
            <NumberInput
              label="Average Wattage"
              placeholder="65"
              required
              mb="lg"
              {...cpuForm.getInputProps('avg_watt_usage')}
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
                {editingCpu ? "Update" : "Add"}
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
          title={editingCpuMobile ? "Edit Mobile CPU" : "Add Mobile CPU"}
          size="md"
        >
          <form onSubmit={cpuMobileForm.onSubmit(handleCpuMobileSubmit)}>
            <TextInput
              label="Generation"
              placeholder="M1, M2, Snapdragon 8 Gen 2, etc."
              required
              mb="sm"
              {...cpuMobileForm.getInputProps('generation')}
            />
            <TextInput
              label="Model"
              placeholder="Apple M1, Snapdragon 8 Gen 2, etc."
              required
              mb="sm"
              {...cpuMobileForm.getInputProps('model')}
            />
            <NumberInput
              label="CPU Wattage"
              placeholder="15"
              required
              mb="lg"
              {...cpuMobileForm.getInputProps('cpu_watts')}
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
                {editingCpuMobile ? "Update" : "Add"}
              </Button>
            </Group>
          </form>
        </Modal>

        {/* Desktop GPU Modal */}
        <Modal
          opened={gpuModalOpened}
          onClose={() => {
            setGpuModalOpened(false);
            setEditingGpu(null);
            gpuForm.reset();
          }}
          title={editingGpu ? "Edit Desktop GPU" : "Add Desktop GPU"}
          size="md"
        >
          <form onSubmit={gpuForm.onSubmit(handleGpuSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="NVIDIA, AMD, Intel"
              required
              mb="sm"
              {...gpuForm.getInputProps('manufacturer')}
            />
            <TextInput
              label="Series"
              placeholder="GeForce RTX, Radeon RX, etc."
              required
              mb="sm"
              {...gpuForm.getInputProps('series')}
            />
            <TextInput
              label="Model"
              placeholder="RTX 4080, RX 7900 XTX, etc."
              required
              mb="sm"
              {...gpuForm.getInputProps('model')}
            />
            <TextInput
              label="Generation"
              placeholder="Ada Lovelace, RDNA 3, etc."
              required
              mb="sm"
              {...gpuForm.getInputProps('generation')}
            />
            <NumberInput
              label="Average Wattage"
              placeholder="320"
              required
              mb="lg"
              {...gpuForm.getInputProps('avg_watt_usage')}
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
                {editingGpu ? "Update" : "Add"}
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
          title={editingGpuMobile ? "Edit Mobile GPU" : "Add Mobile GPU"}
          size="md"
        >
          <form onSubmit={gpuMobileForm.onSubmit(handleGpuMobileSubmit)}>
            <TextInput
              label="Manufacturer"
              placeholder="NVIDIA, AMD, Intel, Apple"
              required
              mb="sm"
              {...gpuMobileForm.getInputProps('manufacturer')}
            />
            <TextInput
              label="Model"
              placeholder="RTX 4060 Mobile, M2 GPU, etc."
              required
              mb="sm"
              {...gpuMobileForm.getInputProps('model')}
            />
            <NumberInput
              label="GPU Wattage"
              placeholder="115"
              required
              mb="lg"
              {...gpuMobileForm.getInputProps('gpu_watts')}
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
                {editingGpuMobile ? "Update" : "Add"}
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
          title={editingRam ? "Edit RAM Type" : "Add RAM Type"}
          size="md"
        >
          <form onSubmit={ramForm.onSubmit(handleRamSubmit)}>
            <Select
              label="DDR Generation"
              placeholder="Select DDR generation"
              required
              mb="sm"
              data={[
                { value: 'DDR3', label: 'DDR3' },
                { value: 'DDR4', label: 'DDR4' },
                { value: 'DDR5', label: 'DDR5' },
                { value: 'LPDDR4', label: 'LPDDR4' },
                { value: 'LPDDR5', label: 'LPDDR5' },
              ]}
              {...ramForm.getInputProps('ddr_generation')}
            />
            <NumberInput
              label="Voltage"
              placeholder="1.35"
              step={0.1}
              decimalScale={2}
              required
              mb="sm"
              {...ramForm.getInputProps('voltage')}
            />
            <NumberInput
              label="Average Wattage"
              placeholder="5.0"
              step={0.1}
              decimalScale={1}
              required
              mb="lg"
              {...ramForm.getInputProps('avg_watt_usage')}
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
                {editingRam ? "Update" : "Add"}
              </Button>
            </Group>
          </form>
        </Modal>
      </Container>
    </AdminLayout>
  );
};

export default DeviceMaintenance;
