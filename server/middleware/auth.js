// server/middleware/auth.js
const jwt = require('jsonwebtoken');

// JWT құпия кілті
const JWT_SECRET = process.env.JWT_SECRET || '2bf646392185d4b4f732a2115b9bee27bc58a638bd7e7ab194043dcf9a15fbe5a251b883918e1b499e1ed720bfc8355362180a7ec1d4c86c8e98acd1694b54084d35f0d6b6666f762fdd1f626afe4c62cd87f29195307deac5bad3e993eb7d3dc9e96645ee1243710d7f0381247c914ea279339702286d0d85105f7936f119d9103b401f549474cd4ae085a549de1cb846ed9710cb8232086767d6dcc4af5b1723618c445069230fd2ceca482554431d1da6923cc4805c832e714b5ce9a154e15685f776e07e568be06ae3289271c224d035646be3dd7631ae35a255276dfe0853e4df3ee44b331a4d0b9fb3703971c2aa42df194a721f324b1d491b0c677646';

// Аутентификация middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');

  // Токен бар-жоғын тексеру
  if (!token) {
    return res.status(401).json({ message: 'Авторизация токені жоқ' });
  }

  try {
    // Токенді тексеру
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Жарамсыз токен' });
  }
};

module.exports = { auth };