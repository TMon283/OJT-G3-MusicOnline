
import { useEffect, useState } from "react";
import type { AppDispatch } from "../../redux/store";
import { Search, UserCheck, UserX, Mail, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { fetchUsers, toggleUserStatus } from "../../redux/slices/userSlice";
export default function UserList() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <p className="text-white">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-white">User List</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#2a2f4a] border border-gray-600 rounded-lg text-white w-64"
          />
        </div>
      </div>

      <div className="bg-[#2a2f4a] rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1f2439]">
            <tr>
              <th className="px-6 py-4 text-left text-gray-400">ID</th>
              <th className="px-6 py-4 text-left text-gray-400">Name</th>
              <th className="px-6 py-4 text-left text-gray-400">Email</th>
              <th className="px-6 py-4 text-left text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-gray-400">
                Subscription
              </th>
              <th className="px-6 py-4 text-left text-gray-400">Joined</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => {
              const fullName = `${user.first_name} ${user.last_name}`;
              return (
                <tr
                  key={user.id}
                  className="border-t border-gray-700 hover:bg-[#232842]"
                >
                  <td className="px-6 py-4 text-gray-300">{user.id}</td>
                  <td className="px-6 py-4 text-white">{fullName}</td>
                  <td className="px-6 py-4 text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {user.email}
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => dispatch(toggleUserStatus(user.id))}
                  >
                    <div className="flex items-center gap-2">
                      {user.status === "ACTIVE" ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">Active</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400">
                      Free
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {user.created_at.slice(0, 10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
