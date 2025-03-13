import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  Title, 
  Text, 
  Group, 
  Badge, 
  Grid, 
  Progress, 
  Tabs, 
  Avatar, 
  Tooltip, 
  SimpleGrid, 
  Paper, 
  Button, 
  Table,
  ThemeIcon,
  Stack,
  ActionIcon,
  Select,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import styles from './Text.module.css';
import { IconUsers, IconCalendar, IconClock, IconLeaf, IconChecks, IconChartBar, IconFilterHeart, IconPlayerStop, IconPlayerPlay, IconEdit, IconCheck } from '@tabler/icons-react';

// Define TypeScript interfaces for our data structures
interface User {
  id: number;
  name: string;
  email: string;
  organization?: string;
  profile_image?: string;
}

interface ProjectMember {
  id: number;
  user_id: number;
  project_id: number | string;
  role: string;
  joined_at: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

interface Project {
  id: number;
  project_name: string;
  project_description: string;
  carbon_emit: number;
  session_duration: number;
  stage: string;
  status: string;
  stage_duration: number;
  stage_start_date: string;
  stage_due_date: string;
  project_start_date: string;
  project_due_date: string;
  organization?: string;
  created_at?: string;
  team_members?: Array<{
    user_id: number;
    name: string;
    email: string;
    role: string;
    profileImage: string;
  }>;
}

type Task = {
  id: number;
  project_id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  assignees: { email: string; name: string; role: string; profileImage: string }[];
  spentTime: number;
  isRunning: boolean;
  startTime: number | null;
  carbonEmit: number;
  leader: { email: string; name: string; profileImage: string } | null;
  stage_duration: number;
  stage_start_date: string;
  stage_due_date: string;
  project_start_date: string;
  project_due_date: string;
};

const ProjectDisplay: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('active');
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [totalEmissionsByProject, setTotalEmissionsByProject] = useState<{ [key: string]: number }>({});
  const [totalSessionDurationByProject, setTotalSessionDurationByProject] = useState<{ [key: string]: number }>({});
  const [highestEmission, setHighestEmission] = useState<number>(0);
  const [lowestEmission, setLowestEmission] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [showActiveTasks, setShowActiveTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [timers, setTimers] = useState<{ [key: number]: { isRunning: boolean; startTime: number; elapsedTime: number } }>({});
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [assigneeEmail, setAssigneeEmail] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type: 'Design: Creating the software architecture',
    assignees: [] as string[],
    stage_duration: 14,
    stage_start_date: new Date().toISOString().split('T')[0],
    stage_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    project_start_date: new Date().toISOString().split('T')[0],
    project_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Implement fetchData as a component function
  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Fetch user data
      const userResponse = await fetch('http://localhost:5000/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      setUser(userData.user);
      
      // Fetch device info
      const deviceResponse = await fetch('http://localhost:5000/checkDeviceType', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deviceResponse.ok) {
        const deviceData = await deviceResponse.json();
        setCurrentDevice(deviceData.deviceType);
      }
      
      // Fetch and process projects
      await fetchProjects();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data and projects on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers = { ...prevTimers };
        const now = Date.now();
        
        Object.keys(newTimers).forEach(projectId => {
          const timer = newTimers[Number(projectId)];
          if (timer.isRunning) {
            timer.elapsedTime = Math.floor((now - timer.startTime) / 1000);
          }
        });
        
        return newTimers;
      });
    }, 1000);

    setIntervalId(interval);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Format functions
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  };
  
  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${secs}s`;
  };
  
  // Calculate project progress based on timeline
  const calculateProgress = (project: Project): { progress: number; status: string } => {
    if (!project.stage_start_date || !project.stage_due_date) {
      return { progress: 0, status: project.status };
    }
    
    try {
      const now = new Date();
      const startDate = new Date(project.stage_start_date);
      const dueDate = new Date(project.stage_due_date);
      
      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        return { progress: 0, status: project.status };
      }
      
      const totalDuration = dueDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
      
      let status = project.status;
      if (now > dueDate && project.status === 'In-Progress') {
        status = 'Delayed';
      } else if (progress > 90 && project.status === 'In-Progress') {
        status = 'At Risk';
      }
      
      return { progress, status };
    } catch (e) {
      console.error('Error calculating progress:', e);
      return { progress: 0, status: project.status };
    }
  };
  
  // Calculate days remaining for a project
  const calculateDaysRemaining = (dueDate: string): number => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Handle timer start/stop
  const handleTimer = async (projectId: number) => {
    const token = localStorage.getItem('token');
    const project = activeProjects.find(p => p.id === projectId);
    
    if (!project) return;

    try {
      if (!timers[projectId]?.isRunning) {
        // Start timer
        setTimers(prev => ({
          ...prev,
          [projectId]: {
            isRunning: true,
            startTime: Date.now(),
            elapsedTime: 0
          }
        }));

        notifications.show({
          title: 'Timer Started',
          message: 'Session tracking has begun',
          color: 'green'
        });
      } else {
        // Stop timer and calculate emissions
        const timer = timers[projectId];
        const sessionDuration = Math.floor((Date.now() - timer.startTime) / 1000);
        
        // Calculate emissions based on device type
        const emissionsEndpoint = currentDevice === 'Laptop' 
          ? 'http://localhost:5000/calculate_emissionsM'
          : 'http://localhost:5000/calculate_emissions';

        const emissionsResponse = await fetch(emissionsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            sessionDuration,
            projectId
          }),
        });

        if (emissionsResponse.ok) {
          const { carbonEmissions } = await emissionsResponse.json();
          
          // Update project with new emissions and duration
          const updateResponse = await fetch('http://localhost:5000/user_Update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              projectName: project.project_name,
              projectDescription: project.project_description,
              sessionDuration: project.session_duration + sessionDuration,
              carbonEmissions: project.carbon_emit + carbonEmissions,
              projectStage: project.stage,
              projectId
            }),
          });

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.error || 'Failed to update project');
          }

          // Reset timer
          setTimers(prev => ({
            ...prev,
            [projectId]: {
              isRunning: false,
              startTime: 0,
              elapsedTime: 0
            }
          }));

          notifications.show({
            title: 'Session Completed',
            message: `Time: ${formatTime(sessionDuration)} | Emissions: ${carbonEmissions.toFixed(2)} kg CO₂`,
            color: 'blue'
          });

          // Refresh projects data
          await fetchData();
        }
      }
    } catch (error) {
      console.error('Error handling timer:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to process timer action',
        color: 'red'
      });
    }
  };

  // Function to fetch projects
  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const projectsResponse = await fetch('http://localhost:5000/user_project_display_combined', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects data');
      }
      
      const projectsData = await projectsResponse.json();
      
      // Enhance projects with team members info
      const enhancedProjects = await Promise.all(projectsData.projects.map(async (project: Project) => {
        try {
          // Fetch members for each project
          const membersResponse = await fetch(`http://localhost:5000/project/${project.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (membersResponse.ok) {
            const { members } = await membersResponse.json();
            return {
              ...project,
              team_members: members,
              leader: members.find((member: ProjectMember) => member.role === 'project_leader' || member.role === 'Leader') || null
            };
          }
          return project;
        } catch (error) {
          console.error(`Error fetching members for project ${project.id}:`, error);
          return project;
        }
      }));
      
      // Split projects into active and completed
      setActiveProjects(enhancedProjects.filter(p => !['Complete', 'Archived'].includes(p.status)));
      setCompletedProjects(enhancedProjects.filter(p => ['Complete', 'Archived'].includes(p.status)));

      // Update emission statistics
      const emissionsByProject: { [key: string]: number } = {};
      const sessionDurationByProject: { [key: string]: number } = {};

      enhancedProjects.forEach((project: Project) => {
        const projectKey = `${project.project_name}-${project.project_description}`;
        emissionsByProject[projectKey] = (emissionsByProject[projectKey] || 0) + project.carbon_emit;
        sessionDurationByProject[projectKey] = (sessionDurationByProject[projectKey] || 0) + project.session_duration;
      });

      setTotalEmissionsByProject(emissionsByProject);
      setTotalSessionDurationByProject(sessionDurationByProject);

      if (enhancedProjects.length > 0) {
        const emissions = Object.values(emissionsByProject);
        setHighestEmission(Math.max(...emissions));
        setLowestEmission(Math.min(...emissions));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Function to open project details (would be expanded in a real implementation)
  const openProjectDetails = (project: Project) => {
    // In a real app, you might navigate to a dedicated project details page
    notifications.show({
      title: 'Project Selected',
      message: `Viewing details for ${project.project_name}`,
      color: 'green'
    });
  };
  
  // Filter projects based on the selected stage
  const filteredActiveProjects = filterStage 
    ? activeProjects.filter(p => p.stage === filterStage)
    : activeProjects;
    
  const filteredCompletedProjects = filterStage 
    ? completedProjects.filter(p => p.stage === filterStage)
    : completedProjects;
  
  // List of all possible stages for filtering
  const stageOptions = [
    { value: 'Design: Creating the software architecture', label: 'Design' },
    { value: 'Development: Writing the actual code', label: 'Development' },
    { value: 'Testing: Ensuring the software works as expected', label: 'Testing' },
  ];
  
  // Render loading state
  if (isLoading) {
    return (
      <Container className={styles.loadingContainer}>
        <Text>Loading project data...</Text>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container className={styles.errorContainer}>
        <Text color="red">{error}</Text>
      </Container>
    );
  }

  // Update the handleEditProject function to properly handle the project update
  const handleEditProject = async (project: Project) => {
    if (!project) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Update project details via user_Update endpoint
      const updateResponse = await fetch('http://localhost:5000/user_Update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.project_name,
          projectDescription: project.project_description,
          projectStage: project.stage,
          stage_duration: project.stage_duration,
          stage_start_date: project.stage_start_date,
          stage_due_date: project.stage_due_date,
          project_due_date: project.project_due_date,
          sessionDuration: project.session_duration || 0,
          carbonEmit: project.carbon_emit || 0
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      await fetchData();
      setIsEditing(false);
      setSelectedProject(null);

      notifications.show({
        title: 'Success',
        message: 'Project updated successfully',
        color: 'green'
      });

    } catch (error) {
      console.error('Error updating project:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update project',
        color: 'red'
      });
    }
  };

  // Add handleAddAssignee function from TEST.tsx
  const handleAddAssignee = async () => {
    if (!assigneeEmail) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (selectedProject) {
        // Adding assignee to existing project
        const response = await fetch('http://localhost:5000/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: assigneeEmail,
            projectId: selectedProject.id,
            message: `You have been invited to join the project: ${selectedProject.project_name}`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send invitation');
        }

        // Update local state
        setSelectedProject(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            team_members: [...(prev.team_members || []), {
              user_id: -1, // Temporary ID until user accepts
              name: 'Pending...',
              email: assigneeEmail,
              role: 'Member',
              profileImage: ''
            }]
          };
        });

        // Show success notification
        notifications.show({
          title: 'Invitation Sent',
          message: `Invitation sent to ${assigneeEmail}`,
          color: 'green'
        });

        // Refresh projects to get updated member list
        await fetchProjects();
      }

      setAssigneeEmail('');
    } catch (err) {
      console.error('Error sending invitation:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to send invitation',
        color: 'red'
      });
    }
  };

  // Add this function before the renderProjectsTable function
  const renderAssignees = (assignees: Array<{ name: string; email: string; role: string; profileImage: string }>) => {
    const displayCount = 3;
    const displayedAssignees = assignees.slice(0, displayCount);
    const remainingCount = assignees.length - displayCount;

    return (
      <Group gap={4}>
        {displayedAssignees.map((assignee, index) => (
          <Tooltip
            key={index}
            label={`${assignee.name} (${assignee.role})`}
            withArrow
            position="top"
          >
            <Avatar
              src={assignee.profileImage || `https://www.gravatar.com/avatar/${assignee.email}?d=identicon`}
              size="sm"
              radius="xl"
              alt={assignee.name}
            />
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip label={`${remainingCount} more team members`} withArrow position="top">
            <Badge size="sm" variant="filled" radius="xl">+{remainingCount}</Badge>
          </Tooltip>
        )}
      </Group>
    );
  };

  // Add this function after handleEditProject
  const handleComplete = async (projectId: number) => {
    const token = localStorage.getItem('token');
    const project = activeProjects.find(p => p.id === projectId);
    if (!project) return;

    // Define the project stages in order
    const projectStages = [
      'Design: Creating the software architecture',
      'Development: Writing the actual code',
      'Testing: Ensuring the software works as expected'
    ];

    // Find the current stage index
    const currentStageIndex = projectStages.indexOf(project.stage);
    const nextStage = currentStageIndex < projectStages.length - 1 ? projectStages[currentStageIndex + 1] : null;

    try {
      // First stop the timer if it's running
      if (timers[projectId]?.isRunning) {
        await handleTimer(projectId);
      }

      // Call the complete_project endpoint
      const completeResponse = await fetch(`http://localhost:5000/complete_project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          nextStage
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete project stage');
      }

      const completionData = await completeResponse.json();

      // Update local state
      const updatedProject = {
        ...project,
        stage: completionData.stage,
        status: completionData.status
      };

      if (isEditing && selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }

      // Refresh the project list
      await fetchData();

      notifications.show({
        title: 'Stage Complete',
        message: nextStage ? 'Moving to next stage' : 'Project completed',
        color: 'green'
      });

    } catch (err) {
      console.error('Error completing project stage:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to complete project stage',
        color: 'red'
      });
    }
  };

  // Enhance the existing table UI with a modern design
  const renderProjectsTable = (projects: Project[]) => (
    <Table className={styles.modernTable} striped highlightOnHover>
      <thead>
        <tr>
          <th>Project</th>
          <th>Stage</th>
          <th>Status</th>
          <th>Team</th>
          <th>Timeline</th>
          <th>Progress</th>
          <th>Carbon</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => {
          const { progress, status } = calculateProgress(project);
          const daysRemaining = calculateDaysRemaining(project.stage_due_date);
          const timer = timers[project.id];
          
          return (
            <tr key={project.id}>
              <td>
                <div className={styles.projectCell}>
                  <Text fw={600}>{project.project_name}</Text>
                  <Text size="xs" color="dimmed" lineClamp={1}>
                    {project.project_description}
                  </Text>
                </div>
              </td>
              <td>
                <Badge variant="dot" color={
                  project.stage.includes('Design') ? 'blue' :
                  project.stage.includes('Development') ? 'violet' :
                  'green'
                }>
                  {project.stage.split(':')[0]}
                </Badge>
              </td>
              <td>
                <Badge color={
                  status === 'Delayed' ? 'red' :
                  status === 'At Risk' ? 'yellow' :
                  'green'
                }>
                  {status}
                </Badge>
              </td>
              <td>{project.team_members && renderAssignees(project.team_members)}</td>
              <td>
                <div className={styles.timelineInfo}>
                  <Text size="xs">Start: {formatDate(project.stage_start_date)}</Text>
                  <Text size="xs">Due: {formatDate(project.stage_due_date)}</Text>
                  <Text size="xs" color={daysRemaining < 5 ? 'red' : 'dimmed'}>
                    {daysRemaining} days left
                  </Text>
                </div>
              </td>
              <td>
                <Progress
                  value={progress}
                  color={status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'}
                  size="sm"
                  radius="xl"
                  children={<Progress.Label>{`${Math.round(progress)}%`}</Progress.Label>}
                />
              </td>
              <td>
                <Group gap={5}>
                  <IconLeaf size={16} color="green" />
                  <Text>{project.carbon_emit.toFixed(2)} kg</Text>
                </Group>
              </td>
              <td>
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    color={timer?.isRunning ? "red" : "green"}
                    onClick={() => handleTimer(project.id)}
                    title={timer?.isRunning ? "Stop Timer" : "Start Timer"}
                  >
                    {timer?.isRunning ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsEditing(true);
                    }}
                    title="Edit Project"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  {project.status !== 'Complete' && (
                    <ActionIcon
                      variant="light"
                      color="teal"
                      onClick={() => handleComplete(project.id)}
                      title="Complete Stage"
                    >
                      <IconCheck size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  const closePanel = () => {
    setSelectedProject(null);
    setIsEditing(false);
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.type) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all required fields',
        color: 'red'
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const stage_duration = parseInt(newProject.stage_duration.toString()) || 14;
      const now = new Date();
      const stage_start_date = now.toISOString().split('T')[0];
      const due_date = new Date(now);
      due_date.setDate(now.getDate() + stage_duration);
      const stage_due_date = due_date.toISOString().split('T')[0];

      const projectData = {
        projectName: newProject.title,
        projectDescription: newProject.description,
        organization: user?.organization,
        projectStage: newProject.type,
        sessionDuration: 0,
        carbonEmit: 0,
        status: "In-Progress",
        stage_duration,
        stage_start_date,
        stage_due_date,
        project_start_date: stage_start_date,
        project_due_date: stage_due_date
      };

      // Create the project
      const response = await fetch('http://localhost:5000/user_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      const projectId = data.projectId;

      // Send invitations to all assignees
      const invitationPromises = newProject.assignees.map(async (assigneeEmail) => {
        try {
          const inviteResponse = await fetch('http://localhost:5000/send-invitation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              recipientEmail: assigneeEmail,
              projectId: projectId,
              message: `You have been invited to join the project: ${newProject.title}`
            }),
          });

          if (!inviteResponse.ok) {
            console.error(`Failed to send invitation to ${assigneeEmail}`);
          }
        } catch (err) {
          console.error(`Error sending invitation to ${assigneeEmail}:`, err);
        }
      });

      await Promise.all(invitationPromises);
      await fetchData();

      notifications.show({
        title: 'Success',
        message: 'Project created successfully and invitations sent to team members',
        color: 'green',
      });

      setShowAddModal(false);
      setNewProject({
        title: '',
        description: '',
        type: 'Design: Creating the software architecture',
        assignees: [],
        stage_duration: 14,
        stage_start_date: new Date().toISOString().split('T')[0],
        stage_due_date: '',
        project_start_date: new Date().toISOString().split('T')[0],
        project_due_date: ''
      });
      setAssigneeEmail('');
    } catch (err) {
      console.error('Error creating project:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to create project or send invitations',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title order={1} className={styles.title}>Project Dashboard</Title>
          <Text size="sm" color="dimmed">
            Track your projects, team members, and carbon emissions
          </Text>
        </div>
        
        <Group>
          <div className={styles.deviceInfo}>
            <IconFilterHeart size={18} />
            <Text>Current Device: {currentDevice || 'Not detected'}</Text>
          </div>
          <Button onClick={() => setShowAddModal(true)}>Create Project</Button>
        </Group>
      </div>

      {/* Add the Create Project Modal */}
      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Project"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Project Name"
            placeholder="Enter project name"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            required
          />
          <Textarea
            label="Project Description"
            placeholder="Enter project description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            minRows={3}
            required
          />
          <Select
            label="Project Stage"
            placeholder="Select stage"
            value={newProject.type}
            onChange={(value) => setNewProject({ ...newProject, type: value || 'Design: Creating the software architecture' })}
            data={stageOptions}
            required
          />
          <NumberInput
            label="Stage Duration (days)"
            value={newProject.stage_duration}
            onChange={(value) => {
              const duration = Number(value) || 14;
              const startDate = new Date();
              const dueDate = new Date(startDate);
              dueDate.setDate(startDate.getDate() + duration);
              
              setNewProject({
                ...newProject,
                stage_duration: duration,
                stage_start_date: startDate.toISOString().split('T')[0],
                stage_due_date: dueDate.toISOString().split('T')[0],
                project_start_date: startDate.toISOString().split('T')[0],
                project_due_date: dueDate.toISOString().split('T')[0]
              });
            }}
            min={1}
            max={365}
            required
          />
          <div className={styles.dateGrid}>
            <Text size="sm" fw={500}>Timeline Dates</Text>
            <Text size="xs" color="dimmed">Start: {formatDate(newProject.stage_start_date)}</Text>
            <Text size="xs" color="dimmed">Due: {formatDate(newProject.stage_due_date)}</Text>
          </div>
          <TextInput
            label="Add Team Member"
            placeholder="Enter team member's email"
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
          />
          <Group gap="sm">
            <Button onClick={() => {
              if (assigneeEmail) {
                setNewProject({
                  ...newProject,
                  assignees: [...newProject.assignees, assigneeEmail]
                });
                setAssigneeEmail('');
              }
            }}>
              Add Team Member
            </Button>
          </Group>
          {newProject.assignees.length > 0 && (
            <Card withBorder>
              <Text size="sm" fw={500} mb="xs">Team Members</Text>
              <Stack gap="xs">
                {newProject.assignees.map((email, index) => (
                  <Group key={index} align="apart">
                    <Group>
                      <Avatar
                        src={`https://www.gravatar.com/avatar/${email}?d=identicon`}
                        size="sm"
                        radius="xl"
                      />
                      <Text size="sm">{email}</Text>
                    </Group>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => setNewProject({
                        ...newProject,
                        assignees: newProject.assignees.filter((_, i) => i !== index)
                      })}
                    >
                      ×
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}
          <Group align="right" mt="xl">
            <Button variant="default" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddProject}>Create Project</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" className={styles.summaryCards}>
        <Card withBorder padding="lg" radius="md">
          <Group gap="xs">
            <ThemeIcon color="green" variant="light" size={40} radius="md">
              <IconLeaf size={20} />
            </ThemeIcon>
            
            <div>
              <Text size="xs" color="dimmed" style={{ textTransform: 'uppercase' }}>Total Carbon Emissions</Text>
              <Text size="xl" fw={700}>
                {activeProjects.reduce((sum, project) => sum + project.carbon_emit, 0).toFixed(2)} kg CO2
              </Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder padding="lg" radius="md">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size={40} radius="md">
              <IconChartBar size={20} />
            </ThemeIcon>
            
            <div>
              <Text size="xs" color="dimmed" style={{ textTransform: 'uppercase' }}>Active Projects</Text>
              <Text size="xl" fw={700}>{activeProjects.length}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder padding="lg" radius="md">
          <Group gap="xs">
            <ThemeIcon color="grape" variant="light" size={40} radius="md">
              <IconUsers size={20} />
            </ThemeIcon>
            
            <div>
              <Text size="xs" color="dimmed" style={{ textTransform: 'uppercase' }}>Team Members</Text>
              <Text size="xl" fw={700}>
                {new Set(
                  activeProjects
                    .flatMap(p => p.team_members || [])
                    .map(m => m.user_id)
                ).size}
              </Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder padding="lg" radius="md">
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" size={40} radius="md">
              <IconClock size={20} />
            </ThemeIcon>
            
            <div>
              <Text size="xs" color="dimmed" style={{ textTransform: 'uppercase' }}>Total Time Spent</Text>
              <Text size="xl" fw={700}>
                {formatTime(activeProjects.reduce((sum, project) => sum + project.session_duration, 0))}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
      
      {/* Filter and Tabs */}
      <Group align="apart" className={styles.filterSection}>
        <Select
          label="Filter by Stage"
          placeholder="All Stages"
          clearable
          data={stageOptions}
          value={filterStage}
          onChange={setFilterStage}
          className={styles.stageFilter}
        />
      </Group>
      
      <Tabs value={activeTab} onChange={setActiveTab} className={styles.projectTabs}>
        <Tabs.List>
          <Tabs.Tab value="active">
            <IconClock size={14} /> Active Projects ({filteredActiveProjects.length})
          </Tabs.Tab>
          <Tabs.Tab value="completed">
            <IconChecks size={14} /> Completed Projects ({filteredCompletedProjects.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" pt="md">
          {filteredActiveProjects.length === 0 ? (
            <Paper p="xl" withBorder className={styles.emptyState}>
              <Text ta="center" color="dimmed">No active projects found</Text>
              {filterStage && (
                <Text ta="center" size="sm">Try removing the stage filter</Text>
              )}
            </Paper>
          ) : (
            renderProjectsTable(filteredActiveProjects)
          )}
        </Tabs.Panel>

        <Tabs.Panel value="completed" pt="md">
          {filteredCompletedProjects.length === 0 ? (
            <Paper p="xl" withBorder className={styles.emptyState}>
              <Text ta="center" color="dimmed">No completed projects found</Text>
              {filterStage && (
                <Text ta="center" size="sm">Try removing the stage filter</Text>
              )}
            </Paper>
          ) : (
            renderProjectsTable(filteredCompletedProjects)
          )}
        </Tabs.Panel>
      </Tabs>
      
      {/* Additional Stats Section */}
      <Paper withBorder p="md" radius="md" className={styles.statsSection}>
        <Title order={3} mb="md">Project Stage Distribution</Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {stageOptions.map(stage => {
            const count = activeProjects.filter(p => p.stage === stage.value).length;
            const totalEmissions = activeProjects
              .filter(p => p.stage === stage.value)
              .reduce((sum, p) => sum + p.carbon_emit, 0);
              
            return (
              <Card key={stage.value} withBorder padding="lg" radius="md">
                <Stack gap="xs">
                  <Text fw={700}>{stage.label}</Text>
                  <Group align="apart">
                    <Text size="sm">Projects:</Text>
                    <Text fw={500}>{count}</Text>
                  </Group>
                  <Group p="apart">
                    <Text size="sm">Carbon:</Text>
                    <Text fw={500}>{totalEmissions.toFixed(2)} kg CO₂</Text>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Paper>
      
      {selectedProject && (
        <Modal
          opened={!!selectedProject}
          onClose={closePanel}
          title={isEditing ? "Edit Project" : selectedProject.project_name}
          size="lg"
        >
          <Paper p="md">
            {isEditing ? (
              <Stack gap="md">
                <TextInput
                  label="Project Name"
                  value={selectedProject.project_name}
                  onChange={(e) => setSelectedProject({ ...selectedProject, project_name: e.target.value })}
                  placeholder="Enter project name"
                />
                <Textarea
                  label="Project Description"
                  value={selectedProject.project_description}
                  onChange={(e) => setSelectedProject({ ...selectedProject, project_description: e.target.value })}
                  placeholder="Enter project description"
                  minRows={3}
                />
                <Select
                  label="Project Stage"
                  value={selectedProject.stage}
                  onChange={(value) => value && setSelectedProject({ ...selectedProject, stage: value })}
                  data={stageOptions}
                />
                <NumberInput
                  label="Stage Duration (days)"
                  value={selectedProject.stage_duration}
                  onChange={(value) => {
                    const duration = Number(value);
                    if (!isNaN(duration) && duration > 0) {
                      const startDate = new Date(selectedProject.stage_start_date);
                      const dueDate = new Date(startDate);
                      dueDate.setDate(startDate.getDate() + duration);
                      setSelectedProject({
                        ...selectedProject,
                        stage_duration: duration,
                        stage_due_date: dueDate.toISOString().split('T')[0]
                      });
                    }
                  }}
                  min={1}
                  max={365}
                />
                <Group grow>
                  <TextInput
                    label="Start Date"
                    value={selectedProject.stage_start_date}
                    onChange={(e) => setSelectedProject({ ...selectedProject, stage_start_date: e.target.value })}
                    type="date"
                  />
                  <TextInput
                    label="Due Date"
                    value={selectedProject.stage_due_date}
                    onChange={(e) => setSelectedProject({ ...selectedProject, stage_due_date: e.target.value })}
                    type="date"
                  />
                </Group>
                <TextInput
                  label="Add Team Member"
                  placeholder="Enter email address"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                />
                <Button onClick={handleAddAssignee}>Add Team Member</Button>
              </Stack>
            ) : (
              <Stack gap="md">
                <Text size="lg" fw={500}>{selectedProject.project_description}</Text>
                
                <Card withBorder>
                  <Group align="apart" mb="xs">
                    <Text fw={500}>Timeline Details</Text>
                    <Badge>{selectedProject.stage.split(':')[0]}</Badge>
                  </Group>
                  <SimpleGrid cols={2}>
                    <Text size="sm" color="dimmed">Stage Duration:</Text>
                    <Text size="sm">{selectedProject.stage_duration} days</Text>
                    <Text size="sm" color="dimmed">Stage Start:</Text>
                    <Text size="sm">{formatDate(selectedProject.stage_start_date)}</Text>
                    <Text size="sm" color="dimmed">Stage Due:</Text>
                    <Text size="sm">{formatDate(selectedProject.stage_due_date)}</Text>
                    <Text size="sm" color="dimmed">Project Due:</Text>
                    <Text size="sm">{formatDate(selectedProject.project_due_date)}</Text>
                  </SimpleGrid>
                </Card>

                {(() => {
                  const { progress, status } = calculateProgress(selectedProject);
                  const daysLeft = calculateDaysRemaining(selectedProject.stage_due_date);

                  return (
                    <Card withBorder>
                      <Text fw={500} mb="xs">Progress</Text>
                      <Progress
                        value={progress}
                        color={status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'}
                        size="lg"
                        radius="xl"
                        mb="sm"
                      >
                        {`${Math.round(progress)}%`}
                      </Progress>
                      <Group align="apart">
                        <Badge color={status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'}>
                          {status}
                        </Badge>
                        {daysLeft > 0 && (
                          <Text size="sm" color={daysLeft < 5 ? 'red' : 'dimmed'}>
                            {daysLeft} days remaining
                          </Text>
                        )}
                      </Group>
                    </Card>
                  );
                })()}

                <Card withBorder>
                  <Text fw={500} mb="xs">Project Statistics</Text>
                  <SimpleGrid cols={2}>
                    <Text size="sm" color="dimmed">Time Spent:</Text>
                    <Text size="sm">
                      {formatTime(selectedProject.session_duration)}
                    </Text>
                    <Text size="sm" color="dimmed">Carbon Emissions:</Text>
                    <Text size="sm">
                      {selectedProject.carbon_emit.toFixed(2)} kg CO₂
                    </Text>
                  </SimpleGrid>
                </Card>

                {selectedProject.team_members && (
                  <Card withBorder>
                    <Text fw={500} mb="xs">Team Members</Text>
                    <Stack gap="xs">
                      {selectedProject.team_members.map((member, index) => (
                        <Group key={index} align="apart">
                          <Group>
                            <Avatar
                              src={member.profileImage || `https://www.gravatar.com/avatar/${member.email}?d=identicon`}
                              radius="xl"
                              size="sm"
                            />
                            <div>
                              <Text size="sm">{member.name}</Text>
                              <Text size="xs" color="dimmed">{member.role}</Text>
                            </div>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                )}
              </Stack>
            )}

            <Group align="right" mt="xl">
              {isEditing ? (
                <>
                  <Button variant="default" onClick={closePanel}>Cancel</Button>
                  <Button onClick={() => handleEditProject(selectedProject)}>Save Changes</Button>
                </>
              ) : (
                <>
                  <Button variant="default" onClick={closePanel}>Close</Button>
                  <Button onClick={() => setIsEditing(true)}>Edit Project</Button>
                </>
              )}
            </Group>
          </Paper>
        </Modal>
      )}
      
      {user && (
        <div className={styles.projectOwner}>
          <Text size="sm" color="dimmed">
            Logged in as: <span>{user.email}</span>
            {user.organization && ` | Organization: ${user.organization}`}
          </Text>
        </div>
      )}
    </Container>
  );
};

export default ProjectDisplay;
