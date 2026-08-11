import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname; // where they came from (e.g. /post-turf)

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      if (from) navigate(from, { replace: true });          // return to the form
      else if (user.role === "admin") navigate("/admin");
      else if (user.role === "owner") navigate("/owner");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Welcome back</h2>
        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
          <button type="submit" className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700">Login</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          New here?{" "}
          <Link to="/signup" state={{ from: location.state?.from }} className="font-medium text-green-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;