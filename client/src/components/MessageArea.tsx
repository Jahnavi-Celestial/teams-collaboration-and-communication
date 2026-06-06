import React, { useState } from "react";
import { Box, Typography, Paper, CircularProgress, Menu, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { MessageInterface } from "../pages/ChatRoom";

interface MessageAreaProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  loadingMore: boolean;
  messagesLoading: boolean;
  messages: MessageInterface[];
  currentUserId: string;
  isMobile: boolean;
  onDeleteMessage: (messageId: string) => void;
  isAdmin: boolean;
}

const MessageArea = ({
  chatContainerRef,
  onScroll,
  loadingMore,
  messagesLoading,
  messages,
  currentUserId,
  isMobile,
  onDeleteMessage,
  isAdmin,
}: MessageAreaProps) => {
  const [deleteAnchor, setDeleteAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) {
      return "";
    }
  };

  const handleMessageClick = (event: React.MouseEvent<HTMLElement>, msg: MessageInterface) => {
    if (!msg) return;

    const msgSenderId = msg.sender?.id;
    const isMe = String(msgSenderId) === String(currentUserId);

    if (isMe || isAdmin) {
      setDeleteAnchor(event.currentTarget);
      setSelectedMessageId(msg.id);
    }
  };

  return (
    <Box
      ref={chatContainerRef}
      onScroll={onScroll}
      sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {loadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <CircularProgress size={20} sx={{ color: "#3d77cf" }} />
        </Box>
      )}

      {messagesLoading && messages.length === 0 ? (
        <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        messages?.map((m, i) => {
          const msgSenderId = m.sender?.id;
          const isMe = String(msgSenderId) === String(currentUserId);
          const canDelete = isMe || isAdmin;
          
          const displaySenderName = m.sender.name;

          return (
            <Box
              key={m.id || i}
              sx={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", width: "100%" }}
            >
              <Paper
                elevation={1}
                onClick={(e) => handleMessageClick(e, m)}
                sx={{
                  p: "8px 12px 6px 14px",
                  maxWidth: isMobile ? "85%" : "65%",
                  borderRadius: "12px",
                  bgcolor: isMe ? "#92b9f3" : "#ffffff",
                  boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.15)",
                  border: "1px solid rgba(0,0,0,0.03)",
                  cursor: canDelete ? "pointer" : "default",
                  "&:hover":
                    canDelete
                      ? { bgcolor: isMe ? "#82adeb" : "#f5f5f5" }
                      : {},
                }}
              >
                {!isMe && (
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", color: "#6197e9", display: "block", mb: 0.5 }}
                  >
                    {displaySenderName}
                  </Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
                  <Typography
                    sx={{ fontSize: "0.95rem", color: "#303030", wordBreak: "break-word", flexGrow: 1 }}
                  >
                    {m.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.7rem", color: isMe ? "rgba(0, 0, 0, 0.5)" : "gray", ml: "auto", mb: -0.5 }}
                  >
                    {formatMessageTime(m.created_at)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          );
        })
      )}

      <Menu 
        anchorEl={deleteAnchor} 
        open={Boolean(deleteAnchor)} 
        onClose={() => setDeleteAnchor(null)}
        sx={{ zIndex: 20000 }}
      >
        <MenuItem
          onClick={() => {
            if (selectedMessageId) onDeleteMessage(selectedMessageId);
            setDeleteAnchor(null);
          }}
          sx={{ color: "red", gap: 1 }}
        >
          <DeleteIcon fontSize="small" /> Delete Message
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageArea;