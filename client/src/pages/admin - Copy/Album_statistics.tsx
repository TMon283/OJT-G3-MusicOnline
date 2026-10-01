import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { getAlbumStats } from "../../redux/slices/album_statisticsSlice";

export default function AlbumStatistics() {
  const dispatch = useDispatch<AppDispatch>();
  const { albums } = useSelector(
    (state: RootState) => state.albumStatistics
  );

  useEffect(() => {
    dispatch(getAlbumStats());
  }, [dispatch]);

  const totalAlbums = albums.length;

  const totalSongsInAlbums = useMemo(() => {
    return albums.reduce(
      (sum, album) => sum + album.songs.length,
      0
    );
  }, [albums]);

  const avgSongPerAlbum = useMemo(() => {
    if (!totalAlbums) return 0;
    return totalSongsInAlbums / totalAlbums;
  }, [totalAlbums, totalSongsInAlbums]);

  const albumDistribution = useMemo(() => {
    const ranges = [
      { label: "1–3 songs", min: 1, max: 3, value: 0, color: "#3b82f6" },
      { label: "4–6 songs", min: 4, max: 6, value: 0, color: "#a78bfa" },
      { label: "7–10 songs", min: 7, max: 10, value: 0, color: "#ec4899" },
      { label: "11–15 songs", min: 11, max: 15, value: 0, color: "#10b981" },
      { label: "16+ songs", min: 16, max: Infinity, value: 0, color: "#22c55e" },
    ];

    albums.forEach((album) => {
      const count = album.songs.length;
      const range = ranges.find(
        (r) => count >= r.min && count <= r.max
      );
      if (range) range.value++;
    });

    const total = ranges.reduce((s, r) => s + r.value, 0);

    return ranges.map((r) => ({
      label: r.label,
      color: r.color,
      percent: total ? Math.round((r.value / total) * 100) : 0,
    }));
  }, [albums]);

  const top15Albums = useMemo(() => {
    return [...albums]
      .map((album) => ({
        ...album,
        totalViews: album.songs.reduce(
          (s, song) => s + (song.views || 0),
          0
        ),
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 15);
  }, [albums]);

  return (
    <div className="bg-[#1B2039] text-[#eee] min-h-screen p-10 space-y-10">
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Total Albums" value={totalAlbums} />
        <StatCard title="Total Songs" value={totalSongsInAlbums} />
        <StatCard
          title="Avg Songs / Album"
          value={avgSongPerAlbum.toFixed(1)}
        />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <PieChart data={albumDistribution} />
        <Legend data={albumDistribution} />
      </div>
      <div className="bg-[#1e2a47] p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4">
          🔥 Top 15 Albums Most Played
        </h3>

        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="text-left py-2">#</th>
              <th className="text-left">Album</th>
              <th className="text-center">Songs</th>
              <th className="text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            {top15Albums.map((a, i) => (
              <tr
                key={a.id}
                className="border-b border-gray-700 hover:bg-[#2a345a] transition"
              >
                <td className="py-2">{i + 1}</td>
                <td>{a.title}</td>
                <td className="text-center">{a.songs.length}</td>
                <td className="text-right">
                  {a.totalViews.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <div className="bg-[#1e2a47] p-6 rounded-xl">
    <p className="text-gray-300">{title}</p>
    <h3 className="text-4xl font-bold mt-2">
      {typeof value === "number"
        ? value.toLocaleString()
        : value}
    </h3>
  </div>
);

const PieChart = ({
  data,
}: {
  data: { percent: number; color: string }[];
}) => {
  const active = data.filter((d) => d.percent > 0);

  return (
    <div className="bg-[#1e2a47] p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">
        Albums by Song Count
      </h3>

      <svg
        viewBox="0 0 200 200"
        className="w-full h-64 mx-auto"
      >
        {active.length === 1 && active[0].percent === 100 ? (
          <circle
            cx="100"
            cy="100"
            r="80"
            fill={active[0].color}
          />
        ) : (
          (() => {
            let acc = 0;
            return active.map((d, i) => {
              const start = (acc / 100) * 2 * Math.PI;
              const end =
                ((acc + d.percent) / 100) * 2 * Math.PI;
              acc += d.percent;

              const x1 = 100 + 80 * Math.cos(start);
              const y1 = 100 + 80 * Math.sin(start);
              const x2 = 100 + 80 * Math.cos(end);
              const y2 = 100 + 80 * Math.sin(end);

              const largeArc = end - start > Math.PI ? 1 : 0;

              return (
                <path
                  key={i}
                  d={`M100,100 L${x1},${y1} A80,80 0 ${largeArc} 1 ${x2},${y2} Z`}
                  fill={d.color}
                />
              );
            });
          })()
        )}
      </svg>
    </div>
  );
};

const Legend = ({
  data,
}: {
  data: { label: string; percent: number; color: string }[];
}) => (
  <div className="bg-[#1e2a47] p-6 rounded-xl flex flex-col justify-center gap-4">
    {data.map((d, i) => (
      <div
        key={i}
        className="flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: d.color }}
          />
          <span>{d.label}</span>
        </div>
        <span className="font-semibold">{d.percent}%</span>
      </div>
    ))}
  </div>
);
