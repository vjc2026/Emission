import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { IconChevronDown, IconChevronUp, IconSearch, IconSelector } from '@tabler/icons-react';
import {
  Center,
  Group,
  keys,
  ScrollArea,
  Table,
  Text,
  TextInput,
  UnstyledButton,
  Button, // Import Button component
  Modal, // Import Modal component
  Collapse, // Import Collapse component
} from '@mantine/core';
import classes from './AdminDashboard.module.css';

interface Project {
  id: number;
  project_name: string;
  project_description: string;
  status: string;
  stage: string;
  carbon_emit: number;
  session_duration: number;
  owner: string; // Owner email
  organization: string; // Add organization field
  members: string[]; // Add members field
  created_at: string; // Add created_at field
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group align="center" gap={0}>
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: Project[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toString().toLowerCase().includes(query))
  );
}

function sortData(
  data: Project[],
  payload: { sortBy: keyof Project | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return b[sortBy].toString().localeCompare(a[sortBy].toString());
      }

      return a[sortBy].toString().localeCompare(b[sortBy].toString());
    }),
    payload.search
  );
}

// Function to get CSS class based on status
const getStatusClass = (status: string) => {
  switch (status) {
    case 'In-Progress':
      return classes.statusInProgress;
    case 'Complete':
      return classes.statusComplete;
    case 'Archived': // Add case for Archived status
      return classes.statusArchived; // Apply red color class
    default:
      return '';
  }
};

// Function to format session duration
const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const fetchProjectMembers = async (projectId: number) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`http://localhost:5000/project_members/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.members.map((member: { name: string }) => member.name).join(', ');
  } catch (error) {
    console.error('Error fetching project members:', error);
    return 'Error fetching members';
  }
};

// Add a function to format the date nicely
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const AdminDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState<Project[]>([]);
  const [sortBy, setSortBy] = useState<keyof Project | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); // Add state for selected project
  const [isModalOpen, setIsModalOpen] = useState(false); // Add state for modal visibility
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null); // Add state for expanded project
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch('http://localhost:5000/all_user_projects_admin', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          // Redirect to login if token is invalid or expired
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const projectsWithMembers = await Promise.all(
          data.projects.map(async (project: Project) => {
            const members = await fetchProjectMembers(project.id);
            return { ...project, members };
          })
        );

        setProjects(projectsWithMembers);
        setSortedData(projectsWithMembers);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [router]);

  const setSorting = (field: keyof Project) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(projects, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(projects, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  // Function to handle project deletion
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://localhost:5000/admin/delete_project/${selectedProject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Remove the deleted project from the state
      setProjects(projects.filter(project => project.id !== selectedProject.id));
      setSortedData(sortedData.filter(project => project.id !== selectedProject.id));
      setSelectedProject(null); // Reset selected project
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error deleting project:', error);
    }
  };

  const toggleMembers = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const rows = sortedData.map((project) => (
    <React.Fragment key={project.id}>
      <Table.Tr
        onClick={() => setSelectedProject(project)}
        className={`${classes.projectRow} ${selectedProject?.id === project.id ? classes.selectedRow : ''}`} // Highlight selected project and apply cursor style
      >
        <Table.Td>{project.project_name}</Table.Td>
        <Table.Td>{project.project_description}</Table.Td>
        <Table.Td className={getStatusClass(project.status)}>{project.status}</Table.Td> {/* Apply color to status */}
        <Table.Td>{project.stage}</Table.Td>
        <Table.Td>{project.carbon_emit.toFixed(3)}</Table.Td>
        <Table.Td>{formatDuration(project.session_duration)}</Table.Td> {/* Format session duration */}
        <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.owner}</Table.Td> {/* Handle text overflow for owner */}
        <Table.Td>{project.organization}</Table.Td> {/* Display organization */}
        <Table.Td onClick={() => toggleMembers(project.id)} style={{ cursor: 'pointer' }}>
          {expandedProjectId === project.id ? 'Hide Members' : 'Show Members'}
        </Table.Td> {/* Toggle members dropdown */}
        <Table.Td>{formatDate(project.created_at)}</Table.Td> {/* Add created_at column */}
      </Table.Tr>
      <Table.Tr>
        <Table.Td colSpan={10} style={{ padding: 0 }}>
          <Collapse in={expandedProjectId === project.id}>
            <div style={{ padding: '10px 20px' }}>
              <Text fw={500} mb="xs">Members</Text> {/* Add Members header */}
              {project.members}
            </div>
          </Collapse>
        </Table.Td>
      </Table.Tr>
    </React.Fragment>
  ));

  return (
    <AdminLayout>
      <div>
        <h1>Admin Dashboard</h1>
        <h2>All Projects</h2>
        {error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <ScrollArea>
            <TextInput
              placeholder="Search by any field"
              mb="md"
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={search}
              onChange={handleSearchChange}
            />
            <Table className={classes.table} horizontalSpacing="md" verticalSpacing="xs" miw={700} layout="fixed">
              <Table.Tbody>
                <Table.Tr>
                  <Th
                    sorted={sortBy === 'project_name'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('project_name')}
                  >
                    Project Name
                  </Th>
                  <Th
                    sorted={sortBy === 'project_description'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('project_description')}
                  >
                    Description
                  </Th>
                  <Th
                    sorted={sortBy === 'status'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('status')}
                  >
                    Status
                  </Th>
                  <Th
                    sorted={sortBy === 'stage'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('stage')}
                  >
                    Stage
                  </Th>
                  <Th
                    sorted={sortBy === 'carbon_emit'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('carbon_emit')}
                  >
                    Carbon Emit
                  </Th>
                  <Th
                    sorted={sortBy === 'session_duration'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('session_duration')}
                  >
                    Session Duration
                  </Th>
                  <Th
                    sorted={sortBy === 'owner'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('owner')}
                  >
                    Owner
                  </Th> {/* Add owner email column */}
                  <Th
                    sorted={sortBy === 'organization'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('organization')}
                  >
                    Organization
                  </Th> {/* Add organization column */}
                  <Th
                    sorted={sortBy === 'members'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('members')}
                  >
                    Members
                  </Th> {/* Add members column */}
                  <Th 
                    sorted={sortBy === 'created_at'}
                    reversed={reverseSortDirection}
                    onSort={() => setSorting('created_at')}
                  >
                    Created At
                  </Th>
                </Table.Tr>
              </Table.Tbody>
              <Table.Tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={10}>
                      <Text fw={500} ta="center">
                        Nothing found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
        {selectedProject && (
          <>
            <Button color="red" onClick={() => setIsModalOpen(true)} style={{ marginTop: '20px' }}>
              Delete Selected Project
            </Button>
            <Modal
              opened={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Confirm Deletion"
            >
              <Text>Are you sure you want to delete this project?</Text>
              <Group align="apart" mt="md">
                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button color="red" onClick={handleDeleteProject}>Delete</Button>
              </Group>
            </Modal>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;