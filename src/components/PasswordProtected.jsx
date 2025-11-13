import React, { useState } from "react";

const PasswordProtected = ({ children }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem("auth") === "true"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
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
      setError("⚠️ Unable to connect to server");
    }

    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-6 rounded-xl w-80 flex flex-col"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">🔐 Enter Password</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-3 p-2 rounded-md text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-md text-white font-semibold"
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
          {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        </form>
      </div>
    );
  }

  return <>{children}</>;
};

export default PasswordProtected;
