
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Music, Check, X, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import type { Genre } from "../../redux/slices/genreSlice";
import {
  fetchGenres,
  addGenre,
  updateGenre,
  deleteGenre,
} from "../../redux/slices/genreSlice";

const CLOUDINARY_CLOUD_NAME = 'dglknpibu';
const CLOUDINARY_UPLOAD_PRESET = 'music_app_unsigned';

export function GenreManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { genres } = useSelector((state: RootState) => state.genres);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    genre_name: "",
    cover_image: "",
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState('');
  const [imageError, setImageError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setImageError('Chỉ chấp nhận JPEG hoặc PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Tối đa 5MB');
      return;
    }

    setImageError('');
    setCoverImageName(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();

      if (data.secure_url) {
        setCoverImage(data.secure_url);
        setFormData(prev => ({ ...prev, cover_image: data.secure_url }));
        toast.success('Upload ảnh thành công!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setImageError('Không thể upload ảnh');
      toast.error('Upload thất bại');
      console.error(err);
    }
  };

  useEffect(() => {
    dispatch(fetchGenres());
  }, [dispatch]);


  const handleAddGenre = async () => {
    if (!formData.genre_name.trim()) {
      toast.error("Please enter a genre name");
      return;
    }

    await dispatch(addGenre({ 
      genre_name: formData.genre_name,
      cover_image: formData.cover_image || undefined,
    }));
    toast.success("Genre added successfully");

    setShowAddForm(false);
    setFormData({ genre_name: "", cover_image: "" });
    setCoverImage(null);
    setCoverImageName('');
  };

  const handleUpdateGenre = async (id: number) => {
    if (!formData.genre_name.trim()) {
      toast.error("Please enter a genre name");
      return;
    }

    await dispatch(
      updateGenre({
        id,
        genre_name: formData.genre_name,
        cover_image: formData.cover_image || undefined,
      })
    );

    toast.success("Genre updated successfully");
    setEditingGenre(null);
    setFormData({ genre_name: "", cover_image: "" });
    setCoverImage(null);
    setCoverImageName('');
  };

  const handleDeleteGenre = async (id: number) => {
    await dispatch(deleteGenre(id));
    toast.success("Genre deleted successfully");
    setDeleteConfirm(null);
  };

  const startEdit = (genre: Genre) => {
    setEditingGenre(genre.id);
    setFormData({ 
      genre_name: genre.genre_name,
      cover_image: genre.cover_image || "",
    });
    setCoverImage(genre.cover_image || null);
    setCoverImageName(genre.cover_image ? 'current-cover.jpg' : '');
  };

  const cancelEdit = () => {
    setEditingGenre(null);
    setFormData({ genre_name: "", cover_image: "" });
    setCoverImage(null);
    setCoverImageName('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-white">Genre Management</h2>
          <p className="text-gray-400 mt-1">
            Manage music genres and categories
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg hover:shadow-purple-500/50"
        >
          <Plus className="w-5 h-5" />
          Add New Genre
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2a2f4a] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6 hover:shadow-[0_6px_12px_rgba(0,0,0,0.3)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Genres</p>
              <p className="text-3xl text-white mt-2">{genres.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Tag className="w-7 h-7 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#2a2f4a] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6 hover:shadow-[0_6px_12px_rgba(0,0,0,0.3)] transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Music Categories</p>
              <p className="text-3xl text-white mt-2">{genres.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Music className="w-7 h-7 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
      {showAddForm && (
        <div className="bg-[#2a2f4a] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6 animate-in fade-in duration-200">
          <h3 className="text-xl text-white mb-4">Add New Genre</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Genre Name *</label>
              <input
                value={formData.genre_name}
                onChange={(e) =>
                  setFormData({ ...formData, genre_name: e.target.value })
                }
                placeholder="e.g., Pop, Rock, Jazz"
                className="w-full px-4 py-3 bg-[#1f2439] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Genre Cover Image (optional)
              </label>
              <div className="flex gap-4">
                {coverImage ? (
                  <div className="relative group">
                    <img
                      src={coverImage}
                      alt="Genre cover"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500/50"
                    />
                    <button
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImageName('');
                        setFormData({ ...formData, cover_image: "" });
                      }}
                      className="absolute top-2 right-2 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-xs text-gray-400 mt-2 truncate">{coverImageName}</p>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition">
                    <Upload className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="flex-1 text-xs text-gray-400">
                  <p className="mb-1">Requirements:</p>
                  <ul className="space-y-0.5">
                    <li>✓ JPEG or PNG only</li>
                    <li>✓ Max 5MB</li>
                  </ul>
                  {imageError && <p className="text-red-400 mt-2">{imageError}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddGenre}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Add Genre
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ genre_name: "", cover_image: "" });
                  setCoverImage(null);
                  setCoverImageName('');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-[#2a2f4a] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1f2439]">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400">ID</th>
                <th className="px-6 py-4 text-left text-gray-400">Genre</th>
                <th className="px-6 py-4 text-right text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {genres.map((genre) => (
                <tr
                  key={genre.id}
                  className="hover:bg-[#1f2439] transition-colors"
                >
                  {editingGenre === genre.id ? (
                    <>
                      <td className="px-6 py-4 text-white">#{genre.id}</td>
                      <td className="px-6 py-4" colSpan={2}>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              value={formData.genre_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  genre_name: e.target.value,
                                })
                              }
                              placeholder="Genre name"
                              className="flex-1 px-4 py-2 bg-[#1f2439] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 mb-2 text-sm flex items-center gap-2">
                              <Image className="w-4 h-4" />
                              Cover Image
                            </label>
                            <div className="flex gap-4">
                              {coverImage ? (
                                <div className="relative group">
                                  <img
                                    src={coverImage}
                                    alt="Genre cover"
                                    className="w-24 h-24 object-cover rounded-lg border-2 border-purple-500/50"
                                  />
                                  <button
                                    onClick={() => {
                                      setCoverImage(null);
                                      setCoverImageName('');
                                      setFormData({ ...formData, cover_image: "" });
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <label className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition">
                                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-400">Upload</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleUpdateGenre(genre.id)
                              }
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                            >
                              <Check className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-white">#{genre.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {genre.cover_image ? (
                            <img
                              src={genre.cover_image}
                              alt={genre.genre_name}
                              className="w-10 h-10 rounded-lg object-cover shadow-lg"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                              <Tag className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <span className="text-white text-lg">
                            {genre.genre_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(genre)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="Edit genre"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirm === genre.id ? (
                            <>
                              <button
                                onClick={() =>
                                  handleDeleteGenre(genre.id)
                                }
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm shadow-md"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                setDeleteConfirm(genre.id)
                              }
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Delete genre"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {genres.length === 0 && (
        <div className="bg-[#2a2f4a] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">No genres found. Add your first genre to get started.</p>
        </div>
      )}
    </div>
  );
}
