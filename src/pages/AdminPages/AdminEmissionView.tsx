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
  Select,
  Collapse,
  Paper,
  Container,
  Transition,
  Badge,
} from '@mantine/core';
import classes from './AdminDashboard.module.css';

interface EmissionData {
  organization: string;
  user: string;
  total_carbon_emit: number;
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
        <Group justify="space-between">
          <Text fw={600} fz="sm" c="dimmed">
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

function filterData(data: EmissionData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toString().toLowerCase().includes(query))
  );
}

function sortData(
  data: EmissionData[],
  payload: { sortBy: keyof EmissionData | null; reversed: boolean; search: string }
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

const AdminEmissionView: React.FC = () => {
  const router = useRouter();
  const [emissionData, setEmissionData] = useState<EmissionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState<EmissionData[]>([]);
  const [sortBy, setSortBy] = useState<keyof EmissionData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [viewBy, setViewBy] = useState<'organization' | 'individual'>('organization');
  const [expandedOrganizations, setExpandedOrganizations] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchEmissionData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch(`http://emission-mah2.onrender.com/emission_data?viewBy=${viewBy}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setEmissionData(data.emissionData);
        setSortedData(data.emissionData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error('Error fetching emission data:', error);
      }
    };

    fetchEmissionData();
  }, [router, viewBy]);

  const setSorting = (field: keyof EmissionData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(emissionData, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(emissionData, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  const toggleOrganization = (organization: string) => {
    setExpandedOrganizations((prev) =>
      prev.includes(organization)
        ? prev.filter((org) => org !== organization)
        : [...prev, organization]
    );
  };

  const uniqueOrganizations = Array.from(new Set(sortedData.map(data => data.organization)));

  const rows = viewBy === 'organization' ? (
    uniqueOrganizations.map((organization) => {
      const organizationData = sortedData.filter(data => data.organization === organization);
      const totalCarbonEmit = organizationData.reduce((sum, data) => sum + data.total_carbon_emit, 0);
      const isExpanded = expandedOrganizations.includes(organization);

      return (
        <React.Fragment key={organization}>
          <Table.Tr 
            onClick={() => toggleOrganization(organization)}
            className={`${classes.organizationRow} ${isExpanded ? classes.expandedRow : ''}`}
          >
            <Table.Td>
              <Group>
                <IconChevronDown 
                  size={16} 
                  style={{ 
                    transform: isExpanded ? 'rotate(-180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                />
                <Text fw={500}>{organization}</Text>
              </Group>
            </Table.Td>
            <Table.Td className={classes.carbonValue}>{totalCarbonEmit.toFixed(3)}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td colSpan={2} style={{ padding: 0 }}>
              <Collapse in={isExpanded}>
                <Table>
                  <Table.Tbody>
                    {organizationData.map((user) => (
                      <Table.Tr key={user.user} className={classes.userRow}>
                        <Table.Td pl={40}>{user.user}</Table.Td>
                        <Table.Td className={classes.carbonValue}>{user.total_carbon_emit.toFixed(3)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Collapse>
            </Table.Td>
          </Table.Tr>
        </React.Fragment>
      );
    })
  ) : (
    sortedData.map((data) => (
      <Table.Tr key={data.user}>
        <Table.Td>{data.organization}</Table.Td>
        <Table.Td>{data.user}</Table.Td>
        <Table.Td className={classes.carbonValue}>{data.total_carbon_emit.toFixed(3)}</Table.Td>
      </Table.Tr>
    ))
  );

  return (
    <AdminLayout>
      <Container size="xl" className={classes.emissionView}>
        <div className={classes.emissionHeader}>
          <h1>Emission Analytics</h1>
          <Group gap="md">
            <Select
              className={classes.viewSelect}
              value={viewBy}
              onChange={(value) => setViewBy(value as 'organization' | 'individual')}
              data={[
                { value: 'organization', label: 'Organization View' },
                { value: 'individual', label: 'Individual View' },
              ]}
              placeholder="Select view type"
            />
            <TextInput
              className={classes.searchWrapper}
              placeholder="Search entries..."
              leftSection={<IconSearch size={16} stroke={1.5} />}
              value={search}
              onChange={handleSearchChange}
            />
          </Group>
        </div>

        {error ? (
          <Paper p="md" withBorder color="red">
            <Text c="red">{error}</Text>
          </Paper>
        ) : (
          <Paper className={classes.tableCard}>
            <ScrollArea>
              <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
                <Table.Thead className={classes.tableHeader}>
                  <Table.Tr>
                    <Th
                      sorted={sortBy === 'organization'}
                      reversed={reverseSortDirection}
                      onSort={() => setSorting('organization')}
                    >
                      Organization
                    </Th>
                    {viewBy === 'individual' && (
                      <Th
                        sorted={sortBy === 'user'}
                        reversed={reverseSortDirection}
                        onSort={() => setSorting('user')}
                      >
                        User
                      </Th>
                    )}
                    <Th
                      sorted={sortBy === 'total_carbon_emit'}
                      reversed={reverseSortDirection}
                      onSort={() => setSorting('total_carbon_emit')}
                    >
                      Carbon Emission (kg CO₂)
                    </Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length > 0 ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={viewBy === 'individual' ? 3 : 2}>
                        <Text fw={500} ta="center" c="dimmed">
                          No results found
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminEmissionView;