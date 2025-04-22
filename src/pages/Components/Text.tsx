import React, { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Modal, Button, Group, Textarea, TextInput, Select, Badge, Text, NumberInput } from '@mantine/core';
import { DatePicker, DateValue } from '@mantine/dates';
import styles from './Text.module.css';

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
  owner: { email: string; name: string; profileImage: string } | null;  // Add owner property
};

const History = () => {
  // Existing task management state
  const [showActiveTasks, setShowActiveTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      project_id: 'PRJ-1',
      title: 'Create draft design for Website using Figma',
      description: 'Design a draft for the new website using Figma.',
      status: 'In Progress',
      type: 'Low',
      assignees: [
        { email: 'user1@example.com', name: 'User 1', role: 'Member', profileImage: '' },
        { email: 'user2@example.com', name: 'User 2', role: 'Member', profileImage: '' },
        { email: 'user3@example.com', name: 'User 3', role: 'Member', profileImage: '' },
        { email: 'user4@example.com', name: 'User 4', role: 'Member', profileImage: '' }
      ],
      spentTime: 6840, // 1:54h in seconds
      isRunning: false,
      startTime: null as number | null,
      carbonEmit: 0,
      leader: null as { email: string; name: string; profileImage: string } | null,
      owner: { email: 'example@example.com', name: 'Example User', profileImage: '' },
      stage_duration: 0,
      stage_start_date: new Date().toISOString().split('T')[0],
      stage_due_date: '',
      project_start_date: new Date().toISOString().split('T')[0],
      project_due_date: ''
    }
  ]);
  const [now, setNow] = useState(Date.now());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    type: 'Design: Creating the software architecture',
    stage_duration: 14,
    stage_start_date: new Date().toISOString().split('T')[0],
    stage_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    project_start_date: new Date().toISOString().split('T')[0],
    project_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignees: [] as { email: string; role: string }[]
  });
  const [selectedTask, setSelectedTask] = useState(null as any);
  const [isEditing, setIsEditing] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState('');

  // New carbon calculation state
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [organization, setOrganization] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);

  // Fetch user details and device type on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found, please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://emission-mah2.onrender.com/user', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setOrganization(data.user.organization);
          fetchUserTasks(data.user.email);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch user details.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while fetching user details.');
      }

      // Fetch device type
      try {
        const deviceResponse = await fetch('http://emission-mah2.onrender.com/checkDeviceType', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (deviceResponse.ok) {
          const { deviceType } = await deviceResponse.json();
          setCurrentDevice(deviceType);
        }
      } catch (err) {
        console.error('Error fetching device type:', err);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, []);

  // Update the fetchUserTasks function to include projects where progress status is either "In Progress" or "Stage Complete"
  const fetchUserTasks = async (email: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://emission-mah2.onrender.com/user_project_display_combined`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const tasksWithMembers = await Promise.all(data.projects.map(async (project: any) => {
          const membersResponse = await fetch(`http://emission-mah2.onrender.com/project/${project.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          let members = [];
          let leader = null;
          let owner = {
            email: project.owner_email,
            name: project.owner_name,
            profileImage: null
          };

          if (membersResponse.ok) {
            const { members: projectMembers } = await membersResponse.json();
            members = projectMembers.map((member: any) => {
              if (member.role === 'project_leader') {
                leader = {
                  email: member.email,
                  name: member.name,
                  profileImage: member.profile_image
                };
              }
              return {
                email: member.email,
                name: member.name,
                role: member.role,
                joinedAt: member.joined_at,
                profileImage: member.profile_image,
                progressStatus: member.progress_status || 'In Progress',
                currentStage: member.current_stage || project.stage
              };
            });
          }

          return {
            id: project.id,
            project_id: project.project_id || project.id.toString(),
            title: project.project_name,
            description: project.project_description,
            status: project.status === 'Archived' ? 'Completed' : 'In Progress',
            type: project.stage,
            assignees: members,
            leader: leader,
            owner: owner,
            spentTime: project.session_duration || 0,
            carbonEmit: project.carbon_emit || 0,
            isRunning: false,
            startTime: null,
            userCompleted: project.progress_status === 'Stage Complete',
            progressStatus: project.progress_status,
            stage_duration: project.stage_duration || 14,
            stage_start_date: project.stage_start_date || new Date().toISOString().split('T')[0],
            stage_due_date: project.stage_due_date || '',
            project_start_date: project.project_start_date || new Date().toISOString().split('T')[0],
            project_due_date: project.project_due_date || ''
          };
        }));

        // Filter out both "Not Started" and "Stage Complete" projects
        const filteredTasks = tasksWithMembers.filter(task => 
          task.progressStatus !== 'Not Started' && task.progressStatus !== 'Stage Complete'
        );

        setTasks(filteredTasks);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while fetching tasks.');
    }
  };

  // Update current time every second if any timers are running
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.some(task => task.isRunning)) {
        setNow(Date.now());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
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

  const handleTimer = async (taskId: number) => {
    const token = localStorage.getItem('token');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    if (task.isRunning) {
      // Stop timer and calculate emissions
      const elapsed = task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0;
      const newSpentTime = task.spentTime + elapsed;

      try {
        // Calculate emissions
        const emissionsEndpoint = currentDevice === 'Laptop' 
          ? 'http://emission-mah2.onrender.com/calculate_emissionsM'
          : 'http://emission-mah2.onrender.com/calculate_emissions';

        const emissionsResponse = await fetch(emissionsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            sessionDuration: elapsed,
            projectId: taskId,
            project_id: task.project_id // Include project_id in emissions calculation
          }),
        });

        let newCarbonEmit = task.carbonEmit;
        if (emissionsResponse.ok) {
          const { carbonEmissions } = await emissionsResponse.json();
          newCarbonEmit = (task.carbonEmit || 0) + carbonEmissions;
        }

        // Fetch project members after stopping
        const membersResponse = await fetch(`http://emission-mah2.onrender.com/project/${taskId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        let updatedAssignees = task.assignees;
        if (membersResponse.ok) {
          const { members } = await membersResponse.json();
          updatedAssignees = members.map((member: any) => ({
            email: member.email,
            name: member.name,
            role: member.role,
            joinedAt: member.joined_at
          }));
        }

        // Update task with new values and send to server
        const updateResponse = await fetch('http://emission-mah2.onrender.com/user_Update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectName: task.title,
            projectDescription: task.description,
            sessionDuration: newSpentTime,
            carbonEmissions: newCarbonEmit,
            projectStage: task.type,
            projectId: taskId,
            project_id: task.project_id // Include project_id in update
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update task');
        }

        // Update local state
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                spentTime: newSpentTime,
                isRunning: false,
                startTime: null,
                carbonEmit: newCarbonEmit,
                assignees: updatedAssignees
              };
            }
            return t;
          });
          
          // Update selected task if it's currently selected
          const updatedTask = updatedTasks.find(t => t.id === taskId);
          if (selectedTask?.id === taskId && updatedTask) {
            setSelectedTask(updatedTask);
          }
          
          return updatedTasks;
        });

      } catch (err) {
        console.error('Error updating task:', err);
      }
    } else {
      // Start timer
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              isRunning: true,
              startTime: Date.now(),
            };
          }
          return t;
        });
        const updatedTask = updatedTasks.find(t => t.id === taskId);
        if (selectedTask?.id === taskId && updatedTask) {
          setSelectedTask(updatedTask);
        }
        return updatedTasks;
      });
    }
  };

  // Function to handle completing a project stage
  const handleComplete = async (taskId: number) => {
    const token = localStorage.getItem('token');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    const projectStages = [
      'Design: Creating the software architecture',
      'Development: Writing the actual code',
      'Testing: Ensuring the software works as expected'
    ];
  
    const currentStageIndex = projectStages.indexOf(task.type);
    const nextStage = currentStageIndex < projectStages.length - 1 ? projectStages[currentStageIndex + 1] : null;
  
    try {
      if (task.isRunning) {
        await handleTimer(taskId);
      }
  
      const notificationId = notifications.show({
        title: 'Completing stage...',
        message: 'Please wait while we process your request',
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });
  
      // Send both the current and next stage to the server
      const completeResponse = await fetch(`http://emission-mah2.onrender.com/complete_project/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          nextStage,
          currentStage: task.type
        }),
      });
  
      try {
        const responseData = await completeResponse.json();
        
        if (!completeResponse.ok) {
          notifications.hide(notificationId);
          notifications.show({
            title: 'Error',
            message: responseData.error || 'Failed to complete project stage',
            color: 'red',
          });
          return; // Don't throw, just return to avoid the uncaught error
        }
  
        // Different status responses from the server
        if (responseData.status === 'Stage-Completed') {
          // All team members have completed this stage, and project has moved to next stage
          notifications.hide(notificationId);
          notifications.show({
            title: 'Success!',
            message: responseData.message,
            color: 'green',
          });
  
          // Refresh the tasks list to get the latest data
          if (user?.email) {
            await fetchUserTasks(user.email);
          }
  
          if (responseData.newStageId && responseData.stage) {
            // If there's a next stage, we might want to redirect or update UI
            // The user's task list will now show the next stage for this project
          }
        } else if (responseData.status === 'Project-Completed') {
          // All stages of this project have been completed successfully
          notifications.hide(notificationId);
          notifications.show({
            title: 'Project Completed!',
            message: 'All stages of this project have been completed successfully.',
            color: 'green',
          });
  
          setTasks(prevTasks => {
            return prevTasks.filter(t => t.id !== taskId);
          });
          
          setSelectedTask(null);
        } else if (responseData.status === 'Stage-User-Completed') {
          // This user has completed their part, but not all team members have finished
          notifications.hide(notificationId);
          
          // Show the progress to the user
          const completedMembers = responseData.completedMembers || 0;
          const totalMembers = responseData.totalMembers || 0;
          const progressPercentage = totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0;
          
          notifications.show({
            title: 'Stage Partially Completed',
            message: (
              <div>
                <p>{responseData.message}</p>
                <p>{completedMembers} out of {totalMembers} team members have completed this stage.</p>
                <div style={{ 
                  height: '6px', 
                  width: '100%', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '3px',
                  marginTop: '8px' 
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${progressPercentage}%`, 
                    backgroundColor: progressPercentage === 100 ? '#52c41a' : '#faad14', 
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}/>
                </div>
              </div>
            ),
            color: 'blue',
            autoClose: false,
          });
          
          // Mark this task as completed for this user in the UI
          setTasks(prevTasks => {
            return prevTasks.map(t => {
              if (t.id === taskId) {
                return {
                  ...t,
                  userCompleted: true
                };
              }
              return t;
            });
          });
          
          // Update the selected task if it's currently selected
          if (selectedTask?.id === taskId) {
            setSelectedTask((prev: Task) => ({ ...prev, userCompleted: true }));
          }
          
          // If there's a new stage ID, check if it's already in our tasks list
          if (responseData.newStageId) {
            const existsInTaskList = tasks.some(t => t.id === responseData.newStageId);
            if (!existsInTaskList) {
              // If the new stage isn't in our tasks list yet, fetch updated tasks
              if (user?.email) {
                await fetchUserTasks(user.email);
              }
            }
          }
        } else {
          // Handle other statuses
          notifications.hide(notificationId);
          notifications.show({
            title: 'Status Updated',
            message: responseData.message || 'Task status updated',
            color: 'blue',
          });
          
          // Make sure to refresh task list even for other statuses
          if (user?.email) {
            await fetchUserTasks(user.email);
          }
        }
      } catch (parseError) {
        // Handle JSON parsing error (if response isn't valid JSON)
        notifications.hide(notificationId);
        notifications.show({
          title: 'Error',
          message: 'Server returned an invalid response. Please try again later.',
          color: 'red',
        });
        console.error('Error parsing server response:', parseError);
      }
    } catch (err) {
      console.error('Error completing project stage:', err);
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to complete project stage',
        color: 'red',
      });
    }
  };

  const handleProjectRequest = async () => {
    if (!newRequest.title || !newRequest.description || !newRequest.type) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      // First check if project with same name exists
      const checkResponse = await fetch('http://emission-mah2.onrender.com/check_existing_projectname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: newRequest.title
        })
      });

      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        setError('A project with this name already exists');
        return;
      }

      // If no duplicate, create the project
      const response = await fetch('http://emission-mah2.onrender.com/user_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: newRequest.title,
          projectDescription: newRequest.description,
          projectStage: 'Design: Creating the software architecture',
          status: 'In Progress',
          organization: organization,
          sessionDuration: 0,
          carbonEmit: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();

      // Update the tasks list with the new project
      const newProject: Task = {
        id: data.projectId,
        project_id: data.projectId.toString(),
        title: newRequest.title,
        description: newRequest.description,
        type: 'Design: Creating the software architecture',
        status: 'In Progress',
        assignees: [],
        spentTime: 0,
        isRunning: false,
        startTime: null,
        carbonEmit: 0,
        leader: null,
        owner: user ? { 
          email: user.email,
          name: user.name,
          profileImage: '' // Changed from null to empty string to match the type
        } : null,
        stage_duration: newRequest.stage_duration,
        stage_start_date: newRequest.stage_start_date,
        stage_due_date: newRequest.stage_due_date,
        project_start_date: newRequest.project_start_date,
        project_due_date: newRequest.project_due_date
      };

      setTasks(prevTasks => [...prevTasks, newProject]);

      // Reset the form with all required fields
      setNewRequest({
        title: '',
        description: '',
        type: 'Design: Creating the software architecture',
        stage_duration: 14,
        stage_start_date: new Date().toISOString().split('T')[0],
        stage_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        project_start_date: new Date().toISOString().split('T')[0],
        project_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignees: []
      });

      setShowAddModal(false);
      
      // Fetch updated tasks list
      if (user?.email) {
        await fetchUserTasks(user.email);
      }

    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    }
  };

  const handleAddAssignee = async () => {
    if (!assigneeEmail) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (selectedTask) {
        // Adding assignee to existing task
        const response = await fetch('http://emission-mah2.onrender.com/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: assigneeEmail,
            projectId: selectedTask.id,
            message: `You have been invited to join the project: ${selectedTask.title}`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send invitation');
        }

        // Update local state for existing task
        setSelectedTask((prevTask: Task) => ({
          ...prevTask,
          assignees: [...prevTask.assignees, { email: assigneeEmail, name: 'Pending...', role: 'Member', profileImage: '' }]
        }));

        // Refresh the project members
        if (user?.email) {
          await fetchUserTasks(user.email);
        }
      } else {
        // Adding assignee to new task
        setNewRequest(prevTask => ({
          ...prevTask,
          assignees: [...prevTask.assignees, { email: assigneeEmail, role: 'Member' }]
        }));
      }

      setAssigneeEmail('');
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation');
    }
  };

  // Update handleEditTask to handle project members
  const handleEditTask = async () => {
    if (!selectedTask) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Format dates to YYYY-MM-DD before sending to server
      const formatDateForServer = (dateString: string) => {
        if (!dateString) return null;
        return new Date(dateString).toISOString().split('T')[0];
      };

      // Update project details
      const updateResponse = await fetch(`http://emission-mah2.onrender.com/update_project/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectName: selectedTask.title,
          projectDescription: selectedTask.description,
          projectStage: selectedTask.type,
          stage_duration: selectedTask.stage_duration,
          stage_start_date: formatDateForServer(selectedTask.stage_start_date),
          stage_due_date: formatDateForServer(selectedTask.stage_due_date),
          project_due_date: formatDateForServer(selectedTask.project_due_date)
        }),
      });

      const responseData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(responseData.error || responseData.details || responseData.message || 'Failed to update project');
      }

      // Refresh tasks list to get updated data
      if (user?.email) {
        await fetchUserTasks(user.email);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
      alert(err instanceof Error ? err.message : 'Unknown error occurred while updating project');
    }
  };

  const activeTasks = tasks.filter(task => task.status === 'In Progress');
  const completedTasks = tasks.filter(task => task.status === 'Completed');

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsEditing(false);
  };

  const closePanel = () => {
    setSelectedTask(null);
    setIsEditing(false);
  };

  const renderAssignees = (assignees: any[]) => {
    // Filter out assignees with role "project_owner"
    const filteredAssignees = assignees.filter(assignee => assignee.role !== 'project_owner');
    const displayedAssignees = filteredAssignees.slice(0, 3);
    const remainingCount = filteredAssignees.length - displayedAssignees.length;

    return (
      <div className={styles.taskAssignees}>
        {displayedAssignees.map((assignee, index) => (
          <div key={index} className={styles.assignee}>
            <img 
              src={assignee.profileImage || '/default-avatar.png'} 
              alt={assignee.name}
              className={styles.assigneeAvatar}
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className={styles.assigneeInfo}>
              <span className={styles.assigneeName}>{assignee.name}</span>
              <span className={styles.assigneeRole}>{assignee.role}</span>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={styles.moreAssignees}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Add a function to calculate progress and status
  const calculateProgress = (task: Task) => {
    if (!task.stage_start_date || !task.stage_due_date) {
      return { progress: 0, status: task.status };
    }

    try {
      const now = new Date();
      const startDate = new Date(task.stage_start_date);
      const dueDate = new Date(task.stage_due_date);

      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        return { progress: 0, status: task.status };
      }

      const totalDuration = dueDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

      let status = task.status;
      if (now > dueDate && status === 'In-Progress') {
        status = 'Delayed';
      } else if (progress > 90 && status === 'In-Progress') {
        status = 'At Risk';
      }

      return { progress, status };
    } catch (e) {
      console.error('Error calculating progress:', e);
      return { progress: 0, status: task.status };
    }
  };

  // Add useEffect to update stage_due_date when stage_duration changes
  useEffect(() => {
    if (newRequest.stage_start_date && newRequest.stage_duration) {
      const startDate = new Date(newRequest.stage_start_date);
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + newRequest.stage_duration);
      setNewRequest(prev => ({
        ...prev,
        stage_due_date: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [newRequest.stage_start_date, newRequest.stage_duration]);

  const handleDateChange = (date: DateValue, field: keyof Task) => {
    if (!selectedTask || !date) return;
    
    setSelectedTask({
      ...selectedTask,
      [field]: date.toISOString().split('T')[0]
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <div className={styles.deviceInfo}>
          <span>Current Device: {currentDevice || 'N/A'}</span>
        </div>
        <button className="addNew" onClick={() => setShowAddModal(true)}>
          + Add new
        </button>
      </div>

      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Project"
        centered
      >
        <div className={styles.addForm}>
          <TextInput
            label="Task Title"
            placeholder="Task title"
            value={newRequest.title}
            onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
            required
          />
          <Textarea
            label="Task Description"
            placeholder="Task description"
            value={newRequest.description}
            onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
            required
          />
          <Select
            label="Project Stage"
            placeholder="Select type"
            value={newRequest.type}
            onChange={(value) => setNewRequest({ ...newRequest, type: value || 'Design: Creating the software architecture' })}
            data={[
              { value: 'Design: Creating the software architecture', label: 'Design: Creating the software architecture' },
              { value: 'Development: Writing the actual code', label: 'Development: Writing the actual code' },
              { value: 'Testing: Ensuring the software works as expected', label: 'Testing: Ensuring the software works as expected' },
            ]}
            required
          />
          <NumberInput
            label="Stage Duration (days)"
            value={newRequest.stage_duration}
            onChange={(value) => {
              const duration = Number(value) || 14;
              const startDate = new Date();
              const dueDate = new Date(startDate);
              dueDate.setDate(startDate.getDate() + duration);
              
              setNewRequest({
                ...newRequest,
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
            <Text size="sm" fw={500} style={{ marginTop: '1rem' }}>Timeline Dates</Text>
            <Text size="xs" color="dimmed">Start Date: {formatDate(newRequest.stage_start_date)}</Text>
            <Text size="xs" color="dimmed">Due Date: {formatDate(newRequest.stage_due_date)}</Text>
          </div>
          <Group align="right" mt="md">
            <Button onClick={handleProjectRequest} style={{ backgroundColor: '#006400', color: '#fff' }}>Submit Request</Button>
          </Group>
        </div>
      </Modal>

      <div className={styles.taskList}>
        <div className={styles.taskSection}>
          <div className={styles.taskSectionHeader} onClick={() => setShowActiveTasks(!showActiveTasks)}>
            Active tasks ({activeTasks.length})
          </div>
          {showActiveTasks && (
            <table className={styles.taskTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Leader</th>
                  <th>Assignees</th>
                  <th>Timeline</th>
                  <th>Progress</th>
                  <th>Spent Time</th>
                  <th>Carbon Emissions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((task) => {
                  const currentSeconds = task.isRunning 
                    ? task.spentTime + (task.startTime ? Math.floor((Date.now() - task.startTime) / 1000) : 0)
                    : task.spentTime;

                  const { progress, status } = calculateProgress(task);
                  const progressColor = status === 'Delayed' ? 'red' 
                    : status === 'At Risk' ? 'yellow' 
                    : 'green';

                  const daysRemaining = Math.ceil((new Date(task.stage_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={task.id} onClick={() => handleTaskClick(task)}>
                      <td>{task.title}</td>
                      <td>
                        <Badge 
                          color={status === 'Delayed' ? 'red' : status === 'At Risk' ? 'yellow' : 'green'}
                        >
                          {status}
                        </Badge>
                      </td>
                      <td>{task.type}</td>
                      <td>
                        {task.owner && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={task.owner.profileImage || `https://www.gravatar.com/avatar/${task.owner.email}?d=identicon&s=24`}
                              alt={task.owner.name}
                              style={{ borderRadius: '50%', width: '24px', height: '24px' }}
                            />
                            <span>{task.owner.name || task.owner.email}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {task.leader && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={task.leader.profileImage || `https://www.gravatar.com/avatar/${task.leader.email}?d=identicon&s=24`}
                              alt={task.leader.name}
                              style={{ borderRadius: '50%', width: '24px', height: '24px' }}
                            />
                            <span>{task.leader.name || task.leader.email}</span>
                          </div>
                        )}
                      </td>
                      <td>{renderAssignees(task.assignees)}</td>
                      <td>
                        <div className={styles.timelineInfo}>
                          <div>Start: {new Date(task.stage_start_date).toLocaleDateString()}</div>
                          <div>Due: {new Date(task.stage_due_date).toLocaleDateString()}</div>
                          <div>{daysRemaining} days remaining</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: progressColor 
                            }} 
                          />
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td>{formatTime(currentSeconds)}</td>
                      <td>{task.carbonEmit ? `${task.carbonEmit.toFixed(2)} kg CO2` : '0 kg CO2'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            {isEditing ? (
              <TextInput
                label="Task Title"
                value={selectedTask.title}
                onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            ) : (
              <h2>{selectedTask.title}</h2>
            )}
            <button className={styles.exitButton} onClick={closePanel}>✖</button>
          </div>
          <div className={styles.panelContent}>
            {isEditing ? (
              <>
                <Textarea
                  label="Task Description"
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
                <NumberInput
                  label="Stage Duration (days)"
                  value={selectedTask.stage_duration || 14}
                  onChange={(value) => {
                    const duration = Number(value);
                    if (!isNaN(duration) && duration > 0) {
                      const startDate = new Date(selectedTask.stage_start_date || new Date());
                      const dueDate = new Date(startDate);
                      dueDate.setDate(startDate.getDate() + duration);
                      setSelectedTask({
                        ...selectedTask,
                        stage_duration: duration,
                        stage_due_date: dueDate.toISOString().split('T')[0]
                      });
                    }
                  }}
                  min={1}
                  max={365}
                />
                
                
              </>
            ) : (
              <>
                <p>{selectedTask.description}</p>
                <div className={styles.timelineDetails}>
                  <h3>Timeline Details</h3>
                  <div className={styles.timelineGrid}>
                    <div>
                      <strong>Stage Duration:</strong> {selectedTask.stage_duration} days
                    </div>
                    <div>
                      <strong>Stage Start:</strong> {formatDate(selectedTask.stage_start_date)}
                    </div>
                    <div>
                      <strong>Stage Due:</strong> {formatDate(selectedTask.stage_due_date)}
                    </div>
                    <div>
                      <strong>Project Due:</strong> {formatDate(selectedTask.project_due_date)}
                    </div>
                  </div>
                  <div className={styles.progressSection}>
                    <strong>Progress:</strong>
                    {(() => {
                      const { progress, status } = calculateProgress(selectedTask);
                      const daysLeft = selectedTask.stage_due_date ? 
                        Math.ceil((new Date(selectedTask.stage_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
                        0;

                      return (
                        <>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: status === 'Delayed' ? '#ff4d4f' : 
                                               status === 'At Risk' ? '#faad14' : 
                                               '#52c41a'
                              }} 
                            />
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className={styles.progressInfo}>
                            <Badge 
                              color={status === 'Delayed' ? 'red' : 
                                    status === 'At Risk' ? 'yellow' : 
                                    'green'}
                            >
                              {status}
                            </Badge>
                            {daysLeft > 0 && (
                              <Text size="sm" color="dimmed">
                                {daysLeft} days remaining
                              </Text>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
            <div className={styles.taskMeta}>
              <p><strong>Status:</strong> {selectedTask.status}</p>
              <p><strong>Type:</strong> {selectedTask.type}</p>
            </div>
            {selectedTask.leader && (
              <div className={styles.leaderSection}>
                <strong>Project Leader:</strong>
                <div className={styles.assignee}>
                  <img 
                    src={selectedTask.leader.profileImage || '/default-avatar.png'} 
                    alt={selectedTask.leader.name}
                    className={styles.assigneeAvatar}
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className={styles.assigneeInfo}>
                    <span className={styles.assigneeName}>{selectedTask.leader.name}</span>
                    <span className={styles.assigneeRole}>Leader</span>
                  </div>
                </div>
              </div>
            )}
            <p><strong>Spent Time:</strong> {formatTime(selectedTask.isRunning ? 
              selectedTask.spentTime + Math.floor((Date.now() - selectedTask.startTime) / 1000) : 
              selectedTask.spentTime)}</p>
            <p><strong>Carbon Emissions:</strong> {selectedTask.carbonEmit ? 
              `${selectedTask.carbonEmit.toFixed(2)} kg CO2` : '0 kg CO2'}</p>
            <div className={styles.taskAssignees}>
              <strong>Team Members:</strong>
              {renderAssignees(selectedTask.assignees)}
            </div>
            {isEditing && (
              <div className={styles.editAssigneeSection}>
                <TextInput
                  label="Add Assignee"
                  placeholder="Enter assignee email"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                />
                <Button onClick={handleAddAssignee}>Add Assignee</Button>
              </div>
            )}
            <div className={styles.panelButtons}>
              {isEditing ? (
                <Button onClick={handleEditTask} className={styles.saveButton}>Save</Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className={styles.editButton}>Edit</Button>
              )}
              {selectedTask.status !== 'Completed' && (
                <>
                  <Button onClick={() => handleTimer(selectedTask.id)} 
                          className={selectedTask.isRunning ? styles.stopButton : styles.startButton}>
                    {selectedTask.isRunning ? '⏹ Stop' : '▶ Start'}
                  </Button>
                  <Button onClick={() => handleComplete(selectedTask.id)} className={styles.completeButton}>
                    ✓ Complete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;