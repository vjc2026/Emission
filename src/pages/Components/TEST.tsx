import React, { useState, useEffect, useRef } from 'react';
import { Container, Text, Button, Title, Loader, Stack } from '@mantine/core';
import { Chart, registerables } from 'chart.js'; // Import registerables
import styles from './History.module.css';
import { useNavigate } from 'react-router-dom';

// Register the required components
Chart.register(...registerables);

const Details: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [emissionsData, setEmissionsData] = useState<any[]>([]);
  const chartRef = useRef<Chart | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmissionsData = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await fetch('http://localhost:5000/carbon-emissions', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched emissions data:', data); // Debug log
          setEmissionsData(data.emissions);
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
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['2 Days Ago', 'Yesterday', 'Today'], // Labels for the last 3 days
          datasets: [
            {
              label: 'Emissions',
              data: emissionsData.map(d => d.total_emissions),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
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
  }, [emissionsData]);

  return (
    <Container className={styles.container}>
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
        <Stack mt="md">
          <canvas id="emissionsChart"></canvas>
        </Stack>
      )}
    </Container>
  );
};

export default Details;
