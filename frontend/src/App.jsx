import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Scan from "./pages/Scan.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Documents from "./pages/Documents.jsx";
import DocumentDetail from "./pages/DocumentDetail.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Scan />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
        </Routes>
      </main>
    </div>
  );
}
