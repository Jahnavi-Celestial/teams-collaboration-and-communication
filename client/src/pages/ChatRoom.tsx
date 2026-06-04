import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, TextField, IconButton, useMediaQuery, useTheme } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useQuery } from "@apollo/client/react";
import { useChat } from "../context/ChatContext";
import { GetMembersOfTeam, GetTeams } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";
import TeamSidebar from "../components/TeamSidebar";
import ChatHeader from "../components/ChatHeader";
import MessageArea from "../components/MessageArea";
import MemberList from "../components/MemberList";
import TeamTasksTab from "../components/TeamTasksTab";
import type { Member } from "../components/UserProfileModal";

export interface MessageInterface{
    id: string,
    sender: {
        id: string,
        name?: string;
    },
    content: string,
    created_at: string,
}

const ChatRoom = () => {
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

  const socket = useChat();
  const typingTimeoutRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: teamsData } = useQuery(GetTeams, {
    variables: { skip: 0, take: 100 },
    fetchPolicy: "cache-and-network"
  });

  const { userId } = useAuth();
  const currentUserId = userId;

  const { data: roleMembersData } = useQuery(GetMembersOfTeam, {
    variables: { teamId: teamId || "" },
    skip: !teamId,
    fetchPolicy: "network-only"
  });

  const currentTeam = teamsData?.getTeams?.find((t: any) => String(t.id) === String(teamId));

  useEffect(() => {
    const freshMembersList = roleMembersData?.getMembersOfTeam || [];
    
    if (freshMembersList.length === 0 || !currentUserId) {
      setCurrentUserIsAdmin(false);
      return;
    }

    const matchedMember = freshMembersList.find(
      (m: Member) => String(m.user?.id) === String(currentUserId)
    );

    if (matchedMember) {
      const roleStr = String(matchedMember.role || "").trim().toUpperCase();
      
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
    if (!teamId) return;

    setMessages([]);
    setTypingUser(null);
    setHasMore(true);
    setMessagesLoading(true);

    socket.emit("join_team", teamId);
    socket.emit("get_all_messages", { teamId, limit: 20, offset: 0 });

    socket.on("all_messages_fetched", (data: { teamId: string; messages: MessageInterface[] }) => {
      if (data.teamId !== teamId) return;

      if (loadingMore) {
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
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });

    socket.on("receive_message", (newMessage: MessageInterface) => {
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("message_deleted", (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    socket.on("user_typing", (data: {id: string, name: string}) => {
      const remoteSenderId =
        typeof data === "object" && data !== null
          ? data.id
          : data;
      
      
      if (remoteSenderId && remoteSenderId !== currentUserId) {
        setTypingUser(`${data.name}... is typing`)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
      }
    });

    return () => {
      socket.off("all_messages_fetched");
      socket.off("receive_message");
      socket.off("message_deleted");
      socket.off("user_typing");
    };
  }, [teamId, socket, currentUserId, loadingMore]);

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
