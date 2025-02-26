import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { IconSearch, IconChevronUp, IconChevronDown, IconSelector, IconPlus, IconTrash, IconEdit, IconX } from '@tabler/icons-react';
import {
  Badge,
  Modal,
  Button,
  Group,
  Text,
  TextInput,
  ScrollArea,
  Collapse,
  Table,
  UnstyledButton,
  Center,
  Select,
  Textarea,
  Paper
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
  stage_duration?: number;  // Add optional fields for timeline
  stage_start_date?: string;
  stage_due_date?: string;
  project_start_date?: string;
  project_due_date?: string;
  carbonEmit?: number;
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
    data.length > 0 && Object.keys(data[0]).some((key) => item[key as keyof Project]?.toString().toLowerCase().includes(query))
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
        return (b[sortBy]?.toString() ?? '').localeCompare(a[sortBy]?.toString() ?? '');
      }

      return (a[sortBy]?.toString() ?? '').localeCompare(b[sortBy]?.toString() ?? '');
    }),
    payload.search
  );
}

// Function to get CSS class based on status
const getStatusClass = (status: string) => {
  switch (status) {
    case 'In Progress':
      return classes.statusInProgress;
    case 'Complete':
      return classes.statusComplete;
    case 'Archived':
      return classes.statusArchived;
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
    // Ensure we're returning an array of strings
    return Array.isArray(data.members) ? data.members.map((member: { name: string, email: string }) => member.email) : [];
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
};

// Add a function to format the date nicely
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const renderAssignees = (members: string[] | undefined) => {
  if (!members || !Array.isArray(members)) return null;
  const displayedMembers = members.slice(0, 3);

  return (
    <div className={classes.assignees}>
      {displayedMembers.map((member, index) => (
        <div key={index} className={classes.assignee}>
          <img 
            src={`https://www.gravatar.com/avatar/${member}?d=identicon`}
            alt={member}
            className={classes.assigneeAvatar}
          />
          <span>{member.includes('@') ? member.split('@')[0] : member}</span>
        </div>
      ))}
    </div>
  );
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Add state for edit modal visibility
  const [editTitle, setEditTitle] = useState(''); // Add state for edit title
  const [editDescription, setEditDescription] = useState(''); // Add state for edit description
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Add state for create modal visibility
  const [newProject, setNewProject] = useState({
    project_name: '',
    project_description: '',
    status: 'In Progress',
    stage: 'Design: Creating the software architecture',
    carbon_emit: 0,
    session_duration: 0,
    owner: '',
    organization: '', // This will be set automatically based on owner
    members: [] as string[],
    created_at: new Date().toISOString(),
  });
  const [newProjectAssignee, setNewProjectAssignee] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState(''); // Add state for assignee email
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

  const calculateProgress = (project: Project) => {
    // Assuming each stage has equal weight
    const stages = [
      'Design: Creating the software architecture',
      'Development: Writing the actual code',
      'Testing: Ensuring the software works as expected'
    ];
    
    const currentStageIndex = stages.indexOf(project.stage);
    if (currentStageIndex === -1) return 0;
    
    return ((currentStageIndex + 1) / stages.length) * 100;
  };

  const closePanel = () => {
    setSelectedProject(null);
  };

  // Function to handle opening the edit modal
  const handleEditProject = () => {
    if (selectedProject) {
      setEditTitle(selectedProject.project_name);
      setEditDescription(selectedProject.project_description);
      setIsEditModalOpen(true);
    }
  };

  // Function to handle saving the edited project
  const handleSaveEdit = () => {
    if (selectedProject) {
      const updatedProject = {
        ...selectedProject,
        project_name: editTitle,
        project_description: editDescription,
      };

      setProjects(projects.map(project => project.id === selectedProject.id ? updatedProject : project));
      setSortedData(sortedData.map(project => project.id === selectedProject.id ? updatedProject : project));
      setSelectedProject(updatedProject);
      setIsEditModalOpen(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // First, fetch the owner's organization
      const ownerResponse = await fetch(`http://localhost:5000/user_organization/${newProject.owner}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!ownerResponse.ok) {
        throw new Error(`Error fetching owner organization: ${ownerResponse.status}`);
      }

      const ownerData = await ownerResponse.json();
      const ownerOrganization = ownerData.organization;

      // Create project with the owner's organization
      const projectToCreate = {
        ...newProject,
        organization: ownerOrganization,
        members: [...newProject.members],
      };

      const response = await fetch('http://localhost:5000/admin/create_project', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectToCreate),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const createdProject = await response.json();
      setProjects([...projects, createdProject]);
      setSortedData([...projects, createdProject]);
      setIsCreateModalOpen(false);
      
      // Reset form
      setNewProject({
        project_name: '',
        project_description: '',
        status: 'In Progress',
        stage: 'Design: Creating the software architecture',
        carbon_emit: 0,
        session_duration: 0,
        owner: '',
        organization: '',
        members: [],
        created_at: new Date().toISOString(),
      });
      setNewProjectAssignee('');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error creating project:', error);
    }
  };

  const handleAddAssignee = async () => {
    if (selectedProject && assigneeEmail) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch('http://localhost:5000/add_project_member', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: selectedProject.id,
            userEmail: assigneeEmail,
            role: 'member',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add member');
        }

        const data = await response.json();
        
        const updatedProject = {
          ...selectedProject,
          members: data.members.map((member: { email: string }) => member.email)
        };

        setProjects(projects.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
        setSortedData(sortedData.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
        setSelectedProject(updatedProject);
        setAssigneeEmail('');
      } catch (error) {
        console.error('Error adding assignee:', error);
        alert(error instanceof Error ? error.message : "An error occurred");
      }
    }
  };

  const handleAddNewProjectAssignee = () => {
    if (newProjectAssignee && !newProject.members.includes(newProjectAssignee)) {
      setNewProject({
        ...newProject,
        members: [...newProject.members, newProjectAssignee]
      });
      setNewProjectAssignee('');
    }
  };

  const rows = sortedData.map((project) => (
    <React.Fragment key={project.id}>
      <tr 
        onClick={() => setSelectedProject(project)}
        className={`${classes.projectRow} ${selectedProject?.id === project.id ? classes.selectedRow : ''}`}
      >
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '6px',
              background: `hsl(${project.id * 40}, 70%, 90%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '500',
              color: `hsl(${project.id * 40}, 70%, 30%)`
            }}>
              {project.project_name.charAt(0).toUpperCase()}
            </div>
            {project.project_name}
          </div>
        </td>
        <td>
          <div style={{ 
            maxWidth: '200px', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {project.project_description}
          </div>
        </td>
        <td>
          <Badge 
            variant="light"
            radius="sm"
            size="lg"
            color={
              project.status === 'Complete' ? 'blue' :
              project.status === 'Archived' ? 'gray' :
              'green'
            }
          >
            {project.status}
          </Badge>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: project.stage.includes('Design') ? '#22c55e' :
                        project.stage.includes('Development') ? '#3b82f6' :
                        '#a855f7'
            }} />
            {project.stage}
          </div>
        </td>
        <td>
          <div className={classes.progressBar}>
            <div 
              className={classes.progressFill} 
              style={{ 
                width: `${calculateProgress(project)}%`,
                backgroundColor: project.status === 'Complete' ? '#3b82f6' : '#22c55e'
              }} 
            />
            <span>{Math.round(calculateProgress(project))}%</span>
          </div>
        </td>
        <td>{formatDuration(project.session_duration)}</td>
        <td>
          <Text size="sm" fw={500} color={project.carbon_emit > 10 ? 'red' : 'green'}>
            {project.carbon_emit.toFixed(2)} kg CO2
          </Text>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={`https://www.gravatar.com/avatar/${project.owner}?d=identicon&s=24`}
              alt={project.owner}
              style={{ borderRadius: '50%', width: '24px', height: '24px' }}
            />
            {project.owner}
          </div>
        </td>
        <td>
          <Badge variant="dot" color="gray">
            {project.organization}
          </Badge>
        </td>
        <td>{formatDate(project.created_at)}</td>
      </tr>
    </React.Fragment>
  ));

  return (
    <AdminLayout>
      <div className={classes.container}>
        <div className={classes.header}>
          <Group>
            <h1>Admin Dashboard</h1>
            <Badge size="lg" variant="dot" color="blue">
              {projects.length} Projects
            </Badge>
          </Group>
          <Group>
            <TextInput
              placeholder="Search by any field"
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={search}
              onChange={handleSearchChange}
              style={{ width: '300px' }}
            />
            <Button 
              onClick={() => setIsCreateModalOpen(true)} 
              variant="gradient" 
              gradient={{ from: 'indigo', to: 'cyan' }}
              leftSection={<IconPlus size={16} />}
            >
              Create Project
            </Button>
          </Group>
        </div>

        <ScrollArea>
          <Table className={classes.taskTable}>
            <thead>
              <tr>
                <Th sorted={sortBy === 'project_name'} reversed={reverseSortDirection} onSort={() => setSorting('project_name')}>Project Name</Th>
                <Th sorted={sortBy === 'project_description'} reversed={reverseSortDirection} onSort={() => setSorting('project_description')}>Description</Th>
                <Th sorted={sortBy === 'status'} reversed={reverseSortDirection} onSort={() => setSorting('status')}>Status</Th>
                <Th sorted={sortBy === 'stage'} reversed={reverseSortDirection} onSort={() => setSorting('stage')}>Stage</Th>
                <Th sorted={false} reversed={false} onSort={() => {}}>Progress</Th>
                <Th sorted={sortBy === 'session_duration'} reversed={reverseSortDirection} onSort={() => setSorting('session_duration')}>Duration</Th>
                <Th sorted={sortBy === 'carbon_emit'} reversed={reverseSortDirection} onSort={() => setSorting('carbon_emit')}>Carbon Emissions</Th>
                <Th sorted={sortBy === 'owner'} reversed={reverseSortDirection} onSort={() => setSorting('owner')}>Owner</Th>
                <Th sorted={sortBy === 'organization'} reversed={reverseSortDirection} onSort={() => setSorting('organization')}>Organization</Th>
                <Th sorted={sortBy === 'created_at'} reversed={reverseSortDirection} onSort={() => setSorting('created_at')}>Created At</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <tr>
                  <td colSpan={11}>
                    <Text fw={500} ta="center">
                      Nothing found
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </ScrollArea>

        {selectedProject && (
          <div className={classes.panel}>
            <div className={classes.panelHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px',
                  background: `hsl(${selectedProject.id * 40}, 70%, 90%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '500',
                  color: `hsl(${selectedProject.id * 40}, 70%, 30%)`
                }}>
                  {selectedProject.project_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedProject.project_name}</h2>
                  <Text size="sm" color="dimmed">Created {formatDate(selectedProject.created_at)}</Text>
                </div>
              </div>
              <button className={classes.exitButton} onClick={closePanel}>✖</button>
            </div>
            
            <div className={classes.panelContent}>
              <Paper p="md" radius="md" withBorder mb="md">
                <Text>{selectedProject.project_description}</Text>
              </Paper>
              
              <div className={classes.timelineDetails}>
                <h3>Project Details</h3>
                <div className={classes.timelineGrid}>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="sm" fw={500} c="dimmed">Status</Text>
                    <Badge 
                      size="lg"
                      variant="light"
                      color={
                        selectedProject.status === 'Complete' ? 'blue' :
                        selectedProject.status === 'Archived' ? 'gray' :
                        'green'
                      }
                    >
                      {selectedProject.status}
                    </Badge>
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="sm" fw={500} c="dimmed">Stage</Text>
                    <Group>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: selectedProject.stage.includes('Design') ? '#22c55e' :
                                  selectedProject.stage.includes('Development') ? '#3b82f6' :
                                  '#a855f7'
                      }} />
                      {selectedProject.stage}
                    </Group>
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="sm" fw={500} c="dimmed">Organization</Text>
                    <Badge variant="dot" size="lg" color="gray">
                      {selectedProject.organization}
                    </Badge>
                  </Paper>
                  <Paper p="md" radius="md" withBorder>
                    <Text size="sm" fw={500} c="dimmed">Carbon Emissions</Text>
                    <Text size="lg" fw={500} c={selectedProject.carbon_emit > 10 ? 'red' : 'green'}>
                      {selectedProject.carbon_emit.toFixed(2)} kg CO2
                    </Text>
                  </Paper>
                </div>

                <Paper p="md" radius="md" withBorder mt="md">
                  <Text size="sm" fw={500} c="dimmed" mb="xs">Progress</Text>
                  <div className={classes.progressBar}>
                    <div 
                      className={classes.progressFill} 
                      style={{ 
                        width: `${calculateProgress(selectedProject)}%`,
                        backgroundColor: selectedProject.status === 'Complete' ? '#3b82f6' : '#22c55e'
                      }} 
                    />
                    <span>{Math.round(calculateProgress(selectedProject))}%</span>
                  </div>
                </Paper>
              </div>

              <Paper p="md" radius="md" withBorder mt="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500} c="dimmed">Team Members</Text>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Manage Team
                  </Button>
                </Group>
                {renderAssignees(selectedProject.members)}
              </Paper>

              <div className={classes.panelButtons}>
                <Button 
                  color="red" 
                  variant="light"
                  onClick={() => setIsModalOpen(true)}
                  leftSection={<IconTrash size={16} />}
                >
                  Delete Project
                </Button>
                <Button 
                  color="blue"
                  onClick={handleEditProject}
                  leftSection={<IconEdit size={16} />}
                >
                  Edit Project
                </Button>
              </div>
            </div>
          </div>
        )}

        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirm Deletion"
        >
          <Text>Are you sure you want to delete this project?</Text>
          <Text size="sm" c="dimmed" mt="sm">
            This action cannot be undone. The project and all its data will be permanently deleted.
          </Text>
          <Group align="apart" mt="xl">
            <Button variant="light" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteProject}>Delete Project</Button>
          </Group>
        </Modal>

        <Modal
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Manage Team Members"
        >
          <TextInput
            label="Add Member by Email"
            placeholder="Enter member email"
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
            type="email"
            required
          />
          <Button 
            onClick={handleAddAssignee} 
            mt="sm"
            disabled={!assigneeEmail.includes('@')}
          >
            Add Member
          </Button>

          <Paper p="md" mt="md" withBorder>
            <Text size="sm" fw={500} mb="xs">Current Members</Text>
            <div className={classes.assignees}>
              {(selectedProject?.members || []).map((member, index) => (
                <Badge
                  key={index}
                  variant="light"
                  color="blue"
                  mr={4}
                  mb={4}
                  rightSection={
                    <IconX 
                      size={12} 
                      onClick={() => {
                        // Add remove member functionality here if needed
                      }} 
                      style={{ cursor: 'pointer' }}
                    />
                  }
                >
                  {member}
                </Badge>
              ))}
            </div>
          </Paper>

          <Group justify="flex-end" mt="xl">
            <Button 
              variant="light" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Close
            </Button>
          </Group>
        </Modal>

        <Modal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Project"
        >
          <TextInput
            label="Project Title"
            value={newProject.project_name}
            onChange={(event) => setNewProject({ ...newProject, project_name: event.currentTarget.value })}
            required
          />
          <Textarea
            label="Project Description"
            value={newProject.project_description}
            onChange={(event) => setNewProject({ ...newProject, project_description: event.currentTarget.value })}
            required
          />
          <TextInput
            label="Owner Email"
            value={newProject.owner}
            onChange={(event) => setNewProject({ ...newProject, owner: event.currentTarget.value })}
            required
          />
          <div className={classes.assigneeSection}>
            <TextInput
              label="Add Assignee (Email)"
              value={newProjectAssignee}
              onChange={(e) => setNewProjectAssignee(e.target.value)}
              placeholder="Enter assignee email"
            />
            <Button onClick={handleAddNewProjectAssignee} size="sm" mt="sm">
              Add Assignee
            </Button>
          </div>
          {newProject.members.length > 0 && (
            <div className={classes.assigneesList}>
              <Text fw={500} mt="md">Added Assignees:</Text>
              {newProject.members.map((member, index) => (
                <Badge 
                  key={index}
                  mr={5}
                  mb={5}
                  rightSection={
                    <Center onClick={() => {
                      setNewProject({
                        ...newProject,
                        members: newProject.members.filter((_, i) => i !== index)
                      });
                    }} style={{ cursor: 'pointer' }}>
                      ×
                    </Center>
                  }
                >
                  {member}
                </Badge>
              ))}
            </div>
          )}
          <Select
            label="Status"
            value={newProject.status}
            onChange={(value) => setNewProject({ ...newProject, status: value ?? '' })}
            data={['In Progress', 'Complete', 'Archived']}
            required
          />
          <Select
            label="Stage"
            value={newProject.stage}
            onChange={(value) => setNewProject({ ...newProject, stage: value ?? '' })}
            data={['Design: Creating the software architecture', 'Development: Writing the actual code', 'Testing: Ensuring the software works as expected']}
            required
          />
          <Group align="apart" mt="xl">
            <Button variant="light" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button color="blue" onClick={handleCreateProject}>Create</Button>
          </Group>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;