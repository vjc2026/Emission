import { useState, useEffect } from 'react';
import { Title, Text, TextInput, Button, Container, Group, Anchor, Center, Box, rem, Select } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import axios from 'axios';
import classes from './Proceed.module.css';

const DeviceForm: React.FC = () => {
  const router = useRouter();
  const { query } = router;
  
  const [device, setDevice] = useState<string | null>(null);
  const [cpu, setCpu] = useState('');
  const [gpu, setGpu] = useState('');
  const [ramType, setRamType] = useState('');
  const [ramCapacity, setRamCapacity] = useState('');
  const [motherboard, setMotherboard] = useState('');
  const [psu, setPsu] = useState('');
  
  const [cpuOptions, setCpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [gpuOptions, setGpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [ramOptions, setRamOptions] = useState<{ label: string; value: string }[]>([]);
  
  const { name, email, password, organization, profilePicturePreview } = query;
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    if (profilePicturePreview) {
      fetch(profilePicturePreview as string)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'profilePicture.jpg', { type: 'image/jpeg' });
          setProfilePicture(file);
        });
    }
  }, [profilePicturePreview]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Check the endpoint based on device selection
        const cpuEndpoint = device === 'Laptop' ? 'cpu-options-mobile' : 'cpu-options';
        console.log(`Fetching CPU options from: ${cpuEndpoint}`);
  
        const cpuResponse = await axios.get(`http://emission-811s.vercel.app/${cpuEndpoint}`);
        setCpuOptions(
          cpuResponse.data.cpuOptions.map((cpu: { label: string; value: string }) => ({
            label: cpu.label,
            value: cpu.value
          }))
        );
  
        // Fetch GPU options
        const gpuEndpoint = device === 'Laptop' ? 'gpu-options-mobile' : 'gpu-options';
        const gpuResponse = await axios.get(`http://emission-811s.vercel.app/${gpuEndpoint}`);
        setGpuOptions(
          gpuResponse.data.gpuOptions.map((gpu: { label: string; value: string }) => ({
            label: gpu.label,
            value: gpu.value
          }))
        );
  
        // Fetch RAM options
        const ramResponse = await axios.get('http://emission-811s.vercel.app/ram-options');
        setRamOptions(
          ramResponse.data.ramOptions.map((ram: { label: string; value: string }) => ({
            label: ram.label,
            value: ram.value
          }))
        );
  
        console.log("Options successfully fetched");
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
  
    if (device) {
      console.log(`Device selected: ${device}`);
      fetchOptions();
    }
  }, [device]); // Re-fetch options when the device changes
  
  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      if (name) formData.append('name', name as string);
      if (email) formData.append('email', email as string);
      if (password) formData.append('password', password as string);
      if (organization) formData.append('organization', organization as string);
      formData.append('device', device || '');
      formData.append('cpu', cpu);
      formData.append('gpu', gpu);
      formData.append('ram', ramType);  // Ensure this is the RAM type
      formData.append('capacity', `${ramCapacity}GB`);  // Send the capacity
      formData.append('motherboard', motherboard);
      formData.append('psu', psu);
      if (profilePicture) formData.append('profilePicture', profilePicture);

      const response = await axios.post('http://emission-811s.vercel.app/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        router.replace('/');
      } else {
        console.error('Error saving user data');
      }
    } catch (error) {
      console.error('Error during submission:', error);
    }
  };

  return (
    <div className={classes.container}>
      <Container size={480} my={30}>
        <Title ta="center" className={classes.heading} style={{ background: 'transparent' }}>
          {device ? `Device: ${device}` : 'Select your Device'}
        </Title>
        <Text c="dimmed" fz="sm" ta="center" style={{ color: 'white' }}>
          {device ? 'Enter your information below' : 'Choose a device type to continue'}
        </Text>

        <div className={classes.formContainer}>
          {!device ? (
            <Group ta="center" mt="md">
              <Button fullWidth size="md" onClick={() => setDevice('Personal Computer')} className={classes.button} color="green">
                Personal Computer
              </Button>
              <Button fullWidth size="md" onClick={() => setDevice('Laptop')} className={classes.button} color="green">
                Laptop
              </Button>
              <Anchor c="dimmed" size="sm" className={classes.control}>
                <Center inline>
                  <IconArrowLeft style={{ width: rem(12), color: 'white', height: rem(12) }} stroke={1.5} />
                  <Box onClick={() => router.push('/Register')} ml={5} style={{ color: 'white' }}>
                    Go Back
                  </Box>
                </Center>
              </Anchor>
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
                className={classes.inputField}
              />
              <Select
                label="GPU"
                placeholder="Select your GPU"
                value={gpu}
                onChange={(value) => setGpu(value || '')}
                data={gpuOptions}
                required
                mb="sm"
                className={classes.inputField}
              />
              <Select
                label="RAM Type"
                 placeholder="Select RAM type"
                 value={ramType}
                 onChange={(value) => setRamType(value || '')}
                 data={ramOptions}
                 required
                 mb="sm"
                 className={classes.inputField}
              />
              <TextInput
                 label="RAM Capacity (GB)"
                 placeholder="Enter RAM capacity"
                 value={ramCapacity}
                 onChange={(e) => setRamCapacity(e.currentTarget.value)}
                 required
                 mb="sm"
                 className={classes.inputField}
               />
              <TextInput
                label="Motherboard"
                placeholder="Motherboard"
                value={motherboard}
                onChange={(e) => setMotherboard(e.currentTarget.value)}
                required
                mb="sm"
                className={classes.inputField}
              />
              <TextInput
                label="PSU"
                placeholder="PSU"
                value={psu}
                onChange={(e) => setPsu(e.currentTarget.value)}
                required
                mb="lg"
                className={classes.inputField}
              />
                  <Anchor c="dimmed" size="sm" className={classes.control}>
                <Center inline>
                  <IconArrowLeft style={{ width: rem(12), color: 'white', height: rem(12) }} stroke={1.5} />
                <Box onClick={() => setDevice(null)} ml={5} style={{ color: 'white' }}>
                  Change Device
                </Box>
                </Center>
              </Anchor>
              <Button fullWidth mt="sm" onClick={handleSubmit} className={classes.button} color="green">
                Submit
              </Button>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default DeviceForm;
