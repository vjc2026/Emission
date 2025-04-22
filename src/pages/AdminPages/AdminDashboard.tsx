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
  Paper,
  Stack
} from '@mantine/core';
import classes from './AdminDashboard.module.css';
import { notifications } from '@mantine/notifications';

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
  project_leader?: string;
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

    const response = await fetch(`http://emission-mah2.onrender.com/project_members/${projectId}`, {
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
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Add a function to calculate days remaining
const calculateDaysRemaining = (dueDate: string | undefined, status?: string) => {
  if (!dueDate) return 'No due date';
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0 && status !== 'Complete') {
    return <span className={classes.pastDue}>Past due</span>;
  }
  return diffDays > 0 ? `${diffDays} days remaining` : 'Past due';
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

const checkAndUpdateProjectStatus = async (projectId: number, 
  projectsState: Project[], 
  sortedDataState: Project[], 
  selectedProjectState: Project | null, 
  updateFunctions: {
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
    setSortedData: React.Dispatch<React.SetStateAction<Project[]>>,
    setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>
  }
) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    // First, fetch all project members
    const response = await fetch(`http://emission-mah2.onrender.com/project_members/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const members = data.members || [];

    // Filter out project owners as they don't contribute to project completion
    // This is the key change - make sure we're excluding project_owner role in all project status checks
    const contributingMembers = members.filter(
      (member: { role: string }) => member.role !== 'project_owner'
    );

    // If there are no contributing members, return early
    if (contributingMembers.length === 0) {
      return false;
    }

    // Check if all contributing members have completed their stages
    const allCompleted = contributingMembers.every(
      (member: { progress_status: string }) => member.progress_status === 'Stage Complete'
    );

    // If all members have completed their stages, update the project status to "Complete"
    if (allCompleted) {
      // Get current project data to preserve other fields
      const currentProject = projectsState.find(p => p.id === projectId);
      if (!currentProject) {
        throw new Error('Project not found in state');
      }

      // Update project status to "Complete"
      const updateResponse = await fetch(`http://emission-mah2.onrender.com/admin/update_project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: currentProject.project_name,
          projectDescription: currentProject.project_description,
          status: 'Complete',
          stage_start_date: currentProject.stage_start_date,
          stage_due_date: currentProject.stage_due_date,
          project_due_date: currentProject.project_due_date
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update project status: ${errorData.error || errorData.message || 'Unknown error'}`);
      }

      // Show notification to admin
      notifications.show({
        title: 'Project Completed',
        message: `Project "${currentProject.project_name}" has been marked as Complete because all team members have completed their stages.`,
        color: 'green',
      });

      // Update local state
      updateFunctions.setProjects(projectsState.map(project => 
        project.id === projectId ? { ...project, status: 'Complete' } : project
      ));
      
      updateFunctions.setSortedData(sortedDataState.map(project => 
        project.id === projectId ? { ...project, status: 'Complete' } : project
      ));

      // Update selected project if it's currently selected
      if (selectedProjectState && selectedProjectState.id === projectId) {
        updateFunctions.setSelectedProject({ ...selectedProjectState, status: 'Complete' });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking project completion status:', error);
    notifications.show({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Failed to check project completion status',
      color: 'red',
    });
    return false;
  }
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
    project_leader: '', // Add project leader field
    organization: '', // This will be set automatically based on owner
    members: [] as string[],
    created_at: new Date().toISOString(),
    stage_duration: 14, // Default 14 days
    stage_start_date: new Date().toISOString().split('T')[0], // Today's date
    stage_due_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0], // Today + 14 days
    project_start_date: new Date().toISOString().split('T')[0], // Today's date
    project_due_date: new Date(new Date().setDate(new Date().getDate() + 42)).toISOString().split('T')[0], // Today + 42 days
  });
  const [newProjectAssignee, setNewProjectAssignee] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState(''); // Add state for assignee email
  const [assigneeError, setAssigneeError] = useState<string>('');
  const [newProjectAssigneeError, setNewProjectAssigneeError] = useState<string>('');
  const [createErrors, setCreateErrors] = useState({
    project_name: '',
    project_description: '',
    owner: ''
  });
  const [editStatus, setEditStatus] = useState('');
  const [editStageStartDate, setEditStageStartDate] = useState('');
  const [editStageDueDate, setEditStageDueDate] = useState('');
  const [editProjectDueDate, setEditProjectDueDate] = useState('');
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

        const response = await fetch('http://emission-mah2.onrender.com/all_user_projects_admin', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched projects:', data); // Debug log

        // Process all projects with error handling
        const projectsWithMembers = await Promise.all(
          (data.projects || []).map(async (project: Project) => {
            try {
              const members = await fetchProjectMembers(project.id);
              return { ...project, members };
            } catch (error) {
              console.error(`Error fetching members for project ${project.id}:`, error);
              return { ...project, members: [] };
            }
          })
        );

        console.log('Total projects fetched:', projectsWithMembers.length); // Debug log
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

  // Add an effect to check project completion status periodically
  useEffect(() => {
    // Don't run if there are no projects
    if (projects.length === 0) return;
    
    // Check all projects on initial load
    const checkAllProjects = async () => {
      for (const project of projects) {
        // Skip already completed projects
        if (project.status === 'Complete') continue;
        
        // Check and update project status
        await checkAndUpdateProjectStatus(
          project.id, 
          projects, 
          sortedData, 
          selectedProject, 
          { setProjects, setSortedData, setSelectedProject }
        );
      }
    };
    
    // Run immediately and set up interval
    checkAllProjects();
    
    // Check every 2 minutes
    const intervalId = setInterval(checkAllProjects, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [projects, sortedData, selectedProject]);

  // Add an effect to check selected project completion status when it changes
  useEffect(() => {
    if (selectedProject && selectedProject.status !== 'Complete') {
      checkAndUpdateProjectStatus(
        selectedProject.id, 
        projects, 
        sortedData, 
        selectedProject, 
        { setProjects, setSortedData, setSelectedProject }
      );
    }
  }, [selectedProject?.id]);

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

      const response = await fetch(`http://emission-mah2.onrender.com/admin/delete_project/${selectedProject.id}`, {
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
      setEditStatus(selectedProject.status);
      setEditStageStartDate(selectedProject.stage_start_date || '');
      setEditStageDueDate(selectedProject.stage_due_date || '');
      setEditProjectDueDate(selectedProject.project_due_date || '');
      setIsEditModalOpen(true);
    }
  };

  // Function to handle saving the edited project
  const handleSaveEdit = async () => {
    if (selectedProject) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        // Validate required fields
        if (!editTitle.trim()) {
          throw new Error('Project title is required');
        }

        if (!editDescription.trim()) {
          throw new Error('Project description is required');
        }

        const response = await fetch(`http://emission-mah2.onrender.com/admin/update_project/${selectedProject.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectName: editTitle,
            projectDescription: editDescription,
            status: editStatus,
            stage_start_date: editStageStartDate,
            stage_due_date: editStageDueDate,
            project_due_date: editProjectDueDate,
            // Add these fields to preserve ownership
            owner_email: selectedProject.owner,
            project_leader: selectedProject.project_leader
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update project');
        }

        const updatedProject = {
          ...selectedProject,
          project_name: editTitle,
          project_description: editDescription,
          status: editStatus,
          stage_start_date: editStageStartDate,
          stage_due_date: editStageDueDate,
          project_due_date: editProjectDueDate,
        };

        setProjects(projects.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
        setSortedData(sortedData.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
        setSelectedProject(updatedProject);
        setIsEditModalOpen(false);
      } catch (error) {
        console.error('Error updating project:', error);
        // Show error message to the user
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        // Keep the modal open when there's an error
      }
    }
  };

  const handleCreateProject = async () => {
    setCreateErrors({
      project_name: '',
      project_description: '',
      owner: ''
    });
  
    let hasError = false;
    const newErrors = {
      project_name: '',
      project_description: '',
      owner: ''
    };
  
    if (!newProject.project_name.trim()) {
      newErrors.project_name = 'Project title is required';
      hasError = true;
    }
  
    if (!newProject.project_description.trim()) {
      newErrors.project_description = 'Project description is required';
      hasError = true;
    }
  
    if (!newProject.owner.trim()) {
      newErrors.owner = 'Owner email is required';
      hasError = true;
    }
  
    if (hasError) {
      setCreateErrors(newErrors);
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // First, create or get the temporary user for the owner email
      // This endpoint will create a new user if they don't exist
      // or return the existing user if they do
      const createTempUserResponse = await fetch('http://emission-mah2.onrender.com/create_temp_user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newProject.owner,
          organization: "External" // Set organization as "External" for temporary users
        }),
      });

      if (!createTempUserResponse.ok) {
        const error = await createTempUserResponse.json();
        throw new Error(error.error || 'Failed to process owner user');
      }

      // Determine the organization for the project
      let projectOrganization = "External"; // Default organization
        // If there's a project leader assigned, try to get their organization
      if (newProject.project_leader && newProject.project_leader.trim()) {
        try {
          // Fetch the project leader's details to get their organization
          const leaderResponse = await fetch(`http://emission-mah2.onrender.com/user_organization/${newProject.project_leader}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (leaderResponse.ok) {
            const leaderData = await leaderResponse.json();
            if (leaderData.organization) {
              projectOrganization = leaderData.organization;
              console.log(`Using project leader's organization: ${projectOrganization}`);
            }
          } else {
            console.warn(`Couldn't fetch project leader's organization, using default: External`);
          }
        } catch (leaderError) {
          console.error("Error fetching project leader's organization:", leaderError);
          // Continue with default organization if there was an error
        }
      }

      // Now create the project with the determined organization
      const projectToCreate = {
        ...newProject,
        owner_email: newProject.owner,
        leader_email: newProject.project_leader,
        members: [...newProject.members], // Make sure we're sending all members
        session_duration: 0,
        carbon_emit: 0,
        organization: projectOrganization // Use the determined organization
      };
  
      console.log("Creating project with members:", projectToCreate.members); // Add debugging
  
      const response = await fetch('http://emission-mah2.onrender.com/admin/create_project', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectToCreate),
      });
  
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create project');
      }

      // Ensure the response data has session_duration and carbon_emit set to 0
      const projectWithDefaults = {
        ...responseData,
        session_duration: responseData.session_duration || 0,
        carbon_emit: responseData.carbon_emit || 0
      };
  
      setProjects([...projects, projectWithDefaults]);
      setSortedData([...projects, projectWithDefaults]);
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
        project_leader: '',
        organization: '',
        members: [],
        created_at: new Date().toISOString(),
        stage_duration: 14,
        stage_start_date: new Date().toISOString().split('T')[0],
        stage_due_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
        project_start_date: new Date().toISOString().split('T')[0],
        project_due_date: new Date(new Date().setDate(new Date().getDate() + 42)).toISOString().split('T')[0],
      });
      setNewProjectAssignee('');
  
      // Show success notification
      notifications.show({
        title: 'Project Created',
        message: `Project "${projectToCreate.project_name}" has been created successfully.`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      // Show error notification
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
        color: 'red',
      });
    }
  };
  

  const validateEmail = async (email: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://emission-mah2.onrender.com/validate_user_email/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  };

  const handleAddAssignee = async () => {
    if (selectedProject && assigneeEmail) {
      try {
        // Reset error message at the start
        setAssigneeError('');

        const token = localStorage.getItem('token');
        if (!token) {
          setAssigneeError('Authentication error');
          return;
        }

        // Check if assignee email is the same as owner email
        if (assigneeEmail.toLowerCase() === selectedProject.owner.toLowerCase()) {
          setAssigneeError('Owner cannot be added as an assignee');
          return;
        }

        // Check if user is already a member
        if (selectedProject.members.includes(assigneeEmail)) {
          setAssigneeError('User is already a member of this project');
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(assigneeEmail)) {
          setAssigneeError('Invalid email format');
          return;
        }

        // Check if user exists in database
        const userExists = await validateEmail(assigneeEmail);
        if (!userExists) {
          setAssigneeError('User not found in the system');
          return;
        }

        // If we get here, the email is valid, so clear any error
        setAssigneeError('');

        const response = await fetch('http://emission-mah2.onrender.com/add_project_member', {
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
          setAssigneeError(errorData.error || 'Failed to add member');
          return;
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
        setAssigneeError('');
      } catch (error) {
        console.error('Error adding assignee:', error);
        setAssigneeError(error instanceof Error ? error.message : "An error occurred");
      }
    }
  };

  const handleAddNewProjectAssignee = async () => {
    if (newProjectAssignee) {
      try {
        // Reset error message at the start
        setNewProjectAssigneeError('');

        // Check if owner field is empty
        if (!newProject.owner.trim()) {
          setNewProjectAssigneeError('Please fill in the Owner Email field first');
          return;
        }

        // Check if assignee email is the same as owner email 
        // Note: Owners can only be listed once per project
        if (newProjectAssignee === newProject.owner) {
          setNewProjectAssigneeError('Owner is already included as the client and cannot be added as a team member');
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newProjectAssignee)) {
          setNewProjectAssigneeError('Invalid email format');
          return;
        }

        // Check if user exists in database
        const userExists = await validateEmail(newProjectAssignee);
        if (!userExists) {
          setNewProjectAssigneeError('User not found in the system');
          return;
        }

        // Check if user is already added as a member
        if (newProject.members.includes(newProjectAssignee)) {
          setNewProjectAssigneeError('User is already added as a member');
          return;
        }

        // If we get here, the email is valid, so clear any error
        setNewProjectAssigneeError('');

        setNewProject({
          ...newProject,
          members: [...newProject.members, newProjectAssignee]
        });
        setNewProjectAssignee('');
      } catch (error) {
        setNewProjectAssigneeError(error instanceof Error ? error.message : "An error occurred");
      }
    }
  };

  const columns = [
    { key: 'project_name', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'stage', label: 'Stage' },
    { key: 'carbon_emit', label: 'Carbon' },
    { key: 'owner', label: 'Owner' },
    { key: 'timeline', label: 'Timeline' }
  ];

  const rows = sortedData.map((project) => (
    <React.Fragment key={project.id}>
      <tr 
        onClick={() => setSelectedProject(project)}
        className={`${classes.projectRow} ${selectedProject?.id === project.id ? classes.selectedRow : ''}`}
      >
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              <div>
                <div>{project.project_name}</div>
                <Text size="xs" color="dimmed" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {project.project_description}
                </Text>
              </div>
            </div>
          </div>
        </td>
        <td>
          <Badge 
            variant="light"
            radius="sm"
            size="sm"
            color={
              project.status === 'Complete' ? 'blue' :
              project.status === 'Archived' ? 'gray' :
              'green'
            }
          >
            {project.status}
          </Badge>
        </td>
        <td style={{ maxWidth: '200px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: project.stage.includes('Design') ? '#22c55e' :
                          project.stage.includes('Development') ? '#3b82f6' :
                          '#a855f7'
              }} />
              {project.stage.split(':')[0]}
            </div>
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
          </div>
        </td>
        <td>
          <Text size="sm" fw={500} color={project.carbon_emit > 10 ? 'red' : 'green'}>
            {project.carbon_emit.toFixed(2)} kg CO2
          </Text>
        </td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src={`https://www.gravatar.com/avatar/${project.owner}?d=identicon&s=24`}
                alt={project.owner}
                style={{ borderRadius: '50%', width: '24px', height: '24px' }}
              />
              <div>
                <div>{project.owner.split('@')[0]}</div>
                <Badge variant="dot" size="xs" color="gray">
                  {project.organization}
                </Badge>
              </div>
            </div>
          </div>
        </td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text size="xs">Stage: {formatDate(project.stage_due_date)}</Text>
            <Text size="xs" c="dimmed">{calculateDaysRemaining(project.stage_due_date, project.status)}</Text>
          </div>
        </td>
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
                <Th sorted={sortBy === 'project_name'} reversed={reverseSortDirection} onSort={() => setSorting('project_name')}>Project</Th>
                <Th sorted={sortBy === 'status'} reversed={reverseSortDirection} onSort={() => setSorting('status')}>Status</Th>
                <Th sorted={sortBy === 'stage'} reversed={reverseSortDirection} onSort={() => setSorting('stage')}>Stage & Progress</Th>
                <Th sorted={sortBy === 'carbon_emit'} reversed={reverseSortDirection} onSort={() => setSorting('carbon_emit')}>Carbon</Th>
                <Th sorted={sortBy === 'owner'} reversed={reverseSortDirection} onSort={() => setSorting('owner')}>Owner</Th>
                <Th sorted={sortBy === 'stage_due_date'} reversed={reverseSortDirection} onSort={() => setSorting('stage_due_date')}>Timeline</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <tr>
                  <td colSpan={6}>
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
                <Group mb="md">
                  <div>
                    <Text size="sm" fw={500} c="dimmed">Owner</Text>
                    <Group>
                      <img 
                        src={`https://www.gravatar.com/avatar/${selectedProject.owner}?d=identicon&s=24`}
                        alt={selectedProject.owner}
                        style={{ borderRadius: '50%', width: '24px', height: '24px' }}
                      />
                      <Text>{selectedProject.owner}</Text>
                    </Group>
                  </div>
                </Group>
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
                  <Text size="sm" fw={500} c="dimmed" mb="xs">Timeline</Text>
                  <div className={classes.timelineDates}>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Stage Start</Text>
                      <Text>{formatDate(selectedProject.stage_start_date)}</Text>
                    </div>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Stage Due</Text>
                      <Text>{formatDate(selectedProject.stage_due_date)}</Text>
                      <Text size="xs" c="dimmed">
                        {calculateDaysRemaining(selectedProject.stage_due_date, selectedProject.status)}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Project Start</Text>
                      <Text>{formatDate(selectedProject.project_start_date)}</Text>
                    </div>
                    <div>
                      <Text size="sm" fw={500} c="dimmed">Project Due</Text>
                      <Text>{formatDate(selectedProject.project_due_date)}</Text>
                      <Text size="xs" c="dimmed">
                        {calculateDaysRemaining(selectedProject.project_due_date, selectedProject.status)}
                      </Text>
                    </div>
                  </div>
                </Paper>

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
                <Text size="sm" fw={500} c="dimmed">Team Members</Text>
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
            onChange={(e) => {
              setAssigneeEmail(e.target.value);
              // Clear error when user starts typing
              if (assigneeError) setAssigneeError('');
            }}
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
          {assigneeError && (
            <p className={classes.errorText}>{assigneeError}</p>
          )}

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
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateErrors({
              project_name: '',
              project_description: '',
              owner: ''
            });
          }}
          title="Create New Project"
          size="lg"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <TextInput
                label="Project Title"
                value={newProject.project_name}
                onChange={(event) => {
                  setNewProject({ ...newProject, project_name: event.currentTarget.value });
                  if (createErrors.project_name) {
                    setCreateErrors({ ...createErrors, project_name: '' });
                  }
                }}
                required
                error={createErrors.project_name}
              />
            </div>

            <div>
              <Textarea
                label="Project Description"
                value={newProject.project_description}
                onChange={(event) => {
                  setNewProject({ ...newProject, project_description: event.currentTarget.value });
                  if (createErrors.project_description) {
                    setCreateErrors({ ...createErrors, project_description: '' });
                  }
                }}
                required
                error={createErrors.project_description}
              />
            </div>

            <Paper p="md" withBorder mb="lg">
              <Text fw={500} size="sm" mb="md">Project Leadership</Text>
              <Stack gap="md">
                <div>
                  <TextInput
                    label="Project Owner (Client)"
                    description="External stakeholder who commissioned the project"
                    placeholder="Enter client's email"
                    value={newProject.owner}
                    onChange={(event) => {
                      setNewProject({ ...newProject, owner: event.currentTarget.value });
                      if (createErrors.owner) {
                        setCreateErrors({ ...createErrors, owner: '' });
                      }
                    }}
                    required
                    error={createErrors.owner}
                  />
                  <Text size="xs" color="dimmed" mt={4}>This person will handle business decisions and project objectives</Text>
                </div>
                
                <div>
                  <TextInput
                    label="Project Leader (Team Manager)"
                    description="Internal team manager responsible for project execution"
                    placeholder="Enter team manager's email"
                    value={newProject.project_leader}
                    onChange={(event) => {
                      setNewProject({ ...newProject, project_leader: event.currentTarget.value });
                    }}
                    required
                  />
                  <Text size="xs" color="dimmed" mt={4}>This person will manage daily operations and team productivity</Text>
                </div>
              </Stack>
            </Paper>

            {/* Timeline Section */}
            <Paper p="md" withBorder>
              <Text size="sm" fw={500} mb="md">Timeline Settings</Text>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <Group grow>
                  <TextInput
                    type="number"
                    label="Stage Duration (days)"
                    value={newProject.stage_duration}
                    onChange={(event) => {
                      // Handle empty or invalid input
                      const inputValue = event.currentTarget.value;
                      const duration = inputValue === '' ? 0 : Math.max(0, parseInt(inputValue));
                      
                      // Calculate new due date based on start date and duration
                      const stageStart = new Date(newProject.stage_start_date);
                      const stageDue = new Date(stageStart);
                      stageDue.setDate(stageStart.getDate() + duration);
                      
                      setNewProject({
                        ...newProject,
                        stage_duration: duration,
                        stage_due_date: stageDue.toISOString().split('T')[0]
                      });
                    }}
                    min={0}
                    error={newProject.stage_duration === 0 ? "Duration cannot be 0 days" : null}
                  />
                  <TextInput
                    type="date"
                    label="Stage Start Date"
                    value={newProject.stage_start_date}
                    onChange={(event) => {
                      const startDate = event.currentTarget.value;
                      const start = new Date(startDate);
                      const due = new Date(newProject.stage_due_date);
                      
                      // Only update if stage start is before stage due
                      if (start <= due) {
                        setNewProject({
                          ...newProject,
                          stage_start_date: startDate
                        });
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]} // Cannot select past dates
                  />
                  <TextInput
                    type="date"
                    label="Stage Due Date"
                    value={newProject.stage_due_date}
                    onChange={(event) => {
                      const dueDate = event.currentTarget.value;
                      const start = new Date(newProject.stage_start_date);
                      const due = new Date(dueDate);
                      
                      // Calculate duration based on selected dates
                      const diffTime = due.getTime() - start.getTime();
                      const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      // Only update if due date is after start date
                      if (duration >= 0) {
                        setNewProject({
                          ...newProject,
                          stage_due_date: dueDate,
                          stage_duration: duration
                        });
                      }
                    }}
                    min={newProject.stage_start_date} // Cannot select date before start date
                    error={new Date(newProject.stage_due_date) <= new Date(newProject.stage_start_date) ? 
                      "Due date must be after start date" : null}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    type="date"
                    label="Project Start Date"
                    value={newProject.project_start_date}
                    onChange={(event) => {
                      const startDate = event.currentTarget.value;
                      const start = new Date(startDate);
                      const due = new Date(newProject.project_due_date);
                      
                      // Only update if project start is before project due
                      if (start <= due) {
                        setNewProject({ ...newProject, project_start_date: startDate });
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]} // Cannot select past dates
                  />
                  <TextInput
                    type="date"
                    label="Project Due Date"
                    value={newProject.project_due_date}
                    onChange={(event) => {
                      const dueDate = event.currentTarget.value;
                      const start = new Date(newProject.project_start_date);
                      const due = new Date(dueDate);
                      
                      // Only update if project due is after project start
                      if (due >= start) {
                        setNewProject({ ...newProject, project_due_date: dueDate });
                      }
                    }}
                    min={newProject.project_start_date} // Cannot select date before project start
                    error={new Date(newProject.project_due_date) <= new Date(newProject.project_start_date) ? 
                      "Project due date must be after start date" : null}
                  />
                </Group>
              </div>
            </Paper>

            <Paper p="md" withBorder>
              <Text size="sm" fw={500} mb="md">Team Members</Text>
              <div className={classes.assigneeSection}>
                <TextInput
                  label="Add Team Member (Email)"
                  value={newProjectAssignee}
                  onChange={(e) => {
                    setNewProjectAssignee(e.target.value);
                    // Clear error when user starts typing
                    if (newProjectAssigneeError) setNewProjectAssigneeError('');
                  }}
                  placeholder="Enter team member email"
                  className={`p-2 border rounded flex-1 ${
                    newProjectAssigneeError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <Button onClick={handleAddNewProjectAssignee} size="sm" mt="sm">
                  Add Team Member
                </Button>
                {newProjectAssigneeError && (
                  <p className={classes.errorText}>{newProjectAssigneeError}</p>
                )}
              </div>

              {newProject.members.length > 0 && (
                <div className={classes.assigneesList}>
                  <Text fw={500} mt="md">Added Team Members:</Text>
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
            </Paper>

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
              <Button variant="light" onClick={() => {
                setIsCreateModalOpen(false);
                setCreateErrors({
                  project_name: '',
                  project_description: '',
                  owner: ''
                });
              }}>Cancel</Button>
              <Button color="blue" onClick={handleCreateProject}>Create</Button>
            </Group>
          </div>
        </Modal>

        <Modal
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Project"
          size="lg"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <TextInput
              label="Project Title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.currentTarget.value)}
              placeholder={selectedProject?.project_name}
              required
            />

            <Textarea
              label="Project Description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.currentTarget.value)}
              placeholder={selectedProject?.project_description}
              required
              minRows={3}
            />

            <Select
              label="Status"
              value={editStatus}
              onChange={(value) => setEditStatus(value || '')}
              data={['In Progress', 'Complete', 'Archived']}
              placeholder={selectedProject?.status}
              required
            />

            <Select
              label="Stage"
              value={selectedProject?.stage}
              onChange={(value) => setEditStatus(value || '')}
              data={['Design: Creating the software architecture', 'Development: Writing the actual code', 'Testing: Ensuring the software works as expected']}
              placeholder={selectedProject?.stage}
              required
            />

            <Paper p="md" withBorder>
              <Text size="sm" fw={500} mb="md">Timeline Settings</Text>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <Group grow>
                  <TextInput
                    type="date"
                    label="Stage Start Date"
                    value={editStageStartDate}
                    onChange={(event) => setEditStageStartDate(event.currentTarget.value)}
                    placeholder={selectedProject?.stage_start_date}
                  />
                  <TextInput
                    type="date"
                    label="Stage Due Date"
                    value={editStageDueDate}
                    onChange={(event) => setEditStageDueDate(event.currentTarget.value)}
                    min={editStageStartDate}
                    placeholder={selectedProject?.stage_due_date}
                    error={editStageDueDate && editStageStartDate && new Date(editStageDueDate) <= new Date(editStageStartDate) ? 
                      "Due date must be after start date" : null}
                  />
                </Group>

                <TextInput
                  type="date"
                  label="Project Due Date"
                  value={editProjectDueDate}
                  onChange={(event) => setEditProjectDueDate(event.currentTarget.value)}
                  min={editStageStartDate}
                  placeholder={selectedProject?.project_due_date}
                  error={editProjectDueDate && editStageStartDate && new Date(editProjectDueDate) <= new Date(editStageStartDate) ? 
                    "Project due date must be after stage start date" : null}
                />
              </div>
            </Paper>

            <Paper p="md" withBorder>
              <Text size="sm" fw={500} mb="md">Team Members</Text>
              <TextInput
                label="Add Member by Email"
                placeholder="Enter member email"
                value={assigneeEmail}
                onChange={(e) => {
                  setAssigneeEmail(e.target.value);
                  if (assigneeError) setAssigneeError('');
                }}
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
              {assigneeError && (
                <p className={classes.errorText}>{assigneeError}</p>
              )}

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
            </Paper>

            <Group justify="flex-end" mt="xl">
              <Button 
                variant="light" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button color="blue" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </Group>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;