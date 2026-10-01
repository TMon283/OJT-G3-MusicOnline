import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import { LockKeyhole, Mail, User } from "lucide-react";
import headphones from "../../assets/images/headphones.png";
import userApi from "../../api/userApi";
import type { RegisterType } from "../../interfaces/interface";


export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<RegisterType>({});
    const [submitRegister, setSubmitRegister] = useState(false);

    const validate = () => {
        const newErrors: RegisterType = {};

        if (!name.trim()) newErrors.name = "Tên không được để trống";

        if (!email) newErrors.email = "Email không được để trống";
        else if (!/\S+@\S+\.\S+/.test(email))
            newErrors.email = "Email sai định dạng";

        if (password.length < 8)
            newErrors.password = "Mật khẩu phải ít nhất 8 ký tự";

        if (confirm !== password)
            newErrors.confirm = "Mật khẩu không khớp";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitRegister) return;
        if (!validate()) return;
        setSubmitRegister(true);
        try {
             const existingUser = await userApi.getUserByEmail(email);

            if (existingUser) {
                Swal.fire("Lỗi", "Email đã tồn tại!", "error");
                setSubmitRegister(false);
                return;
            }
            const parts = name.trim().split(/\s+/);

            let first_name = "";
            let last_name = "";

            if (parts.length === 1) {
                last_name = parts[0];
            } else {
                last_name = parts[parts.length - 1];
                first_name = parts.slice(0, -1).join(" ");
            }

            const pendingUser = {
                first_name,
                last_name,
                email,
                password
            };

            localStorage.setItem("pendingUser", JSON.stringify(pendingUser));

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            localStorage.setItem("otp", otp);

            await emailjs.send(
                "service_ng9rr49",
                "template_sg8t1ut",
                {
                    to_email: email,
                    otp:otp
                },
                "SmSfC2OI324ENhhJi" 
            );

            Swal.fire("Thành công", "OTP đã gửi đến email!", "success");
            navigate("/verify");

        } catch (err) {
            console.log(err);
            Swal.fire("Lỗi", "Không thể xử lý đăng ký!", "error");
            setSubmitRegister(false);
        }
    };

    return (
        <div className="w-screen min-h-screen bg-linear-to-b from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm flex justify-center items-center font-[Poppins]">
            <div className="w-[80%] h-[75%] bg-gradient-to-br from-[#009fdb] to-[#17c0ad]
                rounded-2xl p-10 flex text-white
                max-[1024px]:w-[90%] max-[1024px]:h-auto max-[1024px]:flex-col max-[1024px]:text-center
                max-[768px]:w-[95%] max-[768px]:p-5">

                <div className="flex-1 flex justify-center items-center max-[1024px]:hidden">
                    <img src={headphones} alt="music-logo" className="w-[80%]" />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-[40px] font-extrabold mb-6 text-center max-[768px]:text-[26px]">
                        Register / Sign Up
                    </h2>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

                        <div>
                            <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter Your Name"
                                    className="flex-1 outline-none text-black text-[15px]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <User className="text-black" />
                            </div>
                            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
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
                            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                                <input
                                    type="password"
                                    placeholder="Enter Password"
                                    className="flex-1 outline-none text-black text-[15px]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <LockKeyhole className="text-black" />
                            </div>
                            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <div className="p-4 rounded-xl bg-white flex items-center gap-3">
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    className="flex-1 outline-none text-black text-[15px]"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                />
                                <LockKeyhole className="text-black" />
                            </div>
                            {errors.confirm && <p className="text-red-600 text-sm mt-1">{errors.confirm}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={submitRegister}
                            className={`mt-5 mx-auto px-12 py-4 rounded-full font-semibold
                            border-2 border-white text-[16px]
                            transition duration-200
                            ${submitRegister
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                    : "bg-transparent text-white hover:bg-white hover:text-black"
                                }`}
                        >
                            {submitRegister ? "Sending OTP..." : "Register Now"}
                        </button>

                    </form>

                    <p className="mt-4 text-center text-[14px]">
                        Already Have An Account?{" "}
                        <a href="/login" className="font-semibold text-white">Login Here</a>
                    </p>
                </div>
            </div>
        </div>

    );

}
