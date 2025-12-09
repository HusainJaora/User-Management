import bcrypt from 'bcrypt';
import db from '../../db/database.js';


const addUser = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const {
      username,
      full_name,
      email,
      mobile,
      role,
      password,
      projects,
    } = req.body;

    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1) Insert user
    const [userResult] = await connection.execute(
      `
      INSERT INTO users (username, full_name, email, mobile, role, password)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [username, full_name, email, mobile, role, hashedPassword]
    );

    const userId = userResult.insertId;

    // 2) Insert user_projects
    for (const p of projects) {
      if (!p.project_id || !p.support_type) {
        throw new Error("Each project must include project_id and support_type");
      }

      // Check if project exists
      const [projectRows] = await connection.execute(
        `
        SELECT project_id FROM projects WHERE project_id = ?
        `,
        [p.project_id]
      );

      if (projectRows.length === 0) {
        throw new Error(`Invalid project_id: ${p.project_id}. Project does not exist.`);
      }

      // Insert mapping
      await connection.execute(
        `
        INSERT INTO user_projects (user_id, project_id, support_type)
        VALUES (?, ?, ?)
        `,
        [userId, p.project_id, p.support_type]
      );
    }

    await connection.commit();

    return res.status(201).json({
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

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  } finally {
    if (connection) connection.release();
  }
};

const editUser = async (req, res) => {
  const { id } = req.params; // or parseInt if you prefer
  const { username, full_name, email, mobile, role } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1) Ensure user exists
    const [existingRows] = await connection.query(
      `SELECT * FROM users WHERE user_id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const existing = existingRows[0];

    // 2) Conditional duplicate checks (only if field provided)
    if (username) {
      const [dup] = await connection.query(
        `SELECT user_id FROM users WHERE username = ? AND user_id != ?`,
        [username, id]
      );
      if (dup.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Username already in use by another user" });
      }
    }

    if (email) {
      const [dup] = await connection.query(
        `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
        [email, id]
      );
      if (dup.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Email already in use by another user" });
      }
    }

    // 3) Update only provided fields using COALESCE to preserve existing values
    await connection.query(
      `
      UPDATE users
      SET
        username   = COALESCE(?, username),
        full_name  = COALESCE(?, full_name),
        email      = COALESCE(?, email),
        mobile     = COALESCE(?, mobile),
        role       = COALESCE(?, role)
      WHERE user_id = ?
      `,
      [username, full_name, email, mobile, role, id]
    );

    await connection.commit();

    // 4) Return merged user object (show final values)
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        user_id: id,
        username: username ?? existing.username,
        full_name: full_name ?? existing.full_name,
        email: email ?? existing.email,
        mobile: mobile ?? existing.mobile,
        role: role ?? existing.role
      }
    });
  } catch (error) {
    try { await connection.rollback(); } catch (e) { console.error("Rollback error:", e); }
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
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


     const [projectRows] = await db.execute(
      `SELECT p.project_name, up.support_type
       FROM user_projects up
       JOIN projects p ON up.project_id = p.project_id
       WHERE up.user_id = ?`,
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




export { addUser, deleteUser, getAllUsers, getSingleUser, editUser };
