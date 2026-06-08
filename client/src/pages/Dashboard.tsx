import { useQuery } from "@apollo/client/react"
import { GetTeams } from "../graphql/queries"
import { useEffect, useState } from "react"
import { Container, Typography, Box, Grid, Button, Pagination} from "@mui/material"
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import TeamCard from "../components/TeamCard"
import CreateTeamModal from "../components/CreateTeamModal";
import NoData from "../assets/NoData.png"
import TeamDownloader from "../components/TeamManager/TeamDownload";
import TeamUploader from "../components/TeamManager/TeamUploader";

const PAGE_SIZE = 9;

const Dashboard = () => {
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [haveTeam, setHaveTeam] = useState<boolean>(false)
    const [page, setPage] = useState<number>(1);

    const {data, loading, refetch} = useQuery(GetTeams, {
        variables: {
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE + 1
        },
    })

    const rawTeamsList = data?.getTeams || [];

    const hasRemainingCards = rawTeamsList.length > PAGE_SIZE;
    const teamsList = hasRemainingCards ? rawTeamsList.slice(0, PAGE_SIZE) : rawTeamsList;

    const isCurrentPageFull = teamsList.length === PAGE_SIZE;
    const dynamicTotalPages = isCurrentPageFull && hasRemainingCards ? page + 1 : page;


    useEffect(()=>{
        if (data?.getTeams?.length > 0) {
            setHaveTeam(true)
        } else {
            setHaveTeam(false)
        }
        refetch()
    }, [data])

    if (loading) {
        return <Box sx={{height: "100vh",display: "flex", alignItems: "center", justifyContent: "center", color: "#3d77cf"}}>
            <Typography sx={{fontSize: "30px"}}>Loading...</Typography>
        </Box>
    }

  return (
    <Container maxWidth="lg">
        {
            haveTeam ? (
                <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: 3, my: 5}}>
                    <Typography variant="h3">Welcome Back to TeamChat!</Typography>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                            <TeamDownloader />
                            <TeamUploader />
                        </Box>
                    <Typography variant="h5" component="p">Explore Your Teams</Typography>
                    <Grid container spacing={3} sx={{width: "100%"}}>
                        {
                            data?.getTeams?.slice(0,9)?.map(team=> {
                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={team.id}>
                                        <TeamCard team={team}/>
                                    </Grid>
                                )
                            })
                        }
                    </Grid>

                    {dynamicTotalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Pagination 
                                count={dynamicTotalPages} 
                                page={page} 
                                onChange={(e,v)=>setPage(v)} 
                                color="primary"
                                shape="rounded"
                                variant="outlined"
                                hideNextButton={!isCurrentPageFull}
                            />
                        </Box>
                    )}
                </Box>
            ) : (
                <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: 3, my: 5}}>
                    <Typography variant="h3">Welcome to TeamChat!</Typography>
                    <Typography variant="h5" component="p">Look's like you are not part of any team yet. Jump right in by creating your own team or join any public team.</Typography>

                    <Box sx={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                        <img src={NoData} alt="No Data Found" style={{ maxWidth: "600px", minWidth: "300px", height: "auto" }}/>
                    </Box>

                    <Box>
                        <Button sx={{bgcolor: "#3d77cf", color: "white"}} onClick={()=>setIsCreateOpen(true)}>Create a new team <ArrowRightAltIcon/></Button>
                    </Box>
                    <CreateTeamModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)}/>
                </Box>
            )
        }
    </Container>
  )
}

export default Dashboard