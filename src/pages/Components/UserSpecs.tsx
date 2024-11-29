import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Text, 
  LoadingOverlay, 
  Alert, 
  Group, 
  SimpleGrid, 
  Container, 
  Title, 
  Space, 
  Chip
} from '@mantine/core';
import axios from 'axios';

interface UserSpecs {
  cpu: string;
  gpu: string;
}

interface UsageInfo {
  avg: number | null;
}

const UserSpecs: React.FC = () => {
  const [userSpecs, setUserSpecs] = useState<UserSpecs | null>(null);
  const [cpuUsage, setCpuUsage] = useState<UsageInfo>({ avg: null });
  const [gpuUsage, setGpuUsage] = useState<UsageInfo>({ avg: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSpecs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const userResponse = await axios.get('https://emissionsense-server.onrender.com/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const specs = userResponse.data.user;
        setUserSpecs(specs);

        // Set avg watt usage if available
        setCpuUsage({ avg: specs.cpu_avg_watt_usage });
        setGpuUsage({ avg: specs.gpu_avg_watt_usage });
        
      } catch (err) {
        console.error('Error fetching user specs:', err);
        setError('Error fetching user specs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSpecs();
  }, []);

  if (loading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return <Alert title="Error" color="red">{error}</Alert>;
  }

  return (
    <Container pt={20}>
      <Title>Your Hardware Specs & Energy Efficiency</Title>
      <Space h="lg" />
      <SimpleGrid cols={2}>
        <Card shadow="sm" p="lg">
          <Group align="apart" mb="lg">
            <Text fw={500}>CPU</Text>
          </Group>
          <Text><strong>Model:</strong> {userSpecs?.cpu || 'N/A'}</Text>
          <Text><strong>Avg. Watt Usage:</strong> {cpuUsage.avg ?? 'N/A'} W</Text>
        </Card>
        <Card shadow="sm" p="lg">
          <Group align="apart" mb="lg">
            <Text fw={500}>GPU</Text>
          </Group>
          <Text><strong>Model:</strong> {userSpecs?.gpu || 'N/A'}</Text>
          <Text><strong>Avg. Watt Usage:</strong> {gpuUsage.avg ?? 'N/A'} W</Text>
        </Card>
      </SimpleGrid>
      <Space h="lg" />
    </Container>
  );
};

export default UserSpecs;
