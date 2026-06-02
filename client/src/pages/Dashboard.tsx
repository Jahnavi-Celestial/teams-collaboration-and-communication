import { useQuery } from "@apollo/client/react"
import { GetTeams } from "../graphql/queries"
import { useEffect, useState } from "react"
import { Container, Typography, Box, Grid } from "@mui/material"
import TeamCard from "../components/TeamCard"

const Dashboard = () => {
    const [haveTeam, setHaveTeam] = useState<boolean>(false)

    const {data, loading} = useQuery(GetTeams)

    useEffect(()=>{
        if (data?.getTeams?.length > 0) {
            setHaveTeam(true)
        } else {
            setHaveTeam(false)
        }
    }, [data])

    if(loading){
        return <Typography>Loading...</Typography>
    }

  return (
    <Container maxWidth="lg">
        {
            haveTeam ? (
                <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: 3, my: 5}}>
                    <Typography variant="h3">Welcome Back to TeamChat!</Typography>
                    <Typography variant="h5" component="p">Explore Your Teams</Typography>
                    <Grid container spacing={3} sx={{width: "100%"}}>
                        {
                            data?.getTeams?.map(team=> {
                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={team.id}>
                                        <TeamCard team={team}/>
                                    </Grid>
                                )
                            })
                        }
                    </Grid>
                </Box>
            ) : (
                <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: 3, my: 5}}>
                    <Typography variant="h3">Welcome to TeamChat!</Typography>
                    <Typography variant="h5" component="p">Look's like you are not part of any team yet. Jump right in by creating your own team or join any public team.</Typography>

                </Box>
            )
        }
    </Container>
  )
}

export default Dashboard
