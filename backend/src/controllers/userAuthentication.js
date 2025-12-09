import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    if (!email || !password) {
      return res.status(400).json({
        errors: ["Email and password are required"],
      });
    }

    
    const [rows] = await db.execute(
      `SELECT user_id, username, full_name, email, mobile, role, password 
       FROM users 
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        errors: ["Invalid email or password"],
      });
    }

    // Compare password
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        errors: ["Invalid email or password"],
      });
    }

    // Create JWT access token
    const accessToken = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );


    res.status(200).json({
      message: "Logged in successfully",
      accessToken, 
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default loginUser;
