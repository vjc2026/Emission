import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from './AdminLayout';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Group,
  Text,
  ScrollArea,
  Table,
  Paper,
  Stack,
  Modal,
  Textarea,
  LoadingOverlay,
  Title
} from '@mantine/core';
import classes from './AdminDashboard.module.css';
import { notifications } from '@mantine/notifications';

interface ProjectRequest {
  id: number;
  title: string;
  description: string;
  project_stage: string;
  organization: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name: string;
  user_email: string;
  stage_duration: number;
  stage_start_date: string;
  stage_due_date: string;
  project_start_date: string;
  project_due_date: string;
  review_notes?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const AdminProjectRequests: React.FC = () => {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('https://emission-mah2.onrender.com/admin/project-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch project requests',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`https://emission-mah2.onrender.com/admin/project-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      notifications.show({
        title: 'Success',
        message: 'Project request approved successfully',
        color: 'green',
      });

      await fetchRequests();
      setIsModalOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');

    } catch (error) {
      console.error('Error approving request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to approve project request',
        color: 'red',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`https://emission-mah2.onrender.com/admin/project-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      notifications.show({
        title: 'Success',
        message: 'Project request rejected successfully',
        color: 'green',
      });

      await fetchRequests();
      setIsModalOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');

    } catch (error) {
      console.error('Error rejecting request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to reject project request',
        color: 'red',
      });
    }
  };
  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestClick = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className={classes.container}>
        <Paper shadow="sm" p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="xl" fw={700}>Project Requests</Text>
            <Badge size="lg">
              {requests.filter(req => req.status === 'pending').length} Pending
            </Badge>
          </Group>

          <ScrollArea>
            <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Requester</Table.Th>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th>Submitted</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td>{request.title}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{request.user_name}</Text>
                      <Text size="xs" c="dimmed">{request.user_email}</Text>
                    </Table.Td>
                    <Table.Td>{request.organization}</Table.Td>
                    <Table.Td>{formatDate(request.created_at)}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          request.status === 'pending' ? 'blue' :
                          request.status === 'approved' ? 'green' :
                          'red'
                        }
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant={request.status === 'pending' ? 'filled' : 'light'}
                        onClick={() => handleRequestClick(request)}
                        disabled={request.status !== 'pending'}
                      >
                        Review
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        <Modal
          opened={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
            setReviewNotes('');
          }}
          title={
            <Text size="lg" fw={600}>
              Project Request Details
            </Text>
          }
          size="lg"
        >
          {selectedRequest && (
            <Stack>
              <Text fw={500} size="md">Project Title: {selectedRequest.title}</Text>
              <Text c="dimmed" size="sm">Submitted by: {selectedRequest.user_name}</Text>
              <Text c="dimmed" size="sm">Organization: {selectedRequest.organization}</Text>
              
              <Paper withBorder p="md" radius="md">
                <Text fw={500} mb="xs">Description:</Text>
                <Text>{selectedRequest.description}</Text>
              </Paper>

              <Group grow>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} mb="xs">Project Stage:</Text>
                  <Text>{selectedRequest.project_stage}</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} mb="xs">Stage Duration:</Text>
                  <Text>{selectedRequest.stage_duration} days</Text>
                </Paper>
              </Group>

              <Group grow>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} mb="xs">Start Date:</Text>
                  <Text>{formatDate(selectedRequest.stage_start_date)}</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} mb="xs">Due Date:</Text>
                  <Text>{formatDate(selectedRequest.project_due_date)}</Text>
                </Paper>
              </Group>

              {selectedRequest.status === 'pending' && (
                <Textarea
                  label="Review Notes"
                  placeholder="Add your review notes here..."
                  minRows={3}
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.currentTarget.value)}
                />
              )}

              {selectedRequest.review_notes && (
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} mb="xs">Review Notes:</Text>
                  <Text>{selectedRequest.review_notes}</Text>
                </Paper>
              )}

              {selectedRequest.status === 'pending' && (
                <Group justify="flex-end" mt="md">
                  <Button
                    variant="outline"
                    color="red"
                    onClick={handleReject}
                    leftSection={<IconX size={16} />}
                  >
                    Reject
                  </Button>
                  <Button
                    color="green"
                    onClick={handleApprove}
                    leftSection={<IconCheck size={16} />}
                  >
                    Approve
                  </Button>
                </Group>
              )}
            </Stack>
          )}
        </Modal>
        <LoadingOverlay visible={loading} />
      </div>
    </AdminLayout>
  );
};

export default AdminProjectRequests;
