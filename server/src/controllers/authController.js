const { loginUser, registerUser } = require('../services/authService');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.warn('[AuthController] register missing fields', { name: !!name, email: !!email });
      return res.status(400).json({ message: 'All fields are required' });
    }
    console.log('[AuthController] register attempt', { email });
    const user = await registerUser({ name, email, password });
    console.log('[AuthController] register success', { userId: user.id });
    return res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    console.error('[AuthController] register error', error.message);
    return res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.warn('[AuthController] login missing fields', { email: !!email });
      return res.status(400).json({ message: 'Email and password are required' });
    }
    console.log('[AuthController] login attempt', { email });
    const result = await loginUser({ email, password });
    console.log('[AuthController] login success', { userId: result.user.id });
    return res.json(result);
  } catch (error) {
    console.error('[AuthController] login error', error.message);
    return res.status(401).json({ message: error.message });
  }
}

module.exports = { register, login };
