import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import { useQuery, useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { AddMemberDialog } from "./AddMemberDialog";
import { RoleModalDialog } from "./RoleModalDialog";
import { RemoveConfirmDialog } from "./RemoveConfirmDialog";
import { GetMembersOfTeam, UserNotInTeam } from "../graphql/queries";
import {
  AddMemberToTeam,
  ChangeMemberRole,
  DeleteTeam,
  ExitTeam,
  RemoveMemberFromTeam,
} from "../graphql/mutations";
import { useAuth } from "../context/AuthContext";
import UserProfileModal, { type Member, type User } from "./UserProfileModal";
import { DeleteTeamConfirmDialog } from "./DeleteTeamConfirmModel";

const MemberList = ({ teamId }: { teamId: string | undefined }) => {
  const { userId } = useAuth();
  const currentUserId = userId;
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [selectedNewUsers, setSelectedNewUsers] = useState<User[]>([]);

  const [openRoleModal, setOpenRoleModal] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [openRemoveModal, setOpenRemoveModal] = useState<boolean>(false);
  const [isExitingSelf, setIsExitingSelf] = useState<boolean>(false);

  const [inputValue, setInputValue] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [openProfileModal, setOpenProfileModal] = useState<boolean>(false);

  const [openDeleteTeamModal, setOpenDeleteTeamModal] = useState<boolean>(false)

  const { data, loading, refetch } = useQuery(GetMembersOfTeam, {
    variables: { teamId: teamId },
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  const { data: userNotInTeamData, loading: loadingUsers } = useQuery(
    UserNotInTeam,
    {
      variables: {
        teamId: teamId,
        search: debouncedSearch.trim() || undefined,
      },
    },
  );

  const [addMemberAction] = useMutation(AddMemberToTeam);
  const [changeRoleAction] = useMutation(ChangeMemberRole);
  const [removeMemberAction] = useMutation(RemoveMemberFromTeam);
  const [exitTeamAction] = useMutation(ExitTeam);
  const [delteTeamAction] = useMutation(DeleteTeam)

  const memberData: Member[] = data?.getMembersOfTeam || [];
  const availableUsers: User[] = userNotInTeamData?.userNotInTeam || [];

  const isAdmin = memberData.some(
    (m) => m.user.id === currentUserId && m.role === "ADMIN",
  );

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    member: Member,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleAddMemberSubmit = async () => {
    const userIds = selectedNewUsers.map((user) => user.id);
    if (userIds.length === 0) return;

    try {
      await addMemberAction({
        variables: {
          teamId: teamId,
          userIds: userIds,
        },
      });
      handleCloseAddModal();
      refetch();
    } catch (error) {
      console.error("Error adding members:", error);
    }
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setSelectedNewUsers([]);
    setInputValue("");
    setDebouncedSearch("");
  };

  const handleRoleChangeSubmit = async () => {
    if (!selectedMember || !selectedRole) return;

    try {
      await changeRoleAction({
        variables: {
          teamId: teamId,
          memberId: selectedMember.id,
          newRole: selectedRole,
        },
      });
      setOpenRoleModal(false);
      handleMenuClose();
      refetch();
    } catch (error: any) {
      console.error("Error changing role:", error);
      alert(error.message || "Failed to change role");
    }
  };

  const handleRemoveOrExitSubmit = async () => {
    if (isExitingSelf) {
      try {
        await exitTeamAction({
          variables: { teamId: teamId },
        });
        setOpenRemoveModal(false);
        setSelectedMember(null);
        alert("You have left the team successfully.");
        navigate("/");
      } catch (error: any) {
        console.error("Exit Team Error:", error);
        alert(error.message || "Failed to exit team.");
      }
    } else {
      if (!selectedMember) return;
      try {
        await removeMemberAction({
          variables: {
            teamId: teamId,
            memberId: selectedMember.id,
          },
        });
        setOpenRemoveModal(false);
        setSelectedMember(null);
        refetch();
      } catch (error: any) {
        console.error("Removal Error:", error);
        alert(error.message || "Something went wrong.");
      }
    }
  };

  const handleOpenProfileModal = () => {
    setOpenProfileModal(true);
    setAnchorEl(null);
  };

  const handleDeleteTeamSubmit = () => {
    delteTeamAction({
        variables: {teamId: teamId}
    })
    setOpenDeleteTeamModal(false)
    navigate("/")
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3d77cf",
        }}
      >
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 2, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{px:2}}>Team Members</Typography>
        {isAdmin && (
          <Box>
            <Button variant="contained" onClick={() => setOpenAddModal(true)} sx={{m:1}}>
              Add Member
            </Button>
            <Button variant="contained" onClick={()=> setOpenDeleteTeamModal(true)} sx={{m:1}}>
              Delete Team
            </Button>
          </Box>
        )}
      </Box>

      <List sx={{ width: "100%", bgcolor: "background.paper" }}>
        {memberData.map((member) => (
          <Box key={member.id}>
            <Box
              onClick={(e) => handleMenuOpen(e, member)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar alt={member.user.name.toUpperCase()} src="abc.jpg" />
                </ListItemAvatar>
                <ListItemText
                  primary={member.user.name}
                  secondary={member.user.email}
                />
              </ListItem>
              {member.role === "ADMIN" && (
                <Box sx={{ m: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                  >
                    ADMIN
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider variant="inset" component="li" />
          </Box>
        ))}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ list: { onMouseLeave: () => setAnchorEl(null) } }}
        sx={{ zIndex: 10000 }}
      >
        {selectedMember?.user.id === currentUserId
          ? [
              <MenuItem key="view-my-profile" onClick={handleOpenProfileModal}>
                View Profile
              </MenuItem>,
              <MenuItem
                key="exit-team"
                onClick={() => {
                  setIsExitingSelf(true);
                  setOpenRemoveModal(true);
                  setAnchorEl(null);
                }}
                sx={{ color: "error.main" }}
              >
                Exit Team
              </MenuItem>,
            ]
          : [
              <MenuItem
                key="view-profile"
                onClick={handleOpenProfileModal}
              >
                View Profile
              </MenuItem>,
              isAdmin && [
                <MenuItem
                  key="change-role"
                  onClick={() => {
                    setSelectedRole(selectedMember?.role || "");
                    setOpenRoleModal(true);
                    setAnchorEl(null);
                  }}
                >
                  Change Role
                </MenuItem>,
                <MenuItem
                  key="remove-team"
                  onClick={() => {
                    setIsExitingSelf(false);
                    setOpenRemoveModal(true);
                    setAnchorEl(null);
                  }}
                  sx={{ color: "error.main" }}
                >
                  Remove from Team
                </MenuItem>,
              ],
            ]}
      </Menu>

      <AddMemberDialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        availableUsers={availableUsers}
        selectedNewUsers={selectedNewUsers}
        setSelectedNewUsers={setSelectedNewUsers}
        inputValue={inputValue}
        setInputValue={setInputValue}
        loadingUsers={loadingUsers}
        onSubmit={handleAddMemberSubmit}
      />

      <RoleModalDialog
        open={openRoleModal}
        onClose={() => setOpenRoleModal(false)}
        memberName={selectedMember?.user.name}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        onSubmit={handleRoleChangeSubmit}
      />

      <RemoveConfirmDialog
        open={openRemoveModal}
        onClose={() => setOpenRemoveModal(false)}
        isExitingSelf={isExitingSelf}
        memberName={selectedMember?.user.name}
        onSubmit={handleRemoveOrExitSubmit}
      />

      <UserProfileModal
        open={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
        member={selectedMember}
      />

      <DeleteTeamConfirmDialog open={openDeleteTeamModal} onClose={()=>setOpenDeleteTeamModal(false)} onSubmit={handleDeleteTeamSubmit}/>
    </Box>
  );
};

export default MemberList;
