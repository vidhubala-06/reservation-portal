import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(form);
      if (from) navigate(from, { replace: true });   // return to the form after signup
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Create your account</h2>
        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required className={inputClass} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className={inputClass} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputClass} />
          <button type="submit" className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700">Create account</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" state={{ from: location.state?.from }} className="font-medium text-green-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;