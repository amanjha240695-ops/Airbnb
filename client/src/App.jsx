import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AppRoutes } from "./routes/AppRoutes";
import "./App.css";
function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;