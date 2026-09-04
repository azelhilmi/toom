import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import CameraPage from "./pages/CameraPage";
import GalleryPage from "./pages/GalleryPage";
import SettingsPage from "./pages/SettingsPage";
import EventHubPage from "./pages/EventHubPage";
import EventCreatePage from "./pages/EventCreatePage";
import EventJoinPage from "./pages/EventJoinPage";
import JoinByCodePage from "./pages/JoinByCodePage";
import EventCameraPage from "./pages/EventCameraPage";
import EventDashboardPage from "./pages/EventDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="app-shell">
            <main className="app-main">
              <Routes>
                <Route path="/" element={<CameraPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/event" element={<EventHubPage />} />
                <Route path="/event/new" element={<EventCreatePage />} />
                <Route path="/event/:eventId" element={<EventDashboardPage />} />
                <Route path="/event/:eventId/camera" element={<EventCameraPage />} />
                <Route path="/join" element={<JoinByCodePage />} />
                <Route path="/invite/:inviteCode" element={<EventJoinPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
