// api/check-password.cjs
// This file uses CommonJS (CJS) syntax, indicated by the .cjs extension.

module.exports = async (req, res) => {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // 2. Retrieve the password using the correct environment variable name
  const storedPassword = process.env.ADMIN_PASSWORD; 

  // --- CRITICAL CHECK: Ensure the environment variable exists ---
  if (!storedPassword) {
    // This returns a JSON 500 error to the client, preventing the HTML parsing crash
    console.error("CRITICAL: ADMIN_PASSWORD environment variable is NOT set in Vercel settings!");
    return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error. Please check Vercel logs.' 
    });
  }
  // -----------------------------------------------------------

  // 3. Get the password entered by the user
  const { password } = req.body; 

  // 4. Input validation
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  // 5. Comparison
  if (password === storedPassword) {
    // 200 OK
    return res.status(200).json({ success: true, message: 'Authentication successful.' });
  } else {
    // 401 Unauthorized
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
};