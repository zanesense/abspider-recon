import React, { useState } from "react";

const PasswordProtected = ({ children }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    typeof window !== "undefined" && localStorage.getItem("auth") === "true"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔹 Fetch call to verify password
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.setItem("auth", "true");
        setAuthenticated(true);
      } else {
        const data = await res.json();
        setError(data.message || "❌ Incorrect password");
      }
    } catch (err) {
      setError("⚠️ Unable to connect. Try again.");
    }

    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px] -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] bottom-10 right-10 animate-pulse"></div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-[90%] max-w-sm shadow-2xl transition-all transform hover:scale-[1.01]"
        >
          <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">
            🔐 Secure Access
          </h2>
          <p className="text-gray-300 text-sm text-center mb-6">
            Enter your password to continue
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="w-full p-3 mb-4 rounded-md bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md text-white font-semibold text-lg tracking-wide transition-all duration-200 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg"
            }`}
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center mt-4">{error}</p>
          )}

          <p className="text-gray-400 text-xs text-center mt-6">
            Protected area — authorized personnel only
          </p>
        </form>
      </div>
    );
  }

  // ✅ Once authenticated, render children content
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Welcome 🔐</h1>
        <button
          onClick={() => {
            localStorage.removeItem("auth");
            setAuthenticated(false);
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  );
};

export default PasswordProtected;
