import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { Table, TextInput, ScrollArea, Text, Button, Modal, Group, PasswordInput, FileInput, Avatar, Tooltip, Center, Select } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import axios from 'axios';

const AdminUsers: React.FC = () => {
  interface User {
    id: string;
    name: string;
    email: string;
    organization: string;
  }
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);
  const [cpuOptions, setCpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [gpuOptions, setGpuOptions] = useState<{ label: string; value: string }[]>([]);
  const [ramOptions, setRamOptions] = useState<{ label: string; value: string }[]>([]);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      organization: '',
      profilePicture: null as File | null,
      cpu: '',
      gpu: '',
      ramType: '',
      ramCapacity: '',
      motherboard: '',
      psu: '',
    },
    validate: {
      email: (value) => (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 8 ? null : 'Password must be at least 8 characters'),
      confirmPassword: (value, values) => (value === values.password ? null : 'Passwords do not match'),
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch('http://localhost:5000/all_users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFilteredUsers(
      users.filter(user =>
        Object.values(user).some(value =>
          value.toString().toLowerCase().includes(query)
        )
      )
    );
  }, [search, users]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const cpuEndpoint = device === 'Laptop' ? 'cpu-options-mobile' : 'cpu-options';
        const gpuEndpoint = device === 'Laptop' ? 'gpu-options-mobile' : 'gpu-options';

        const [cpuResponse, gpuResponse, ramResponse] = await Promise.all([
          axios.get(`http://localhost:5000/${cpuEndpoint}`),
          axios.get(`http://localhost:5000/${gpuEndpoint}`),
          axios.get('http://localhost:5000/ram-options'),
        ]);

        setCpuOptions(cpuResponse.data.cpuOptions);
        setGpuOptions(gpuResponse.data.gpuOptions);
        setRamOptions(ramResponse.data.ramOptions);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    if (device) {
      fetchOptions();
    }
  }, [device]);

  const handleProfilePictureChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePicturePreview(null);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('organization', values.organization);
      formData.append('device', device || '');
      formData.append('cpu', values.cpu);
      formData.append('gpu', values.gpu);
      formData.append('ram', values.ramType);
      formData.append('capacity', `${values.ramCapacity}GB`);
      formData.append('motherboard', values.motherboard);
      formData.append('psu', values.psu);
      if (values.profilePicture) {
        formData.append('profilePicture', values.profilePicture);
      }

      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const newUser = await response.json();
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setFilteredUsers((prevUsers) => [...prevUsers, newUser]);
      setModalOpened(false);
      form.reset();
      setProfilePicturePreview(null);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://localhost:5000/delete_user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setFilteredUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1>Admin Users</h1>
        <Group align="apart" mb="md">
          <TextInput
            placeholder="Search by any field"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Button onClick={() => setModalOpened(true)}>Create User</Button>
        </Group>
        <ScrollArea>
          <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout="fixed">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Organization</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>{user.id}</Table.Td>
                    <Table.Td>{user.name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>{user.organization}</Table.Td>
                    <Table.Td>
                      <Button color="red" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text fw={500} ta="center">
                      Nothing found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Create User"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Name"
              placeholder="Enter your name"
              {...form.getInputProps('name')}
              required
            />
            <TextInput
              label="Email"
              placeholder="Enter your email"
              {...form.getInputProps('email')}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              {...form.getInputProps('password')}
              required
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat your password"
              {...form.getInputProps('confirmPassword')}
              required
            />
            <TextInput
              label="Organization"
              placeholder="Enter your organization"
              {...form.getInputProps('organization')}
              required
            />
            <Text>Customize Profile Picture (optional)</Text>
            <Center>
              <Tooltip label="Input Profile Picture" withArrow position="top">
                <div
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Avatar
                    size={120}
                    radius={120}
                    src={profilePicturePreview}
                    alt="Profile Picture"
                    style={{ border: '2px solid white' }}
                  />
                  <FileInput
                    id="file-input"
                    label="Profile Picture"
                    placeholder="Upload your profile picture"
                    onChange={(file: File | null) => {
                      form.setFieldValue('profilePicture', file);
                      handleProfilePictureChange(file);
                    }}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </Tooltip>
            </Center>
            <Select
              label="Device"
              placeholder="Select device type"
              value={device}
              onChange={setDevice}
              data={[
                { label: 'Personal Computer', value: 'Personal Computer' },
                { label: 'Laptop', value: 'Laptop' },
              ]}
              required
              mb="sm"
            />
            {device && (
              <>
                <Select
                  label="CPU"
                  placeholder="Select your CPU"
                  {...form.getInputProps('cpu')}
                  data={cpuOptions}
                  required
                  mb="sm"
                />
                <Select
                  label="GPU"
                  placeholder="Select your GPU"
                  {...form.getInputProps('gpu')}
                  data={gpuOptions}
                  required
                  mb="sm"
                />
                <Select
                  label="RAM Type"
                  placeholder="Select RAM type"
                  {...form.getInputProps('ramType')}
                  data={ramOptions}
                  required
                  mb="sm"
                />
                <TextInput
                  label="RAM Capacity (GB)"
                  placeholder="Enter RAM capacity"
                  {...form.getInputProps('ramCapacity')}
                  required
                  mb="sm"
                />
                <TextInput
                  label="Motherboard"
                  placeholder="Enter motherboard"
                  {...form.getInputProps('motherboard')}
                  required
                  mb="sm"
                />
                <TextInput
                  label="PSU"
                  placeholder="Enter PSU"
                  {...form.getInputProps('psu')}
                  required
                  mb="sm"
                />
              </>
            )}
            <Group align="right" mt="md">
              <Button type="submit">Create</Button>
            </Group>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;