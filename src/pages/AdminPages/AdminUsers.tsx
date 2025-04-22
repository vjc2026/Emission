import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { Table, TextInput, ScrollArea, Text, Button, Modal, Group, PasswordInput, FileInput, Avatar, Tooltip, Center, Select, Paper, Container, Title, Badge, Divider } from '@mantine/core';
import { IconSearch, IconUserPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import axios from 'axios';
import styles from './AdminUsers.module.css';

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
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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

        const response = await fetch('https://localhost:5000/all_users', {
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
          axios.get(`https://localhost:5000/${cpuEndpoint}`),
          axios.get(`https://localhost:5000/${gpuEndpoint}`),
          axios.get('https://localhost:5000/ram-options'),
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

      const response = await fetch('https://localhost:5000/register', {
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

      const response = await fetch(`https://localhost:5000/delete_user/${userId}`, {
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

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await handleDeleteUser(userToDelete.id);
      setDeleteModalOpened(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <AdminLayout>
      <Container size="xl" className={styles.container}>
        <div className={styles.header}>
          <Title className={styles.title}>User Management</Title>
        </div>

        <Paper className={styles.searchContainer}>
          <Group justify="space-between">
            <TextInput
              placeholder="Search users..."
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              style={{ flexGrow: 1, maxWidth: 400 }}
            />
            <Button
              leftSection={<IconUserPlus size={16} />}
              className={styles.createButton}
              onClick={() => setModalOpened(true)}
            >
              Create User
            </Button>
          </Group>
        </Paper>

        <Paper className={styles.tableContainer}>
          <ScrollArea>
            <Table horizontalSpacing="md" verticalSpacing="sm" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Badge variant="light">{user.id}</Badge>
                      </Table.Td>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>{user.organization}</Table.Td>
                      <Table.Td>
                        <Group justify="center" gap="xs">
                          <Button
                            className={styles.deleteButton}
                            size="sm"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => openDeleteModal(user)}
                          >
                            Delete
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text fw={500} ta="center" c="dimmed">
                        No users found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={<Text size="lg" fw={600}>Create New User</Text>}
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <div className={styles.formSection}>
              <Center mb="md">
                <Tooltip label="Upload Profile Picture" withArrow position="top">
                  <div
                    className={styles.avatar}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Avatar
                      size={120}
                      radius={120}
                      src={profilePicturePreview}
                      alt="Profile Picture"
                      style={{ border: '2px solid #228BE6' }}
                    >
                      <IconUpload size={36} />
                    </Avatar>
                    <FileInput
                      id="file-input"
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

              <Group grow>
                <TextInput
                  label="Name"
                  placeholder="Enter full name"
                  {...form.getInputProps('name')}
                  required
                />
                <TextInput
                  label="Email"
                  placeholder="email@example.com"
                  {...form.getInputProps('email')}
                  required
                />
              </Group>

              <Group grow mt="md">
                <PasswordInput
                  label="Password"
                  placeholder="Min. 8 characters"
                  {...form.getInputProps('password')}
                  required
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Repeat password"
                  {...form.getInputProps('confirmPassword')}
                  required
                />
              </Group>

              <TextInput
                label="Organization"
                placeholder="Enter organization name"
                {...form.getInputProps('organization')}
                required
                mt="md"
              />
            </div>

            <Divider label="Device Specifications" labelPosition="center" my="lg" />

            <div className={styles.formSection}>
              <Select
                label="Device Type"
                placeholder="Select device type"
                value={device}
                onChange={setDevice}
                data={[
                  { label: 'Personal Computer', value: 'Personal Computer' },
                  { label: 'Laptop', value: 'Laptop' },
                ]}
                required
              />

              {device && (
                <Group grow mt="md">
                  <Select
                    label="CPU"
                    placeholder="Select CPU"
                    {...form.getInputProps('cpu')}
                    data={cpuOptions}
                    required
                  />
                  <Select
                    label="GPU"
                    placeholder="Select GPU"
                    {...form.getInputProps('gpu')}
                    data={gpuOptions}
                    required
                  />
                </Group>
              )}

              {device && (
                <>
                  <Group grow mt="md">
                    <Select
                      label="RAM Type"
                      placeholder="Select RAM type"
                      {...form.getInputProps('ramType')}
                      data={ramOptions}
                      required
                    />
                    <TextInput
                      label="RAM Capacity (GB)"
                      placeholder="Enter capacity"
                      {...form.getInputProps('ramCapacity')}
                      required
                    />
                  </Group>

                  <Group grow mt="md">
                    <TextInput
                      label="Motherboard"
                      placeholder="Enter motherboard model"
                      {...form.getInputProps('motherboard')}
                      required
                    />
                    <TextInput
                      label="Power Supply Unit"
                      placeholder="Enter PSU details"
                      {...form.getInputProps('psu')}
                      required
                    />
                  </Group>
                </>
              )}
            </div>

            <Group justify="flex-end" mt="xl">
              <Button variant="light" onClick={() => setModalOpened(false)}>Cancel</Button>
              <Button type="submit" className={styles.createButton}>Create User</Button>
            </Group>
          </form>
        </Modal>

        <Modal
          opened={deleteModalOpened}
          onClose={() => setDeleteModalOpened(false)}
          title={<Text size="lg" fw={600} c="red">Delete User</Text>}
          size="sm"
        >
          <Text size="sm" mb="lg">
            Are you sure you want to delete user <Text span fw={600}>{userToDelete?.name}</Text>? 
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={() => setDeleteModalOpened(false)}>
              Cancel
            </Button>
            <Button 
              color="red"
              onClick={handleDeleteConfirm}
              leftSection={<IconTrash size={16} />}
            >
              Delete User
            </Button>
          </Group>
        </Modal>
      </Container>
    </AdminLayout>
  );
};

export default AdminUsers;