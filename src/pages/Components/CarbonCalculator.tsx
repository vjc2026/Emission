import { useState, useEffect } from 'react';
import { 
  Container, 
  Text, 
  TextInput, 
  Button, 
  Group, 
  Card, 
  Loader, 
  Divider, 
  Stack, 
  Title, 
  Modal,
  Select,
  Badge,
  Grid,
  Paper,
  Flex
} from '@mantine/core';
import styles from './History.module.css';
import { showNotification } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

export function HistoryComponent() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [organization, setOrganization] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [carbonEmit, setcarbonEmit] = useState<number>(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [projectStage, setProjectStage] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editableProject, setEditableProject] = useState<any | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteProjectId, setInviteProjectId] = useState<number | null>(null);
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);
  const navigate = useNavigate();

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem('token'); 

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://emission-mah2.onrender.com/user', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user); 
          setOrganization(data.user.organization);
          fetchUserProjects(data.user.email); 
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch user details.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching user details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const fetchUserProjects = async (email: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://emission-mah2.onrender.com/user_project_display_combined`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        interface Project {
          id: number;
          project_name: string;
          project_description: string;
          session_duration: number;
          carbon_emit: number;
          stage: string;
          status: string;
        }

        interface UserProjectsResponse {
          projects: Project[];
          carbon_emit: number;
        }

        interface Project {
          id: number;
          project_name: string;
          project_description: string;
          session_duration: number;
          carbon_emit: number;
          stage: string;
          status: string;
        }

        interface UserProjectsResponse {
          projects: Project[];
          carbon_emit: number;
        }

        const activeProjects: Project[] = (data as UserProjectsResponse).projects.filter(project => project.status !== 'Archived');
        setProjects(activeProjects);
        setcarbonEmit(data.carbon_emit);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to fetch user projects.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while fetching user projects.');
    }
  };

  useEffect(() => {
    const fetchCurrentDevice = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('https://emission-mah2.onrender.com/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (response.ok) {
          const { deviceType } = await response.json();
          setCurrentDevice(deviceType);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch current device.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching current device.');
      }
    };
  
    fetchCurrentDevice();
  }, []);

  const startSession = async () => {
    if (isTimerRunning) return;
    // Check for empty inputs
    if (!projectName || !projectDescription) {
      setError('Please Select a Project before starting the calculator.');
      return;
    }
    const token = localStorage.getItem('token');
    console.log("Starting session with:", projectName, projectDescription);
 
    try {
       const response = await fetch(`https://emission-mah2.onrender.com/find_project`, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ projectName, projectDescription }),
       });
 
       if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.statusText}`);
       }
 
       const existingProject = await response.json();
       setError(' ');
       console.log("Existing project found:", existingProject);

       if (existingProject) {
          setSessionDuration(existingProject.session_duration || 0);
          setSelectedProjectId(existingProject.project_id);
       } else {
          setSessionDuration(0);
          setSelectedProjectId(null);
       }
 
       const startTime = Date.now();
       localStorage.setItem('startTime', startTime.toString());
       setIsTimerRunning(true);
       const id = setInterval(() => {
         const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
         setSessionDuration(existingProject.session_duration + elapsedTime);
       }, 1000);
       setIntervalId(id);
    } catch (err) {
       console.error('Error in startSession:', err);
       setError('An error occurred while starting the session.');
    }
  };

  const endSession = async () => {
    if (!isTimerRunning) return;
    clearInterval(intervalId!);
    setIsTimerRunning(false);
    localStorage.removeItem('startTime');

    const token = localStorage.getItem('token');
    const historyData = { 
      projectName, 
      projectDescription, 
      sessionDuration, 
      organization,
      projectStage,
      projectId: selectedProjectId
    };

    try {
      const deviceTypeResponse = await fetch('https://emission-mah2.onrender.com/checkDeviceType', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!deviceTypeResponse.ok) {
        throw new Error(`Failed to fetch device type: ${deviceTypeResponse.statusText}`);
      }

      const { deviceType } = await deviceTypeResponse.json();

      const emissionsEndpoint = deviceType === 'Laptop' 
        ? 'https://emission-mah2.onrender.com/calculate_emissionsM'
        : 'https://emission-mah2.onrender.com/calculate_emissions';

      const emissionsResponse = await fetch(emissionsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionDuration, projectId: selectedProjectId }), 
      });

      if (!emissionsResponse.ok) {
        throw new Error(`Failed to calculate emissions: ${emissionsResponse.statusText}`);
      }

      const { carbonEmissions } = await emissionsResponse.json();
      console.log(`Calculated Carbon Emissions: ${carbonEmissions} kg CO2`);

        const updateResponse = await fetch('https://emission-mah2.onrender.com/user_Update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ...historyData, carbonEmissions }),
        });

        if (updateResponse.ok) {
          setProjectName('');
          setProjectDescription('');
          setSessionDuration(0);
          fetchUserProjects(user?.email!); 

          setSessionHistory(prev => [
            ...prev.filter(session => session.projectName !== historyData.projectName),
            { projectName: historyData.projectName, projectDescription: historyData.projectDescription, sessionDuration: historyData.sessionDuration, carbonEmissions, organization: historyData.organization, projectStage: historyData.projectStage },
          ]);
        } else {
          const result = await updateResponse.json();
          setError(result.error || 'Failed to record session.');
        }
    } catch (err) {
      console.error('Error in endSession:', err);
      setError('An error occurred while recording the session.');
    }
};

useEffect(() => {
  const startTime = localStorage.getItem('startTime');
  if (startTime) {
    const elapsedTime = Math.floor((Date.now() - parseInt(startTime)) / 1000);
    setSessionDuration(prev => prev + elapsedTime);
    setIsTimerRunning(true);
    const id = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      setSessionDuration(prev => prev + newElapsedTime);
    }, 1000);
    setIntervalId(id);
  }
}, []);

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isTimerRunning) {
      // Standard way to show confirmation dialog
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };

  // Add event listener when timer is running
  if (isTimerRunning) {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // Cleanup function to remove event listener
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [isTimerRunning]); // Re-run effect when timer status changes

  const handleSaveChanges = async () => {
    if (!editableProject) return;

    const token = localStorage.getItem('token');
    const updatedProject = { projectName, projectDescription, projectStage };

    try {
      const response = await fetch(`https://emission-mah2.onrender.com/update_project/${editableProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProject),
      });

      if (response.ok) {
        fetchUserProjects(user?.email!); 
        setIsModalOpen(false);
        setEditableProject(null);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update project.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while updating the project.');
    }
  };

  const handleEditProject = (projectId: number) => {
    const projectToEdit = projects.find((p) => p.id === projectId);
    if (projectToEdit) {
      setProjectName(projectToEdit.project_name);
      setProjectDescription(projectToEdit.project_description);
      setProjectStage(projectToEdit.projectStage);
      setEditableProject(projectToEdit);
      setSelectedProjectId(projectToEdit.id);
      setIsModalOpen(true);
    }
  };

  const createProject = async () => {
    if (!projectName || !projectDescription || !projectStage) {
      setError('All fields are required.');
      return; // Exit the function if any required field is missing
    }
    const token = localStorage.getItem('token');
    const projectData = {
      projectName,
      projectDescription,
      organization,
      projectStage,
      sessionDuration: 0,
      carbonEmit: 0,
      status: "In-Progress",
    };
    try {
      // Check if a project with the same name exists
      const checkResponse = await fetch('https://emission-mah2.onrender.com/check_existing_projectname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectName }),
      });
  
      const existingProject = await checkResponse.json();
  
      // If project with the same name exists, show error and close modal
      if (existingProject.exists) {
        setError('A project with this name already exists.');
        return; // Exit the function early
      }
  
      // No existing project, create the new one
      const response = await fetch('https://emission-mah2.onrender.com/user_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });
      
      if (response.ok) {
        setProjectName('');
        setProjectDescription('');
        setProjectStage('');
        setSessionDuration(0);
        fetchUserProjects(user?.email!); // Refresh the project list
        console.log('Project successfully created in user history.');
        setIsCreateModalOpen(false); // Close the modal on success
        setError(' ');
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create project in user history.');
      }
    } catch (err) {
      console.error('Error in createProject:', err);
      setError('An error occurred while creating the project.');
    }
  };

  const stages = [
    "Design: Creating the software architecture",
    "Development: Writing the actual code",
    "Testing: Ensuring the software works as expected"
  ];
  
  const handleCompleteStage = async (projectId: number) => {
    if (!projectName || !projectDescription || !projectStage) {
      setError('Are you sure you want to complete this project? (Click again to confirm)');
      return;
    }

    const token = localStorage.getItem('token');

    // Define project stages
    const projectStages = [
      'Design: Creating the software architecture',
      'Development: Writing the actual code', 
      'Testing: Ensuring the software works as expected'
    ];

    // Get current stage index
    const currentStageIndex = projectStages.indexOf(projectStage);

    // Check if current stage is the last stage
    const isLastStage = currentStageIndex === projectStages.length - 1;

    try {
      const response = await fetch(`https://emission-mah2.onrender.com/complete_project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Only include nextStage if not in last stage
          ...(isLastStage ? {} : { nextStage: projectStages[currentStageIndex + 1] })
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete project: ${response.statusText}`);
      }

      if (isLastStage) {
        setError('Project is now complete! All stages finished.');
      } else {
        setError('');
      }

      // Reset form fields and refresh projects
      setProjectName('');
      setProjectDescription('');
      setProjectStage('');
      fetchUserProjects(user?.email!);

    } catch (err) {
      console.error('Error in completing project stage:', err);
      setError('An error occurred while completing the project stage.');
    }
  };
  
  interface InviteUserPayload {
    recipientEmail: string;
    projectId: number;
    message: string;
  }

  const handleInviteUser = async (recipientEmail: string, projectId: number, message: string): Promise<void> => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://emission-mah2.onrender.com/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientEmail, projectId, message } as InviteUserPayload),
      });

      if (response.ok) {
        alert('Invitation sent successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to send invitation: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('An error occurred while sending the invitation.');
    }
  };

  const handleOpenInviteModal = (projectId: number) => {
    setInviteProjectId(projectId);
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = () => {
    if (inviteEmail && inviteMessage && inviteProjectId !== null) {
      handleInviteUser(inviteEmail, inviteProjectId, inviteMessage);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteMessage('');
    } else {
      alert('Please fill in all fields.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isSessionActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval as NodeJS.Timeout);
  }, [isSessionActive]);

  return (
    <Container className={styles.container} size="xl">
      <Title order={1} className={styles.title}>
        Session Tracker
      </Title>

      {error && (
        <Text className={styles.errorText} color='red'>
          {error}
        </Text>
      )}

      {loading ? (
        <Loader size="lg" style={{ display: 'block', margin: '0 auto' }} />
      ) : (
        <Grid gutter="md">
          <Grid.Col span={12}>
            <Paper p="md" shadow="xs" radius="md" withBorder>
              <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="xs">
                    <TextInput
                      placeholder="Project Name"
                      label="Project Title"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      style={{ width: '100%' }}
                      readOnly
                    />
                    
                    <TextInput
                      placeholder="Project Description"
                      label="Project Description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      style={{ width: '100%' }}
                      readOnly
                    />
                    
                    <Select
                      label="Project Stage"
                      placeholder="Select a stage"
                      data={[
                        { value: 'Design: Creating the software architecture', label: 'Design: Creating the software architecture' },
                        { value: 'Development: Writing the actual code', label: 'Development: Writing the actual code' },
                        { value: 'Testing: Ensuring the software works as expected', label: 'Testing: Ensuring the software works as expected' },
                      ]}
                      value={projectStage}
                      onChange={setProjectStage}
                      className={styles.projectStageDropdown}
                      readOnly
                    />
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="md" align="center" justify="center" h="100%">
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                      Current Duration: {formatDuration(sessionDuration)}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                      Current Device: {currentDevice || 'N/A'}
                    </Text>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)} 
                      style={{ backgroundColor: '#006400', color: '#fff', width: '100%' }}
                    >
                      Create Project
                    </Button>
                    <Group grow style={{ width: '100%' }}>
                      <Button 
                        onClick={startSession} 
                        disabled={isTimerRunning} 
                        style={{ backgroundColor: '#006400', color: '#fff' }}
                      >
                        Start Session
                      </Button>
                      <Button 
                        onClick={endSession} 
                        disabled={!isTimerRunning} 
                        color="red"
                      >
                        End Session
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={12}>
            <Divider label="Project History" labelPosition="center" size="md" />
            
            <Grid gutter="md">
              {projects.map((project) => {
                const totalCarbonEmissions = sessionHistory
                  .filter(session => session.projectName === project.project_name)
                  .reduce((acc, session) => acc + session.carbonEmissions, 0);

                return (
                  <Grid.Col key={project.id} span={{ base: 12, sm: 6, lg: 4 }}>
                    <Card shadow="sm" radius="md" withBorder className={styles.projectCard}>
                      <Card.Section p="md" withBorder style={{ backgroundColor: 'rgba(0, 100, 0, 0.05)' }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={700} size="lg" lineClamp={1} style={{ flex: 1 }}>
                            {project.project_name}
                          </Text>
                          <Badge
                            color={
                              project.stage.includes('Design') ? 'green' :
                              project.stage.includes('Development') ? 'blue' : 'violet'
                            }
                            variant="light"
                          >
                            {project.stage.split(':')[0]}
                          </Badge>
                        </Group>
                      </Card.Section>
                      
                      <Stack gap="xs" p="md" pb={0}>
                        <Text lineClamp={2} size="sm" color="dimmed">
                          {project.project_description}
                        </Text>
                        
                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="xs" color="dimmed">Session Duration</Text>
                            <Text size="sm" fw={500}>{formatDuration(project.session_duration)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="xs" color="dimmed">Carbon Emissions</Text>
                            <Text size="sm" fw={500} color={project.carbon_emit > 10 ? 'red' : 'green'}>
                              {project.carbon_emit.toFixed(2)} kg CO2
                            </Text>
                          </Grid.Col>
                        </Grid>
                        
                        <Text size="xs" color="dimmed" mt={5}>
                          Project Owner: {project.owner_email || project.owner || 'N/A'}
                        </Text>
                      </Stack>
                      
                      <Card.Section p="md" mt="md" withBorder style={{ backgroundColor: '#f9f9f9' }}>
                        <Group grow>
                          <Button size="xs" onClick={() => {
                            setProjectName(project.project_name);
                            setProjectDescription(project.project_description);
                            setProjectStage(project.stage);
                          }}>
                            Select
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => handleEditProject(project.id)} 
                            style={{ backgroundColor: '#006400', color: '#fff' }}
                          >
                            Edit
                          </Button>
                        </Group>
                        <Group grow mt="xs">
                          <Button 
                            size="xs" 
                            color="blue" 
                            onClick={() => {
                              setProjectName(project.project_name);
                              setProjectDescription(project.project_description);
                              setProjectStage(project.stage);
                              handleCompleteStage(project.id);
                            }}
                          >
                            Complete Stage
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => handleOpenInviteModal(project.id)} 
                            variant="outline"
                          >
                            Invite
                          </Button>
                        </Group>
                      </Card.Section>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Grid.Col>
        </Grid>
      )}
      
      {/* Floating Help Button */}
      <Button
        title="Help"
        onClick={() => setIsHelpOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          backgroundColor: '#006400',
          color: 'white',
          fontSize: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          transition: 'transform 0.2s',
          cursor: 'pointer',
          ':hover': {
            transform: 'scale(1.1)'
          }
        }}
      >
        ?
      </Button>

      {/* Help Modal */}
      <Modal 
        opened={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        title="How the System Works" 
        centered
        styles={{
          title: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#006400',
            marginBottom: '20px'
          },
          body: {
            padding: '24px'
          }
        }}
      >
        <Text style={{ lineHeight: 1.6, fontSize: '16px' }}>
          This system allows you to manage your projects and track carbon emissions during development.
          <br /><br />
          1. Create a project by clicking the "Create Project" button which allows you to set a name and a description for your project. It is recommended to start your Project stage in Design.
          <br /><br />
          2. Start a session to track time and emissions.
          <br /><br />
          3. Complete stages to progress through the project lifecycle.
          <br /><br />
          4. Monitor your project history for insights and records.
        </Text>
      </Modal>

      {/* Create Project Modal */}
      <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project">
        <TextInput
          label="Project Name"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ width: '100%' }}
          required
        />
        <TextInput
          label="Project Description"
          placeholder="Project Description"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          style={{ width: '100%' }}
          required
        />
        <Select
          label="Project Stage"
          placeholder="Select a stage"
          data={[
            { value: 'Design: Creating the software architecture', label: 'Design: Creating the software architecture' },
            { value: 'Development: Writing the actual code', label: 'Development: Writing the actual code' },
            { value: 'Testing: Ensuring the software works as expected', label: 'Testing: Ensuring the software works as expected' },
          ]}
          value={projectStage}
          onChange={setProjectStage}
          required
        />
        {error && (
          <Text color="red" style={{ marginTop: '10px', fontSize: '14px' }}>
            {error}
          </Text>
        )}
        <Group align="right" mt="md">
          <Button onClick={createProject} style={{ backgroundColor: '#006400', color: '#fff' }}>Create</Button>
        </Group>
      </Modal>
      
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Project">
        <TextInput 
          label="Project Title"
          placeholder="Project Name" 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)} 
        />
        <TextInput 
          label="Project Description"
          placeholder="Project Description" 
          value={projectDescription} 
          onChange={(e) => setProjectDescription(e.target.value)} 
        />
        <Select
          label="Project Stage"
          placeholder="Select a stage"
          data={[
            { value: 'Design: Creating the software architecture', label: 'Design: Creating the software architecture' },
            { value: 'Development: Writing the actual code', label: 'Development: Writing the actual code' },
            { value: 'Testing: Ensuring the software works as expected', label: 'Testing: Ensuring the software works as expected' },
          ]}
          value={projectStage}
          onChange={setProjectStage}
          className={styles.projectStageDropdown}
        />
        <Group align="right" mt="md">
          <Button onClick={handleSaveChanges} style={{ backgroundColor: '#006400', color: '#fff' }}>Save Changes</Button>
        </Group>
      </Modal>

      <Modal opened={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite User to Project">
        <TextInput
          label="Recipient Email"
          placeholder="Enter the email of the user to invite"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          style={{ width: '100%' }}
          required
        />
        <TextInput
          label="Invitation Message"
          placeholder="Enter your invitation message"
          value={inviteMessage}
          onChange={(e) => setInviteMessage(e.target.value)}
          style={{ width: '100%' }}
          required
        />
        <Group align="right" mt="md">
          <Button onClick={handleSendInvite} style={{ backgroundColor: '#006400', color: '#fff' }}>Send Invitation</Button>
        </Group>
      </Modal>
      
    </Container>
  );
}

export default HistoryComponent;
