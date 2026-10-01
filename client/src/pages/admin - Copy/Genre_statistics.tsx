import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { getGenreStats } from "../../redux/slices/genre_statisticsSlice";

export default function Genre_Statistics() {
  const dispatch = useDispatch<AppDispatch>();

  const { totalGenres, totalSongs, genreStats } = useSelector(
    (state: RootState) => state.genreStatistics
  );

  useEffect(() => {
    dispatch(getGenreStats());
  }, [dispatch]);

  return (
    <div className="bg-[#1B2039] text-white min-h-screen flex">
      <main className="flex-1 p-10">

        <h1 className="text-3xl font-bold">Music Genre Statistics</h1>
        <p className="text-gray-300 mt-1">
          Thống kê số lượng bài hát theo thể loại âm nhạc
        </p>

        <div className="grid grid-cols-2 gap-6 mt-10">
          <StatBox title="Tổng số bài hát" value={totalSongs} />
          <StatBox title="Tổng số thể loại" value={totalGenres} />
        </div>

        <div className="bg-[#1e2a47] mt-10 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 flex justify-between">
            <span>Danh sách thể loại</span>
            <span>Bài hát</span>
          </h3>

          <div className="divide-y divide-gray-700">
            {genreStats.map((g, index) => (
              <div
                key={g.id}
                className="flex justify-between py-4 text-lg"
              >
                <div className="flex gap-6">
                  <span className="text-gray-400">{index + 1}</span>
                  <span>{g.name}</span>
                </div>

                <span className="w-20 text-right">
                  {g.songs.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const StatBox = ({
  title,
  value,
}: {
  title: string;
  value: number;
}) => (
  <div className="bg-[#1e2a47] p-6 rounded-lg flex justify-between items-center">
    <p className="text-lg">{title}</p>
    <h2 className="text-4xl font-bold">
      {value.toLocaleString()}
    </h2>
  </div>
);
