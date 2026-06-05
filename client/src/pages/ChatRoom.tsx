import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  useTheme,
  useMediaQuery,
  TextField,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { GetTeams, GetMembersOfTeam } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import TeamSidebar from "../components/TeamSidebar";
import ChatHeader from "../components/ChatHeader";
import MessageArea from "../components/MessageArea";
import TeamTasksTab from "../components/TeamTasksTab";
import MemberList from "../components/MemberList";

export interface MessageInterface {
  id: string;
  sender: {
    id: string;
    name?: string;
  };
  content: string;
  created_at: string;
}

interface Member {
  role: string;
  user: {
    id: string;
  };
}

const ChatRoom = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [input, setInput] = useState<string>("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState<boolean>(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { socket, markAsRead } = useChat();
  const typingTimeoutRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef<boolean>(false);

  const { data: teamsData } = useQuery(GetTeams, {
    variables: { skip: 0, take: 100 },
    fetchPolicy: "cache-and-network",
  });

  const { userId } = useAuth();
  const currentUserId = userId;

  const { data: roleMembersData } = useQuery(GetMembersOfTeam, {
    variables: { teamId: teamId || "" },
    skip: !teamId,
    fetchPolicy: "network-only",
  });

  const currentTeam = teamsData?.getTeams?.find(
    (t: any) => String(t.id) === String(teamId),
  );

  useEffect(() => {
    const freshMembersList = roleMembersData?.getMembersOfTeam || [];

    if (freshMembersList.length === 0 || !currentUserId) {
      setCurrentUserIsAdmin(false);
      return;
    }

    const matchedMember = freshMembersList.find(
      (m: Member) => String(m.user?.id) === String(currentUserId),
    );

    if (matchedMember) {
      const roleStr = String(matchedMember.role || "")
        .trim()
        .toUpperCase();

      if (roleStr === "ADMIN") {
        setCurrentUserIsAdmin(true);
      } else {
        setCurrentUserIsAdmin(false);
      }
    } else {
      setCurrentUserIsAdmin(false);
    }
  }, [roleMembersData, currentUserId]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    if (!teamId) return;

    setMessages([]);
    setTypingUser(null);
    setHasMore(true);
    setMessagesLoading(true);

    socket.emit("join_team", teamId);
    socket.emit("get_all_messages", { teamId, limit: 20, offset: 0 });

    const handleForceLeave = (data: {
      teamId: string;
      kickedUserId: string;
    }) => {
      if (!currentUserId || !data.kickedUserId) {
        console.log(
          "Verification failed: One of the User IDs is missing or undefined.",
        );
        return;
      }

      const targetKickedId = String(data.kickedUserId).trim();
      const identityOfMine = String(currentUserId).trim();

      if (targetKickedId === identityOfMine) {
        if (String(data.teamId) === String(teamId)) {
          alert("You have been removed from this team by an admin.");
          setMessages([]);
          navigate("/", { replace: true });
        }
      } else {
        console.log(
          `User ${targetKickedId} was removed. I am ${identityOfMine}, so I will stay in the room.`,
        );
      }
    };
    socket.on("force_leave_team", handleForceLeave);

    const handleAllMessages = (data: {
      teamId: string;
      messages: MessageInterface[];
    }) => {
      if (data.teamId !== teamId) return;

      if (loadingMoreRef.current) {
        if (chatContainerRef.current) {
          const previousScrollHeight = chatContainerRef.current.scrollHeight;
          setMessages((prev) => [...data.messages, ...prev]);
          setHasMore(data.messages.length >= 20);
          setLoadingMore(false);

          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight - previousScrollHeight;
            }
          }, 0);
        }
      } else {
        setMessages(data.messages);
        setHasMore(data.messages.length >= 20);
        setMessagesLoading(false);

        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    const handleReceiveMessage = (newMessage: MessageInterface) => {
      setMessages((prev) => [...prev, newMessage]);

      if (activeTab === 0) {
        markAsRead(teamId);
      }

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 50);
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    };

    const handleUserTyping = (data: { id: string; name: string }) => {
      const remoteSenderId =
        typeof data === "object" && data !== null ? data.id : data;

      if (remoteSenderId && remoteSenderId !== currentUserId) {
        setTypingUser(`${data.name}... is typing`);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
      }
    };

    const handleTeamDeletedLive = (data: { teamId: string }) => {
      if (String(data.teamId) === String(teamId)) {
        alert("This team has been deleted by the admin.");
        setMessages([]);
        navigate("/", { replace: true });
      }
    };

    socket.off("force_leave_team", handleForceLeave);
    socket.on("all_messages_fetched", handleAllMessages);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleUserTyping);
    socket.on("team_deleted_live", handleTeamDeletedLive);

    return () => {
      socket.off("all_messages_fetched", handleAllMessages);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleUserTyping);
      socket.off("team_deleted_live", handleTeamDeletedLive);
    };
    
  }, [teamId, socket, currentUserId, navigate]);

  useEffect(() => {
    if (teamId && activeTab === 0) {
      markAsRead(teamId);
    }
  }, [activeTab, teamId]);

  const handleScroll = async () => {
    if (!chatContainerRef.current || loadingMore || !hasMore || !teamId) return;
    if (chatContainerRef.current.scrollTop === 0 && messages.length > 0) {
      setLoadingMore(true);
      socket.emit("get_all_messages", {
        teamId,
        limit: 20,
        offset: messages.length,
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    socket.emit("delete_message", { messageId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (teamId) socket.emit("typing", { teamId, senderId: currentUserId });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !teamId) return;
    socket.emit("send_message", { teamId, content: input });
    setInput("");
  };

  return (
    <Box sx={{ display: "flex", width: "100%", height: "calc(100vh - 64px)" }}>
      {!isMobile && <TeamSidebar teams={teamsData?.getTeams} teamId={teamId} />}

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#efeae2",
        }}
      >
        <ChatHeader
          teamName={currentTeam?.name}
          typingUser={typingUser}
          isMobile={isMobile}
          teams={teamsData?.getTeams}
          teamId={teamId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {activeTab === 0 && (
          <>
            <MessageArea
              chatContainerRef={chatContainerRef}
              onScroll={handleScroll}
              loadingMore={loadingMore}
              messagesLoading={messagesLoading}
              messages={messages}
              currentUserId={currentUserId}
              isMobile={isMobile}
              onDeleteMessage={handleDeleteMessage}
              isAdmin={currentUserIsAdmin}
            />
            <Box
              sx={{
                p: 2,
                bgcolor: "#f0f2f5",
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                size="small"
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                disabled={!teamId}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#ffffff",
                    borderRadius: "24px",
                    px: 1,
                  },
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!input.trim() || !teamId}
                sx={{
                  bgcolor: "#3d77cf",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#5792eb" },
                }}
              >
                <SendIcon size="small" />
              </IconButton>
            </Box>
          </>
        )}

        {activeTab === 1 && <TeamTasksTab teamId={teamId} />}

        {activeTab === 2 && <MemberList teamId={teamId} />}
      </Box>
    </Box>
  );
};

export default ChatRoom;
