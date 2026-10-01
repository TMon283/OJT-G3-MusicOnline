import { Outlet } from "react-router-dom";
import { Playbar } from "../components/Playbar";

export const MainLayout = () => {
  return (
    <>
      <Outlet />
      <Playbar />
    </>
  );
};

