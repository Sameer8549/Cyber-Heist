import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portal from "./screens/Portal";
import TeamTerminal from "./screens/TeamTerminal";
import Coordinator from "./screens/Coordinator";
import Leaderboard from "./screens/Leaderboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/terminal" element={<TeamTerminal />} />
        <Route path="/coordinator" element={<Coordinator />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
