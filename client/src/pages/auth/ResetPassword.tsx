import { useState } from "react";
import Swal from "sweetalert2";
import userApi from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Key } from "lucide-react";

export default function ResetPassword() {
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleReset = async () => {
        const savedOtp = localStorage.getItem("resetOtp");
        const email = localStorage.getItem("resetEmail");

        if (!savedOtp || !email) {
            Swal.fire("Lỗi", "OTP đã hết hạn!", "error");
            return;
        }

        if (otp !== savedOtp) {
            Swal.fire("Lỗi", "OTP không đúng!", "error");
            return;
        }

        if (password.length < 8) {
            Swal.fire("Lỗi", "Mật khẩu tối thiểu 8 ký tự!", "error");
            return;
        }

        const user = await userApi.getUserByEmail(email);

        await userApi.updateUser(user.id, {
            ...user,
            password,
        });

        localStorage.removeItem("resetOtp");
        localStorage.removeItem("resetEmail");

        Swal.fire("Thành công", "Đổi mật khẩu thành công!", "success");
        navigate("/login");
    };

    return (
        <div className="w-screen min-h-screen bg-linear-to-b from-slate-800 via-slate-700 to-slate-800 
            flex justify-center items-center font-[Poppins]">

            <div className="w-[420px] bg-gradient-to-br from-[#009fdb] to-[#17c0ad] 
                rounded-2xl p-8 text-white shadow-xl">

                <h2 className="text-3xl font-extrabold text-center mb-6">
                    Reset Password
                </h2>

                <p className="text-center text-sm mb-6 opacity-90">
                    Nhập mã OTP và mật khẩu mới
                </p>

                <div className="mb-4">
                    <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            className="flex-1 outline-none text-black text-[15px]"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <Key className="text-black" />
                    </div>
                </div>

                <div className="mb-4">
                    <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                        <input
                            type="password"
                            placeholder="New Password"
                            className="flex-1 outline-none text-black text-[15px]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <LockKeyhole className="text-black" />
                    </div>
                </div>

                <button
                    onClick={handleReset}
                    className="w-full mt-4 py-3 rounded-full font-semibold text-[16px]
                    border-2 border-white bg-transparent text-white
                    transition duration-200 hover:bg-white hover:text-black"
                >
                    Xác nhận
                </button>

                <p className="mt-6 text-center text-sm">
                    Quay lại{" "}
                    <a href="/login" className="font-semibold underline">
                        Đăng nhập
                    </a>
                </p>
            </div>
        </div>
    );
}
