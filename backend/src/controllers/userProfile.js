import db from "../db/database.js";

const viewUserProfile = async (req, res) => {
  try {
    const loggedInUser = req.user;          
    let { id } = req.params;  

    if (loggedInUser.role !== "admin") {
      id = loggedInUser.user_id;
    }

    // Fetch user info
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
      ` SELECT p.project_name, up.support_type
       FROM user_projects up
       JOIN projects p ON up.project_id = p.project_id
       WHERE up.user_id = ?`,
      [id]
    );

   

    return res.status(200).json({
      message: "User profile fetched successfully",
      user: {
        ...user,
        projects: projectRows,
      },
    });
  } catch (error) {
    console.error("View user profile error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export default viewUserProfile;