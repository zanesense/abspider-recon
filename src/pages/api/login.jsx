export default function handler(req, res) {
  const body = req.body ? JSON.parse(req.body) : {};
  if (body.password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
}
