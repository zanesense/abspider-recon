// api/check-password.js

// Vercel automatically creates a Serverless Function for any file in the /api directory.
// This function will be accessible at: YOUR_VERCEL_URL/api/check-password

// Note: process.env.ADMIN_PASSWORD is ONLY available securely on the server (the function).

module.exports = async (req, res) => {
  // 1. Check if the request method is POST
  if (req.method !== 'POST') {
    // Respond with Method Not Allowed (405)
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Safely extract the secret environment variable
  const storedPassword = process.env.ADMIN_PASSWORD;

  // 3. Extract the password sent by the user from the request body
  const { password } = req.body;

  // 4. Basic input validation
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  // 5. SECURE COMPARISON (Always use a constant-time comparison library 
  //    like 'bcrypt' for real-world scenarios, but for a simple env variable check, 
  //    a direct comparison is sufficient as it's not a user login)
  if (password === storedPassword) {
    // Success: Send back an OK status (200)
    return res.status(200).json({ success: true, message: 'Authentication successful.' });
  } else {
    // Failure: Send back Unauthorized status (401)
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
};