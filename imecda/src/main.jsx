import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./lib/AuthContext"
import "./styles/global.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e2335",
              color: "#e8ecf4",
              border: "1px solid #2a3050",
              fontFamily: "Barlow, sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)