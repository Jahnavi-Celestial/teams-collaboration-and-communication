import { NavLink } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

interface TeamSidebarProps {
  teams: any[];
  teamId?: string;
}

const TeamSidebar = ({ teams, teamId }: TeamSidebarProps) => {
  return (
    <Box sx={{ width: '280px', borderRight: '1px solid #e0e0e0', bgcolor: '#ffffff', p: 1 }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', color: '#3d77cf' }}>Your Teams</Typography>
      <List>
        {teams?.map((team) => (
          <ListItem key={team.id} disablePadding>
            <ListItemButton 
              component={NavLink} 
              to={`/team/${team.id}`}
              selected={team.id === teamId}
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                '&.Mui-selected': { bgcolor: '#E3F2FD', color: '#0D47A1' }
              }}
            >
              <ListItemText primary={team.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TeamSidebar