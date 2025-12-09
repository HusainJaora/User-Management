import db from '../../db/database.js';
export const getAllProjects = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT project_id, project_name 
       FROM projects 
       ORDER BY project_name ASC`
    );

    res.status(200).json({
      success: true,
      projects: rows
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching projects"
    });
  }
};

