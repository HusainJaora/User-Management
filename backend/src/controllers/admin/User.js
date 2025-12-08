import bcrypt from 'bcrypt';
import db from '../../db/database.js';

const addUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { username, full_name, email, mobile, role, password, projects } = req.body;

    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (username, full_name, email, mobile, role, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, full_name, email, mobile, role, hashedPassword]
    );

    const userId = userResult.insertId;

    // Insert projects
    for (const p of projects) {
      if (!p.project_name || !p.support_type) {
        throw new Error("Each project must include project_name and support_type");
      }

      await connection.execute(
        `INSERT INTO user_projects (user_id, project_name, support_type)
         VALUES (?, ?, ?)`,
        [userId, p.project_name, p.support_type]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "User created successfully",
      userId,
      role,

    });

  } catch (error) {
    console.error("Add user error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const deleteUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params; 

    await connection.beginTransaction();

    // 1) Check if user exists
    const [userRows] = await connection.execute(
      `SELECT user_id FROM users WHERE user_id = ?`,
      [id]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // 2) Delete related projects first 
    await connection.execute(
      `DELETE FROM user_projects WHERE user_id = ?`,
      [id]
    );

    // 3) Delete user
    const [deleteResult] = await connection.execute(
      `DELETE FROM users WHERE user_id = ?`,
      [id]
    );

    await connection.commit();

    return res.status(200).json({
      message: "User deleted successfully",
      deletedUserId: id,
    });

  } catch (error) {
    console.error("Delete user error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    return res.status(500).json({
      message: "Server error while deleting user",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, full_name, email, role 
       FROM users
       ORDER BY user_id DESC`
    );

    res.status(200).json({
      message: "Users fetched successfully",
      users: rows
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      message: "Server error while fetching users",
      error: error.message 
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params; 

    // Fetch user details
    const [userRows] = await db.execute(
      `SELECT user_id, username, full_name, email, mobile, role 
       FROM users 
       WHERE user_id = ?`,
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRows[0];

    // Fetch projects
    const [projectRows] = await db.execute(
      `SELECT project_name, support_type
       FROM user_projects
       WHERE user_id = ?`,
      [id]
    );

    
    const responseData = {
      ...user,
      projects: projectRows // array of project objects
    };

    return res.status(200).json({
      message: "User fetched successfully",
      user: responseData
    });

  } catch (error) {
    console.error("Get single user error:", error);
    return res.status(500).json({
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};


export { addUser, deleteUser, getAllUsers, getSingleUser };
