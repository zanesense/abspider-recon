// api/check-password.js
// CORRECTED to use ADMIN_PASSWORD

module.exports = async (req, res) => {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. CRITICAL CHANGE: Retrieve the password using the correct environment variable name
  const storedPassword = process.env.ADMIN_PASSWORD; 

  // --- CRITICAL CHECK: Ensure the environment variable exists ---
  if (!storedPassword) {
    // This message will appear in your Vercel logs, helping you debug deployment issues.
    console.error("CRITICAL: ADMIN_PASSWORD environment variable is NOT set in Vercel settings!");
    
    // Return a 500 error with a JSON payload for the client
    return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error. (Configuration key missing.)' 
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
    return res.status(200).json({ success: true, message: 'Authentication successful.' });
  } else {
    // Return 401 Unauthorized for incorrect login attempts
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
};