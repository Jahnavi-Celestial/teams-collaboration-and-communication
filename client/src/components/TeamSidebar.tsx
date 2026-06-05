import { NavLink } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Badge } from '@mui/material';
import type { User } from './UserProfileModal';
import { useChat } from '../context/ChatContext';

export interface TeamInterface{
  id: string,
  name: string,
  description?: string,
  created_by: User
}

interface TeamSidebarProps {
  teams: TeamInterface[];
  teamId?: string;
}

const TeamSidebar = ({ teams, teamId }: TeamSidebarProps) => {
  const { unreadCounts } = useChat();

  return (
    <Box sx={{ width: '280px', height: "90vh", borderRight: '1px solid #e0e0e0', bgcolor: '#ffffff', p: 1, overflow: "scroll" }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: '#3d77cf' }}>My Teams</Typography>
      <List>
        {teams?.map((team) => {
          const count = unreadCounts[team.id] || 0;
          return (
            <ListItem key={team.id} disablePadding>
              <ListItemButton 
                component={NavLink} 
                to={`/team/${team.id}`}
                selected={team.id === teamId}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&.Mui-selected': { bgcolor: '#E3F2FD', color: '#0D47A1' }
                }}
              >
                <ListItemText primary={team.name} />
                <Badge badgeContent={count} color="error" sx={{ mr: 2 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default TeamSidebar;