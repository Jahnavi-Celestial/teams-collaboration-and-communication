import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ChatProvider } from "./context/ChatContext.tsx";

if (typeof window !== "undefined") {
  const originalFocus = HTMLInputElement.prototype.focus;
  HTMLInputElement.prototype.focus = function (options) {
    try {
      if (this !== null && this !== undefined) {
        originalFocus.call(this, options);
      }
    } catch (e) {
      return 
    }
  };

  const originalRemoveAttribute = Element.prototype.removeAttribute;
  Element.prototype.removeAttribute = function (name: string) {
    try {
      if (this !== null && this !== undefined) {
        originalRemoveAttribute.call(this, name);
      }
    } catch (e) {
      return 
    }
  };

  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (name === "aria-hidden" && value === "true" && (this.id === "root" || this.tagName === "BODY")) {
      return; 
    }
    return originalSetAttribute.call(this, name, value);
  };
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AuthProvider>
  </GoogleOAuthProvider>,
);
