import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import UserLogin from "./pages/UserLogin";
import AdminLogin from "./pages/AdminLogin";
import UserSignup from "./pages/UserSignup";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TrainsPage from "./pages/TrainsPage";
import AddTrainPage from "./pages/AddTrainPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/user-login" element={<UserLogin />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/user-signup" element={<UserSignup />} />

      {/* User Routes */}
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/trains" element={<TrainsPage />} />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/add-train" element={<AddTrainPage />} />

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
