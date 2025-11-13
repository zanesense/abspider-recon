// api/login.js
export default async function handler(req, res) {
  try {
    // Parse body (Vercel functions may give it as a string)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const password = body?.password;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    // Compare with Vercel environment variable
    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ success: false, message: "Invalid password" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
