import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import userApi from "../../api/userApi";
export default function VerifyEmail() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputs = useRef<Array<HTMLInputElement | null>>(new Array(6).fill(null));

    const handleChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;
        const arr = [...otp];
        arr[index] = value;
        setOtp(arr);

        if (value && index < 5) inputs.current[index + 1]?.focus();
        if (!value && index > 0) inputs.current[index - 1]?.focus();
    };

    const handleVerify = async () => {
        const realOtp = localStorage.getItem("otp");
        const pendingUser = JSON.parse(localStorage.getItem("pendingUser") || "{}");

        if (!pendingUser.email) {
            Swal.fire("Lỗi", "Không tìm thấy thông tin tài khoản!", "error");
            return;
        }

        if (otp.join("") !== realOtp) {
            Swal.fire("Sai OTP", "Vui lòng thử lại!", "error");
            return;
        }

        try {
            const newUser = {
                first_name: pendingUser.first_name,
                last_name: pendingUser.last_name,
                email: pendingUser.email,
                password: pendingUser.password,

                profile_image: "/images/users/default.jpg",
                bio: "New user",
                status: "ACTIVE",
                role: "ROLE_USER",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),

                albums: [],
                favorites: [],
                downloads: [],
                history: [],
                // subscriptions / payments đã bỏ trong db.json
            };

            await userApi.createUser(newUser);

            localStorage.removeItem("otp");
            localStorage.removeItem("pendingUser");

            Swal.fire("Thành công!", "Xác minh email thành công!", "success");
            navigate("/login");
        } catch (error) {
            Swal.fire("Lỗi", "Không thể tạo tài khoản!", "error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-xl shadow-lg w-[350px]">
                <h2 className="text-xl font-bold text-center mb-4">Nhập mã OTP</h2>

                <div className="flex justify-between mb-6">
                    {otp.map((value, i) => (
                        <input
                            key={i}
                            maxLength={1}
                            className="w-10 h-10 border text-center rounded text-lg"
                            value={value}
                            onChange={(e) => handleChange(e.target.value, i)}
                            ref={(el) => { inputs.current[i] = el }}
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerify}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                    Xác minh
                </button>
            </div>
        </div>
    );
}
