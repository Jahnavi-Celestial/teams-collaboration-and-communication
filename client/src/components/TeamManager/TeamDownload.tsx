import { useQuery } from "@apollo/client/react";
import { ExportTeams, GetAllTeams } from "../../graphql/queries";
import { useState } from "react";
import { Select, MenuItem, Button, FormControl, InputLabel, Box } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';

const TeamDownloader = () => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const { refetch } = useQuery(ExportTeams, { skip: true });
  const { data: getTeamsData } = useQuery(GetAllTeams, {variables: {skip: 0, take: 100}});

  const handleDownload = async () => {
    if (!selectedTeamId) return;
    try {
      const { data } = await refetch({ teamId: selectedTeamId });
      if (data?.exportTeam) {
        const blob = new Blob([data?.exportTeam], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `team_export_${selectedTeamId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: "wrap"}}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="download-team-label">Select Export Team</InputLabel>
        <Select
          labelId="download-team-label"
          value={selectedTeamId}
          label="Select Export Team"
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          <MenuItem value="">None</MenuItem>
          {getTeamsData?.getTeams?.map(t => (
            <MenuItem value={t.id} key={t.id}>{t.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
 
      <Button
        variant="outlined"
        onClick={handleDownload}
        disabled={!selectedTeamId}
        startIcon={<DownloadIcon />}
      >
        Download CSV
      </Button>
    </Box>
  );
};

export default TeamDownloader;
