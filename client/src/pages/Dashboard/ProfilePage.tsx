import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import userApi from "../../api/userApi";
import type { ProlifePage } from "../../interfaces/interface";


export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<ProlifePage| null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editInfo, setEditInfo] = useState({
    first_name: "",
    last_name: "",
    email:""
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setEditInfo({
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      email: userData.email || "",
    });

    if (userData.profile_image) {
      setPreviewImage(userData.profile_image);
    }
  }, [navigate]);

  const getInitial = () => {
    if (!user) return "?";
    return (
      user.first_name?.charAt(0) ||
      user.last_name?.charAt(0) ||
      user.email?.charAt(0) ||
      "?"
    ).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAvatar = async () => {
    if (!user?.id || !selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageBase64 = reader.result as string;

      const updatedUser: ProlifePage = {
        ...user!,
        profile_image: imageBase64, 
      };

      await userApi.updateUser(user!.id!, updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPreviewImage(imageBase64); 
      setSelectedFile(null);

      Swal.fire("Thành công", "Cập nhật ảnh đại diện thành công!", "success");
    };

    reader.readAsDataURL(selectedFile);
  };


  const handleUpdateInfo = async () => {
    if (!editInfo.first_name || !editInfo.last_name) {
      Swal.fire("Lỗi", "Không được để trống!", "error");
      return;
    }

    const updatedUser = {
      ...user,
      first_name: editInfo.first_name,
      last_name: editInfo.last_name,
      email: editInfo.email,
    };

    await userApi.updateUser(user!.id!, updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);

    Swal.fire("Thành công", "Cập nhật thông tin thành công!", "success");
    setShowEditInfo(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.oldPassword !== user?.password) {
      Swal.fire("Lỗi", "Mật khẩu cũ không đúng!", "error");
      return;
    } 

    if (passwordData.newPassword.length < 8) {
      Swal.fire("Lỗi", "Mật khẩu mới ít nhất 6 ký tự!", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp!", "error");
      return;
    }

    const updatedUser = {
      ...user,
      password: passwordData.newPassword,
    };

    await userApi.updateUser(user!.id!, updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);

    Swal.fire("Thành công", "Đổi mật khẩu thành công!", "success");
    setShowChangePassword(false);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-cyan-400">
          Thông tin cá nhân
        </h1>

        <div className="bg-slate-800/50 rounded-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              {previewImage ? (
                <img
                  src={previewImage}
                  className="w-40 h-40 rounded-full object-cover border-4 border-cyan-500"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-cyan-600 flex items-center justify-center text-5xl font-bold">
                  {getInitial()}
                </div>
              )}
            </div>

            <label className="cursor-pointer bg-cyan-500 px-4 py-2 rounded">
              Chọn ảnh
              <input type="file" hidden onChange={handleFileChange} />
            </label>

            {selectedFile && (
              <button
                onClick={handleUpdateAvatar}
                className="mt-3 bg-green-500 px-4 py-2 rounded"
              >
                Cập nhật ảnh
              </button>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                readOnly
                value={user.first_name}
                className="p-2 bg-slate-700 rounded"
              />
              <input
                readOnly
                value={user.last_name}
                className="p-2 bg-slate-700 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                readOnly
                value={user.email}
                className="p-2 bg-slate-700 rounded"
              />

              <input
                readOnly
                type="password"
                value={user.password}
                className="p-2 bg-slate-700 rounded"
              />
            </div>


            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowEditInfo(true)}
                className="flex-1 bg-cyan-500 py-2 rounded"
              >
                Đổi thông tin
              </button>

              <button
                onClick={() => setShowChangePassword(true)}
                className="flex-1 bg-orange-500 py-2 rounded"
              >
                Đổi mật khẩu
              </button>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-slate-600 py-2 rounded mt-4"
            >
              Quay lại Dashboard
            </button>
          </div>
        </div>
      </div>

      {showEditInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-[400px]">
            <h3 className="text-xl text-cyan-400 mb-4">Đổi thông tin</h3>

            <input
              className="w-full p-2 bg-slate-700 rounded mb-3"
              value={editInfo.first_name}
              onChange={(e) =>
                setEditInfo({ ...editInfo, first_name: e.target.value })
              }
            />

            <input
              className="w-full p-2 bg-slate-700 rounded mb-4"
              value={editInfo.last_name}
              onChange={(e) =>
                setEditInfo({ ...editInfo, last_name: e.target.value })
              }
            />
            <input
              className="w-full p-2 bg-slate-700 rounded mb-4"
              value={editInfo.email}
              onChange={(e) =>
                setEditInfo({ ...editInfo, email: e.target.value })
              }
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowEditInfo(false)}
                className="flex-1 bg-slate-600 py-2 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateInfo}
                className="flex-1 bg-green-500 py-2 rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-[400px]">
            <h3 className="text-xl text-orange-400 mb-4">Đổi mật khẩu</h3>

            <input
              type="password"
              placeholder="Mật khẩu cũ"
              className="w-full p-2 bg-slate-700 rounded mb-3"
              onChange={(e) =>
                setPasswordData({ ...passwordData, oldPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="w-full p-2 bg-slate-700 rounded mb-3"
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              className="w-full p-2 bg-slate-700 rounded mb-4"
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 bg-slate-600 py-2 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-green-500 py-2 rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
