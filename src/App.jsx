// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import Semaine from "@/pages/Semaine.jsx";
import Weekend from "@/pages/Weekend.jsx";
import Rapports from "@/pages/Rapports.jsx";
import Tpl from "@/pages/Tpl.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/semaine" replace />} />
        <Route path="/semaine" element={<Semaine />} />
        <Route path="/weekend" element={<Weekend />} />
        <Route path="/tpl" element={<Tpl />} />
        <Route path="/rapports" element={<Rapports />} />
        <Route path="*" element={<Navigate to="/semaine" replace />} />
      </Route>
    </Routes>
  );
}
