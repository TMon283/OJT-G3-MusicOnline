import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  selectActiveUsers,
  selectTotalUsers,
  selectUserTypeStats,
  selectUserLoading,
  selectUserError,
} from "../../redux/slices/user_statisticsSlice";
import type { AppDispatch } from "../../redux/store";

export default function UserStatistics() {
  const dispatch = useDispatch<AppDispatch>();

  const totalUsers = useSelector(selectTotalUsers);
  const activeUsers = useSelector(selectActiveUsers);
  const userTypeStats = useSelector(selectUserTypeStats);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading)
    return <p className="text-white p-10">Loading users...</p>;

  if (error)
    return <p className="text-red-400 p-10">{error}</p>;

  return (
    <div className="bg-[#1B2039] text-[#eee] min-h-screen p-10">
      <h2 className="text-3xl font-semibold">User Statistics</h2>
      <div className="grid grid-cols-3 gap-6 mt-8">
        <StatCard title="👥 Total Users" value={totalUsers} />
        <StatCard title="🟣 Active Users" value={activeUsers} />
        <StatCard
          title="🟢 Inactive Users"
          value={Math.max(0, totalUsers - activeUsers)}
        />
      </div>

      
      <div className="bg-[#1e2a47] p-6 rounded-xl mt-10">
        <h3 className="text-xl font-semibold mb-4">Users by Role</h3>

        <svg width="100%" height="260">
          {userTypeStats.map((d, i) => {
            const height = d.value * 20;

            return (
              <g key={d.type}>
                <rect
                  x={i * 140 + 80}
                  y={220 - height}
                  width="80"
                  height={height}
                  rx="10"
                  fill="#3b82f6"
                />
                <text
                  x={i * 140 + 120}
                  y={235}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="14"
                >
                  {d.type}
                </text>
                <text
                  x={i * 140 + 120}
                  y={210 - height}
                  textAnchor="middle"
                  fill="#a5b4fc"
                  fontSize="14"
                >
                  {d.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-[#1e2a47] p-5 rounded-xl">
    <p>{title}</p>
    <h3 className="text-4xl font-bold mt-2">
      {value.toLocaleString()}
    </h3>
  </div>
);
