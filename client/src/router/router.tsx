import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";

//trang nguoi dung
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import Login from "../pages/auth/Login";

import Album_statistics from "../pages/admin/Album_statistics";
import Artist_Statistics from "../pages/admin/Artist_statistics";
import Genre_Statistics from "../pages/admin/Genre_statistics";
import Song_statistics from "../pages/admin/Song_statistics";
import UserStatistics from "../pages/admin/User_statistics";
import Admin from "../pages/admin/Admin";
import UserList from "../pages/admin/Users-list";
import MusicStation from "../pages/artist/ArtistAlbum";
import ArtistSong from "../pages/artist/ArtistSong";
import DownloadPage from "../pages/dashboard/DownloadPage";
import FavouritePage from "../pages/dashboard/FavouritePage";
import HistoryPage from "../pages/dashboard/HistoryPage";
import ProfilePage from "../pages/dashboard/ProfilePage";
import AlbumPage from "../pages/dashboard/AlbumPage";
import AlbumDetailPage from "../components/AlbumDetailPage";
import { GenreManagement } from "../pages/admin/Genre_manager";
import { BannerManagement } from "../pages/admin/Banner_manager";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ForgotPassword from "../pages/auth/ForgetPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Welcome from "../pages/admin/Welcome";
import PlaylistPage from "../pages/playlist/PlayListPage";
import PlaylistDetailPage from "../pages/playlist/PlaylistDetailPage";
import Moderation from "../pages/admin/Moderation";


const router = createBrowserRouter([
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="ROLE_ADMIN">
        <Admin />
      </ProtectedRoute>
    ), 
    children: [
      { index: true, element: <Welcome /> },
      { path: "user-list", element: <UserList/> },
      { path: "welcome", element: <Welcome /> },
      { path: "album-statistics", element: <Album_statistics /> },
      { path: "artist_statistics", element: <Artist_Statistics /> },
      { path: "genre_statistics", element: <Genre_Statistics /> },
      { path: "song_statistics", element: <Song_statistics /> },
      { path: "user_statistics", element: <UserStatistics /> },
      { path: "genre-manager", element: <GenreManagement /> },
      { path: "banner-manager", element: <BannerManagement /> },
      { path: "moderation", element: <Moderation/> }

    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
        children: [
          { 
            path: "download", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <DownloadPage />
              </ProtectedRoute>
            )
          },
          { 
            path: "favourite", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <FavouritePage />
              </ProtectedRoute>
            )
          },
          { 
            path: "history", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <HistoryPage />
              </ProtectedRoute>
            )
          },
          { 
            path: "profile", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <ProfilePage />
              </ProtectedRoute>
            )
          },
          { 
            path: "album", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <AlbumPage />
              </ProtectedRoute>
            )
          },
          { 
            path: "album/:id", 
            element: (
              <ProtectedRoute requiredRole={null}>
                <AlbumDetailPage />
              </ProtectedRoute>
            )
          },
          {
            path: "playlists",
            element: (
              <ProtectedRoute requiredRole={null}>
                <PlaylistPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "playlists/:id",
            element: (
              <ProtectedRoute requiredRole={null}>
                <PlaylistDetailPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "artist-album",
        element: (
          <ProtectedRoute requiredRole={null}>
            <MusicStation />
          </ProtectedRoute>
        )
      },
      {
        path: "artist-song",
        element: (
          <ProtectedRoute requiredRole={null}>
            <ArtistSong />
          </ProtectedRoute>
        )
      },
    ],
  },
  { path: "/register", element: <Register /> },
  { path: "/verify", element: <VerifyEmail /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword/> },
  { path: "/reset-password", element: <ResetPassword/> },
  


  //ai cần thêm router thì làm y như trên ở đây
]);

export default router;