import { Select, MenuItem, Button, FormControl, InputLabel, Box } from '@mui/material';
import { useState } from 'react';
import { GetAllTeams } from '../../graphql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { ImportTeams } from '../../graphql/mutations';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const TeamUploader = () => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const { data } = useQuery(GetAllTeams, {variables: {skip: 0, take: 100}});
  const [importTeams, { loading }] = useMutation(ImportTeams, {
    refetchQueries: [{ query: GetAllTeams, variables: { skip: 0, take: 100 } }]
  });

  const validateAndUpload = (fileInstance) => {
    console.log(fileInstance)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(line => line.split(','));
      if (lines.length < 2) {
        alert("The uploaded CSV file is empty.");
        return;
      }

      const headers = lines[0].map(h => h.trim());
      const emailIdx = headers.findIndex(h => h.includes('memberEmail') || h.includes('email'));
      const pwdIdx = headers.findIndex(h => h.includes('password'));
      const googleIdIdx = headers.findIndex(h => h.includes('google_id'));

      if (emailIdx === -1) {
        alert("CSV Validation Error: Missing required column 'memberEmail' or 'email'.");
        return;
      }

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length === 1 && row[0].trim() === "") continue;

        const email = row[emailIdx]?.trim();
        const password = pwdIdx !== -1 ? row[pwdIdx]?.trim() : "";
        const googleId = googleIdIdx !== -1 ? row[googleIdIdx]?.trim() : "";

        if (!email) {
          alert(`Row ${i + 1} Error: Email address cannot be empty.`);
          return;
        }

        if (!password && !googleId) {
          alert(`Row ${i + 1} Error (${email}): You must supply either a 'password' or a 'google_id' so this account can log in.`);
          return;
        }
      }

      try {
        await importTeams({ variables: { teamId: selectedTeam, file: fileInstance } });
        alert("CSV Imported successfully!");
      } catch (err) {
        console.error(err);
        alert("Error uploading file.");
      }
    };
    reader.readAsText(fileInstance);
  };

  const handleFileChange = (event) => {
    const fileInstance = event.target.files?.[0];
    if (!fileInstance) return;
    validateAndUpload(fileInstance);
    event.target.value = '';
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center'}}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="upload-team-label">Target Import Team</InputLabel>
        <Select
          labelId="upload-team-label"
          value={selectedTeam}
          label="Target Import Team"
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <MenuItem value="">None</MenuItem>
          {data?.getTeams?.map(team => (
            <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button 
        variant="contained" 
        component="label" 
        disabled={loading}
        startIcon={<CloudUploadIcon />}
      >
        {loading ? "Uploading..." : "Import CSV"}
        <input type="file" accept=".csv" hidden onChange={handleFileChange} />
      </Button>
    </Box>
  );
};

export default TeamUploader;