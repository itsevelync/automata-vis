import { DiagramCanvas } from "./canvas/DiagramCanvas";
import { Header } from "./components/Header";
import { Inspector } from "./components/Inspector";

export function App() {
  return (
    <div className="app">
      <Header />
      <DiagramCanvas />
      <aside>
        <Inspector />
      </aside>
    </div>
  );
}
