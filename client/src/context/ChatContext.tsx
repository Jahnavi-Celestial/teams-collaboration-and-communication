import { createContext, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { socket } from '../socket'; 
import { client } from '../apolloClient';
import { useAuth } from '../context/AuthContext';

interface UnreadCounts { [teamId: string]: number; }
interface AppNotification {
  id: string; type: string; title: string; body: string;
  team_id?: string; task_id?: string; is_read: boolean; created_at: string;
}

interface ChatContextType {
  socket: typeof socket;
  unreadCounts: UnreadCounts;
  notifications: AppNotification[];
  markAsRead: (teamId: string) => void;
  markNotificationRead: (notifId: string) => void;
  fetchNotifications: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const GLOBAL_REDIRECT_LOCKED = false;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { userId } = useAuth(); 

  const userIdRef = useRef<string | undefined>(userId);
  
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchNotifications = () => { socket.emit("fetch_my_notifications"); };
  const markAsRead = (teamId: string) => {
    socket.emit("mark_team_chat_as_read", { teamId });
    setUnreadCounts((prev) => ({ ...prev, [teamId]: 0 }));
  };
  const markNotificationRead = (notifId: string) => {
    socket.emit("mark_notification_as_read", { notifId });
    setNotifications((prev) => prev.filter(n => n.id !== notifId));
  };

  useEffect(() => {
    socket.connect();
    
    socket.on("connect", () => {
      socket.emit("sync_initial_unread_counts");
      socket.emit("fetch_my_notifications");
    });
    
    socket.on("unread_count_update", (data: { teamId: string; unreadCount: number }) => {
      setUnreadCounts((prev) => ({ ...prev, [data.teamId]: data.unreadCount }));
    });
    
    socket.on("incoming_system_notification", (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
    });
    
    socket.on("my_notifications_fetched", (fetchedNotifs: AppNotification[]) => {
      setNotifications(fetchedNotifs.filter(n => !n.is_read));
    });

    socket.on("force_leave_team", (data: { teamId: string; kickedUserId: string }) => {
      if (GLOBAL_REDIRECT_LOCKED) {
        return;
      }
      
      const currentActiveId = userIdRef.current;
      if (!currentActiveId || !data.kickedUserId) return;

      const targetedKickedId = String(data.kickedUserId).trim();
      const authenticIdentityOfMine = String(currentActiveId).trim();

      if (targetedKickedId === authenticIdentityOfMine) {
        window.location.replace("/"); 
      } else {
        console.log(`Identity mismatch.`);
      }
    });

    return () => {
      socket.off("connect"); 
      socket.off("unread_count_update");
      socket.off("incoming_system_notification"); 
      socket.off("my_notifications_fetched");
      socket.off("force_leave_team");
    };
  }, [client]); 


  return (
    <ChatContext.Provider value={{ socket, unreadCounts, notifications, markAsRead, markNotificationRead, fetchNotifications }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("Context boundaries missing layout wrap error");
  return context;
};