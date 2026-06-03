import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { socket } from '../socket'; 

const ChatContext = createContext(socket);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    socket.connect(); 
    return () => {
      socket.disconnect(); 
    };
  }, []);

  return (
    <ChatContext.Provider value={socket}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);