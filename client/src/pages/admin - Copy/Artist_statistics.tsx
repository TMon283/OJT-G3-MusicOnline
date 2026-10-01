import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { getArtistStats } from "../../redux/slices/artist_statisticsSlice";

export default function Artist_Statistics() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    totalArtists,
    totalSongs,
    totalAlbums,
    artists,
  } = useSelector((state: RootState) => state.artistStatistics);

  useEffect(() => {
    dispatch(getArtistStats());
  }, [dispatch]);

  return (
    <div className="bg-[#1B2039] text-white min-h-screen flex">
      <main className="flex-1 p-10">

        <h1 className="text-3xl font-bold">Artist Statistics</h1>
        <p className="text-gray-300 mt-1">
          Thống kê số lượng bài hát và album theo nghệ sĩ
        </p>

        <div className="grid grid-cols-3 gap-6 mt-8">
          <StatBox label="Tổng số nghệ sĩ" value={totalArtists} />
          <StatBox label="Tổng số bài hát" value={totalSongs.toLocaleString()} />
          <StatBox label="Tổng số album" value={totalAlbums} />
        </div>

        <div className="bg-[#1e2a47] mt-12 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 flex justify-between">
            <span>Danh sách nghệ sĩ</span>
            <span className="flex gap-20 text-gray-300 text-base">
              <span>Bài hát</span>
              <span>Album</span>
            </span>
          </h3>

          <div className="divide-y divide-gray-700">
            {artists.length > 0 ? (
              artists.map((artist, index) => (
                <div
                  key={artist.id}
                  className="flex justify-between py-4 items-center text-lg"
                >
                  <div className="flex gap-6">
                    <span className="text-gray-400">{index + 1}</span>
                    <span>{artist.name}</span>
                  </div>

                  <div className="flex gap-20 text-right">
                    <span className="w-16">{artist.totalSongs}</span>
                    <span className="w-12">{artist.totalAlbums}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-6">
                Chưa có dữ liệu nghệ sĩ
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const StatBox = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="bg-[#1e2a47] p-6 rounded-lg">
    <p className="text-gray-300">{label}</p>
    <h2 className="text-4xl font-bold mt-3">{value}</h2>
  </div>
);
