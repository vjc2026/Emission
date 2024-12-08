import React, { useState, useEffect, useRef } from 'react';
import { Container, Text, Title, Loader, Stack, Card, Group, Divider } from '@mantine/core';
import { Chart, registerables } from 'chart.js';
import styles from './History.module.css';

// Register the required components
Chart.register(...registerables);

type EmissionData = {
  project_name: string;
  total_emissions: number;
};

const Details: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [emissionsData, setEmissionsData] = useState<EmissionData[]>([]);
  const chartRef = useRef<Chart | null>(null);
  const [highestEmission, setHighestEmission] = useState<number | null>(null);
  const [lowestEmission, setLowestEmission] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmissionsData = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await fetch('http://localhost:5000/all_user_projects', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched emissions data:', data); // Debug log
          setEmissionsData(data.projects);

          // Calculate highest and lowest emissions
          if (data.projects.length > 0) {
            const emissions: number[] = data.projects.map((d: EmissionData) => d.total_emissions);
            setHighestEmission(Math.max(...emissions));
            setLowestEmission(Math.min(...emissions));
          } else {
            setHighestEmission(null);
            setLowestEmission(null);
          }
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch carbon emissions data.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching carbon emissions data.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmissionsData();
  }, []);

  useEffect(() => {
    if (emissionsData.length > 0) {
      console.log('Emissions data for chart:', emissionsData); // Debug log
      const ctx = document.getElementById('emissionsChart') as HTMLCanvasElement;
      if (ctx) {
        if (chartRef.current) {
          chartRef.current.destroy();
        }
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: emissionsData.map(d => d.project_name), // Use project names as labels
            datasets: [
              {
                label: 'Emissions',
                data: emissionsData.map(d => d.total_emissions),
                backgroundColor: emissionsData.map((_, index) => `rgba(${75 + index * 20}, 192, 192, 0.2)`),
                borderColor: emissionsData.map((_, index) => `rgba(${75 + index * 20}, 192, 192, 1)`),
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    }
  }, [emissionsData]);

  return (
    <Container>
      <Title order={1} className={styles.title}>
        Carbon Emissions Comparison
      </Title>

      {error && (
        <Text className={styles.errorText} color='red'>
          {error}
        </Text>
      )}

      {loading ? (
        <Loader size="lg" style={{ display: 'block', margin: '0 auto' }} />
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack mt="md">
            <canvas id="emissionsChart"></canvas>
            <Divider my="sm" />
            <Group align="apart">
              {highestEmission !== null && (
                <Text fw={500}>Highest Emission: {highestEmission.toFixed(2)} kg CO2e</Text>
              )}
              {lowestEmission !== null && (
                <Text fw={500}>Lowest Emission: {lowestEmission.toFixed(2)} kg CO2e</Text>
              )}
            </Group>
          </Stack>
        </Card>
      )}
    </Container>
  );
};

export default Details;
