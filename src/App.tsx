import { DiagramCanvas } from "./canvas/DiagramCanvas";
import { Header } from "./components/Header";
import { Inspector } from "./components/Inspector";
import { RunPanel } from "./components/RunPanel";
import { useSession } from "./store/session";

export function App() {
  const mode = useSession((state) => state.mode);
  return (
    <div className="app">
      <Header />
      <DiagramCanvas />
      <aside>{mode === "run" ? <RunPanel /> : <Inspector />}</aside>
    </div>
  );
}
