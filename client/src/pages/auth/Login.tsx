import { useState, type FormEvent } from "react";
import headphones from "../../assets/images/headphones.png";
import { LockKeyhole, Mail } from "lucide-react";
import Swal from "sweetalert2";
import userApi from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import type { LoginType } from "../../interfaces/type";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<LoginType>({});
    const navigate = useNavigate();
    const validate = () => {
        const newErrors: LoginType = {};

        if (!email) newErrors.email = "Email không được để trống";
        else if (!/\S+@\S+\.\S+/.test(email))
            newErrors.email = "Email sai định dạng";

        if (!password) newErrors.password = "Mật khẩu không được để trống";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            const existingUser = await userApi.getUserByEmail(email);

            if (!existingUser) {
                return Swal.fire("Error", "Email does not exist!", "error");
            }

            if (existingUser.password !== password) {
                return Swal.fire("Error", "Incorrect password!", "error");
            }

            // Kiểm tra trạng thái tài khoản
            if (existingUser.status === "INACTIVE") {
                return Swal.fire("Error", "Your account has been deactivated. Please contact administrator!", "error");
            }

            const userRole = await userApi.getUserRole(existingUser.id);
            
            const userWithRole = {
                ...existingUser,
                role: userRole
            };
            localStorage.setItem("user", JSON.stringify(userWithRole));
            sessionStorage.setItem("userLoggedIn", "true");

            Swal.fire("Success", "Login successful!", "success");

            if (userRole === "ROLE_ADMIN") {
                window.location.href = "/admin";
            } else {
                window.location.href = "/dashboard";
            }

        } catch (err) {
            Swal.fire("Error", "Unable to login!", "error");
            console.error(err);
        }
    };
    return (
        <div className="w-screen min-h-screen bg-linear-to-b from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm flex justify-center items-center font-[Poppins] ">

            <div className="w-[80%] h-[75%] bg-gradient-to-br from-[#009fdb] to-[#17c0ad] 
        rounded-2xl p-10 flex text-white
        max-[1024px]:w-[90%] max-[1024px]:h-auto max-[1024px]:flex-col max-[1024px]:text-center
        max-[768px]:w-[95%] max-[768px]:p-5">

                {/* LEFT IMG */}
                <div className="flex-1 flex justify-center items-center max-[1024px]:hidden">
                    <img src={headphones} alt="music-logo" className="w-[80%]" />
                </div>

                {/* RIGHT FORM */}
                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-[40px] font-extrabold mb-6 text-center max-[768px]:text-[26px]">
                        Login / Sign In
                    </h2>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

                        {/* EMAIL */}
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
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email}</p>
                            )}
                        </div>

                        {/* PASSWORD */}
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
                            {errors.password && (
                                <p className="text-red-500 text-sm">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-[14px] max-[768px]:text-[12px]">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" /> Keep Me Signed In
                            </label>

                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-white hover:text-gray-200"
                            >
                                Forget Password
                            </button>

                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="mt-5 mx-auto px-12 py-4 rounded-full font-semibold cursor-pointer
                            border-2 border-white bg-transparent text-white text-[16px]
                            transition duration-200 hover:bg-white hover:text-black
                            max-[768px]:px-10 max-[768px]:py-3 max-[768px]:text-[14px]"
                        >
                            Login Now
                        </button>
                    </form>

                    <p className="mt-5 text-center text-[14px]">
                        <i>Don't Have An Account?</i>{" "}
                        <a href="/register" className="font-semibold text-white">
                            Register Here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
