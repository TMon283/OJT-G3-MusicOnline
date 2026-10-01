import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import type { Banner } from "../../redux/slices/bannerSlice";
import {
  fetchBanners,
  addBanner,
  updateBanner,
  deleteBanner,
} from "../../redux/slices/bannerSlice";

const positionOptions = [
  "HOME_TOP",
  "HOME_MIDDLE",
  "HOME_BOTTOM",
  "PLAYLIST_TOP",
  "PLAYLIST_SIDEBAR",
  "ARTIST_PAGE",
  "ALBUM_PAGE",
];

export function BannerManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { banners } = useSelector((state: RootState) => state.banners);

  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [form, setForm] = useState({
    url: "",
    position: "HOME_TOP",
  });

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!form.url) {
      toast.error("Banner URL is required");
      return;
    }

    if (editBanner) {
      await dispatch(updateBanner({ ...editBanner, ...form }));
      toast.success("Banner updated");
    } else {
      await dispatch(addBanner(form));
      toast.success("Banner added");
    }

    resetForm();
  };

  const handleDelete = async (id: number) => {
    await dispatch(deleteBanner(id));
    toast.success("Banner deleted");
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setForm({ url: "", position: "HOME_TOP" });
    setEditBanner(null);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <h2 className="text-2xl text-white">Banner Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 px-4 py-2 rounded-lg text-white flex gap-2"
        >
          <Plus /> Add Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-[#2a2f4a] p-6 rounded-xl">
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Banner URL"
            className="w-full p-2 mb-3 rounded bg-[#1f2439]"
          />

          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full p-2 rounded bg-[#1f2439]"
          >
            {positionOptions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              className="bg-purple-600 px-4 py-2 rounded"
            >
              {editBanner ? <Check /> : "Add"}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-600 px-4 py-2 rounded"
            >
              <X />
            </button>
          </div>
        </div>
      )}

      <table className="w-full bg-[#2a2f4a] rounded-xl">
        <thead className="bg-[#1f2439]">
          <tr>
            <th className="p-4 text-left text-gray-400">ID</th>
            <th className="p-4 text-left text-gray-400">Preview</th>
            <th className="p-4 text-left text-gray-400">URL</th>
            <th className="p-4 text-left text-gray-400">Position</th>
            <th className="p-4 text-right text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => (
            <tr
              key={b.id}
              className="border-b border-gray-700 hover:bg-[#1f2439]"
            >
              <td className="p-4 text-white">#{b.id}</td>
              <td className="p-4">
                <div className="w-32 h-20 bg-[#1f2439] rounded-lg overflow-hidden">
                  <img
                    src={b.url}
                    alt={`Banner ${b.id}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400";
                    }}
                  />
                </div>
              </td>
              <td className="p-4 text-gray-300 font-mono text-sm">{b.url}</td>
              <td className="p-4">
                <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                  {b.position.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-4 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditBanner(b);
                    setForm({ url: b.url, position: b.position });
                    setShowForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded"
                >
                  <Edit2 />
                </button>

                {deleteConfirm === b.id ? (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(b.id)}
                    className="bg-red-600 hover:bg-red-700 p-2 rounded"
                  >
                    <Trash2 />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
