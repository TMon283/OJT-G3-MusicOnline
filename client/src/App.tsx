import { RouterProvider } from "react-router-dom";
import router from "./router/router";
import "./index.css";
import { PlayerProvider } from "./components/GlobalPlayer";

function App() {
  return (
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>
  );
}

export default App;
