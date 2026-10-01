import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Music, Disc, Trash2 } from "lucide-react";

import {
  getModerationData,
  deleteAlbumApi,
  deleteSongApi,
  toggleAlbumStatusApi,
  toggleSongStatusApi,
} from "../../redux/slices/moderationSlice";

import type { Album, Song, Status } from "../../redux/slices/moderationSlice";

type TabType = "albums" | "songs";

export default function Moderation() {
  const dispatch = useDispatch<any>();
  const [tab, setTab] = useState<TabType>("albums");
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<TabType>("albums");

 const { albums, loading } = useSelector(
  (state: any) => state.moderationStatistics
);

  const songs = useMemo(() => {
    return albums.flatMap((a: Album) =>
      a.songs.map((s: Song) => ({
        ...s,
        albumId: a.id,
        artistId: a.artistId,
      }))
    );
  }, [albums]);

  useEffect(() => {
    dispatch(getModerationData());
  }, [dispatch]);

  const handleOpenDelete = (item: any, type: TabType) => {
    setSelectedItem(item);
    setDeleteType(type);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    if (deleteType === "albums") {
      await dispatch(
        deleteAlbumApi({
          artistId: selectedItem.artistId,
          albumId: selectedItem.id,
        })
      );
    } else {
      await dispatch(
        deleteSongApi({
          artistId: selectedItem.artistId,
          albumId: selectedItem.albumId,
          songId: selectedItem.id,
        })
      );
    }

    setOpenDelete(false);
    setSelectedItem(null);
  };

  return (
    <div className="bg-[#14182F] text-white min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Moderation</h1>
       
      </div>

      <div className="flex gap-3 mb-6">
        <Tab
          active={tab === "albums"}
          icon={<Disc size={16} />}
          count={albums.length}
          onClick={() => setTab("albums")}
        >
          Albums
        </Tab>

        <Tab
          active={tab === "songs"}
          icon={<Music size={16} />}
          count={songs.length}
          onClick={() => setTab("songs")}
        >
          Songs
        </Tab>
      </div>

      <div className="bg-[#1B2039] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-400">Loading...</div>
        ) : tab === "albums" ? (
          <AlbumTable
            albums={albums}
            onDelete={handleOpenDelete}
            onToggleStatus={(a: Album) =>
              dispatch(
                toggleAlbumStatusApi({
                  artistId: a.artistId,
                  albumId: a.id,
                  status:
                    a.status === "Active" ? "Pending" : "Active",
                })
              )
            }
          />
        ) : (
          <SongTable
            songs={songs}
            onDelete={handleOpenDelete}
            onToggleStatus={(s) =>
              dispatch(
                toggleSongStatusApi({
                  artistId: s.artistId,
                  albumId: s.albumId,
                  songId: s.id,
                  status:
                    s.status === "Active" ? "Pending" : "Active",
                })
              )
            }
          />
        )}
      </div>

      {openDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#1B2039] rounded-xl w-[400px] p-6">
            <h2 className="text-xl font-bold mb-3">
              Xác nhận xóa
            </h2>
            <p className="text-gray-400 mb-6">
              Bạn có chắc muốn xóa{" "}
              <span className="text-white">
                {selectedItem?.title}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenDelete(false)}
                className="px-4 py-2 bg-[#2A2F55] rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 rounded-lg"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatusBadge = ({
  status,
  onClick,
}: {
  status: Status;
  onClick: () => void;
}) => {
  const isActive = status === "Active";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full font-medium ${
        isActive
          ? "bg-green-500/20 text-green-400"
          : "bg-gray-500/20 text-gray-400"
      }`}
    >
      {isActive ? "Active" : "Pending"}
    </button>
  );
};

const AlbumTable = ({
  albums,
  onDelete,
  onToggleStatus,
}: {
  albums: Album[];
  onDelete: (item: Album, type: "albums") => void;
  onToggleStatus: (album: Album) => void;
}) => (
  <table className="w-full text-sm">
    <thead className="text-gray-400 border-b border-gray-700">
      <tr>
        {[
          "STT",
          "Title",
          "Artist",
          "Release",
          "Tracks",
          "Type",
          "Status",
          "Action",
        ].map((h) => (
          <th key={h} className="px-4 py-3 text-left">
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {albums.map((a, i) => (
        <tr key={a.id} className="border-b border-gray-700">
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3">{a.title}</td>
          <td className="px-4 py-3">{a.artistName}</td>
          <td className="px-4 py-3">{a.release_date}</td>
          <td className="px-4 py-3">{a.songs.length}</td>
          <td className="px-4 py-3">{a.type}</td>
          <td className="px-4 py-3">
            <StatusBadge
              status={a.status}
              onClick={() => onToggleStatus(a)}
            />
          </td>
          <td className="px-4 py-3">
            <Trash2
              size={18}
              className="cursor-pointer hover:text-red-400"
              onClick={() => onDelete(a, "albums")}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const SongTable = ({
  songs,
  onDelete,
  onToggleStatus,
}: {
  songs: (Song & { albumId: number; artistId: number })[];
  onDelete: (item: any, type: "songs") => void;
  onToggleStatus: (song: Song & { albumId: number; artistId: number }) => void;
}) => (
  <table className="w-full text-sm">
    <thead className="text-gray-400 border-b border-gray-700">
      <tr>
        {["STT", "Title", "Views", "Duration", "Status", "Action"].map(
          (h) => (
            <th key={h} className="px-4 py-3 text-left">
              {h}
            </th>
          )
        )}
      </tr>
    </thead>
    <tbody>
      {songs.map((s, i) => (
        <tr
          key={`${s.albumId}-${s.id}`}
          className="border-b border-gray-700"
        >
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3">{s.title}</td>
          <td className="px-4 py-3">{s.views}</td>
          <td className="px-4 py-3">{s.duration}</td>
          <td className="px-4 py-3">
            <StatusBadge
              status={s.status}
              onClick={() => onToggleStatus(s)}
            />
          </td>
          <td className="px-4 py-3">
            <Trash2
              size={18}
              className="cursor-pointer hover:text-red-400"
              onClick={() => onDelete(s, "songs")}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Tab = ({ active, icon, count, children, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
      active
        ? "border-white"
        : "border-gray-600 text-gray-400"
    }`}
  >
    {icon}
    {children}
    <span className="bg-[#2A2F55] text-xs px-2 py-0.5 rounded">
      {count}
    </span>
  </button>
);
