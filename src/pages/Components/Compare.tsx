import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Loader, Paper, Text, Transition, Collapse } from '@mantine/core';
import styles from './Compare.module.css';

const Compare = () => {
  interface Emission {
    deviceId: string;
    deviceType: string;
    carbonEmissions: number;
    specifications?: string[];
  }

  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const fetchEmissions = async () => {
    try {
      const response = await axios.get('https://emission-mah2.onrender.com/compare_devices', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setEmissions(response.data.emissions);
      setLoading(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching emissions:', error);
      setLoading(false);
    }
  };

  const handleStart = () => {
    setLoading(true);
    setShowResults(false);
    setTimeout(fetchEmissions, 5000);
  };

  const toggleDevice = (deviceId: string) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  return (
    <div className={styles.container}>
      <Paper className={styles.paper}>
        <Text className={styles.title}>Device Carbon Emissions Comparison</Text>
        <Text className={styles.note}>
          This will compare the carbon emissions of all devices in your account.
        </Text>
        <div className={styles.buttonContainer}>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? <Loader size="sm" /> : 'Start'}
          </Button>
        </div>
        <Transition mounted={showResults} transition="fade" duration={400}>
          {(transitionStyles) => (
            <div style={transitionStyles}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Device Type</th>
                    <th>Carbon Emissions (kg CO2)</th>
                  </tr>
                </thead>
                <tbody>
                  {emissions.map((emission) => (
                    <React.Fragment key={emission.deviceId}>
                      <tr onClick={() => toggleDevice(emission.deviceId)} style={{ cursor: 'pointer' }}>
                        <td>{emission.deviceId}</td>
                        <td>{emission.deviceType}</td>
                        <td>{emission.carbonEmissions.toFixed(4)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding: 0 }}>
                          <Collapse in={expandedDeviceId === emission.deviceId}>
                            <div style={{ padding: '10px 20px', background: '#f5f5f5' }}>
                              <Text fw={500} mb="xs">Specifications</Text>
                              {emission.specifications && emission.specifications.length > 0 ? (
                                <ul>
                                  {emission.specifications.map((spec, index) => (
                                    <li key={index}>{spec}</li>
                                  ))}
                                </ul>
                              ) : (
                                <Text size="sm">No specifications available</Text>
                              )}
                            </div>
                          </Collapse>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Transition>
      </Paper>
    </div>
  );
};

export default Compare;
