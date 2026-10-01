import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { getSongStats } from "../../redux/slices/song_statisticsSlice";

export default function Song_statistics() {
  const dispatch = useDispatch<AppDispatch>();

  const { totalSongs, totalViews, songs } = useSelector(
    (state: any) => state.songStatistics
  );

  useEffect(() => {
    dispatch(getSongStats());
  }, [dispatch]);

  const avgViews =
    totalSongs === 0 ? 0 : Math.floor(totalViews / totalSongs);

  const top15Songs = useMemo(() => {
    return [...(songs || [])]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 15);
  }, [songs]);

  return (
    <div className="bg-[#1B2039] text-white min-h-screen">
      <main className="p-10 space-y-10">

        <div>
          <h1 className="text-4xl font-semibold">
            Song Statistics
          </h1>
          <p className="text-gray-400">
            Track performance and view metrics
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">

          <StatCard
            title="Total Songs"
            value={totalSongs}
            note="+0 new this month"
            highlight
          />

          <StatCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            note="All time views"
          />

          <StatCard
            title="Avg. Views / Song"
            value={avgViews.toLocaleString()}
            note="Per song average"
          />
        </div>

        <div className="bg-[#1e2a47] p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            🔥 Top 15 Most Viewed Songs
          </h3>

          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left">Song</th>
                <th className="text-left">Album</th>
                <th className="text-right">Views</th>
              </tr>
            </thead>

            <tbody>
              {top15Songs.map((song: any, i: number) => (
                <tr
                  key={song.id}
                  className="border-b border-gray-700 hover:bg-[#2a345a] transition"
                >
                  <td className="py-2">{i + 1}</td>
                  <td className="font-medium">
                    {song.title}
                  </td>
                  <td className="text-gray-400">
                    {song.album?.title || "—"}
                  </td>
                  <td className="text-right text-green-400">
                    {(song.views || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  note,
  highlight,
}: {
  title: string;
  value: number | string;
  note: string;
  highlight?: boolean;
}) => (
  <div className="bg-[#1e2a47] p-6 rounded-xl shadow">
    <p className="text-gray-300">{title}</p>
    <h2 className="text-4xl font-bold mt-2">
      {value}
    </h2>
    <p
      className={`mt-2 ${
        highlight ? "text-green-400" : "text-gray-400"
      }`}
    >
      {note}
    </p>
  </div>
);

