import { useState } from "react";
import Swal from "sweetalert2";
import emailjs from "@emailjs/browser";
import userApi from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!email) {
            Swal.fire("Lỗi", "Vui lòng nhập email", "error");
            return;
        }

        const user = await userApi.getUserByEmail(email);
        if (!user) {
            Swal.fire("Lỗi", "Email không tồn tại!", "error");
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        localStorage.setItem("resetOtp", otp);
        localStorage.setItem("resetEmail", email);

        setLoading(true);

        await emailjs.send(
            "service_ng9rr49",
            "template_sg8t1ut",
            { to_email: email, otp },
            "SmSfC2OI324ENhhJi"
        );

        Swal.fire("Thành công", "OTP đã gửi tới email!", "success");
        navigate("/reset-password");

        setTimeout(() => setLoading(false), 60000);
    };

    return (
        <div className="w-screen min-h-screen bg-linear-to-b from-slate-800 via-slate-700 to-slate-800 
            flex justify-center items-center font-[Poppins]">

            <div className="w-[420px] bg-gradient-to-br from-[#009fdb] to-[#17c0ad] 
                rounded-2xl p-8 text-white shadow-xl">

                <h2 className="text-3xl font-extrabold text-center mb-6">
                    Forgot Password
                </h2>

                <p className="text-center text-sm mb-6 opacity-90">
                    Nhập email đã đăng ký để nhận mã OTP
                </p>

                <div className="mb-4">
                    <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                        <input
                            type="email"
                            placeholder="Enter Your Email"
                            className="flex-1 outline-none text-black text-[15px]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Mail className="text-black" />
                    </div>
                </div>

                <button
                    disabled={loading}
                    onClick={handleSendOtp}
                    className={`w-full mt-4 py-3 rounded-full font-semibold text-[16px]
                    border-2 border-white transition duration-200
                    ${loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-transparent text-white hover:bg-white hover:text-black"
                        }`}
                >
                    {loading ? "Vui lòng đợi 60s..." : "Gửi OTP"}
                </button>

                <p className="mt-6 text-center text-sm">
                    Nhớ mật khẩu rồi?{" "}
                    <a href="/login" className="font-semibold underline">
                        Quay lại đăng nhập
                    </a>
                </p>
            </div>
        </div>
    );
}
