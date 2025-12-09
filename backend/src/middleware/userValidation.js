import joi from 'joi';
import db from '../db/database.js';

// Project schema
const projectSchema = joi.object({
  project_id: joi.number().integer().positive().required().messages({
    "number.base": "Project ID must be a number",
    "number.empty": "Project ID is required",
    "number.integer": "Project ID must be an integer",
    "number.positive": "Project ID must be a positive number",
    "any.required": "Project ID is required"
  }),

  support_type: joi.string().trim().required().messages({
    "string.base": "Support type must be a string",
    "string.empty": "Support type is required",
    "any.required": "Support type is required"
  })
});


const addUserValidation = async (req, res, next) => {
  const schema = joi.object({
    username: joi.string().trim().min(3).max(50).required().messages({
      "string.base": "Username must be a string",
      "string.empty": "Username is required",
      "string.min": "Username must be at least 3 characters",
      "any.required": "Username is required"
    }),

    full_name: joi.string().trim().min(3).max(100).required().messages({
      "string.base": "Full name must be a string",
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "any.required": "Full name is required"
    }),

    email: joi.string().trim().email().required().messages({
      "string.base": "Email must be a string",
      "string.email": "Email must be valid",
      "string.empty": "Email is required",
      "any.required": "Email is required"
    }),

    mobile: joi.string()
      .trim()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.base": "Mobile number must be a string",
        "string.empty": "Mobile number is required",
        "string.pattern.base": "Mobile number must be exactly 10 digits",
        "any.required": "Mobile number is required"
      }),

    role: joi.string()
      .valid("Admin", "Developer", "Tester", "Customer Support")
      .required()
      .messages({
        "any.only": "Role must be Admin, Developer, Tester, or Customer Support",
        "string.empty": "Role is required",
        "any.required": "Role is required"
      }),

    password: joi.string().min(6).required().messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required"
    }),

    projects: joi.array().items(projectSchema).min(1).required().messages({
      "array.base": "Projects must be an array",
      "array.min": "At least one project is required",
      "any.required": "Projects are required"
    })
  });

  // Validate with clean messages (no quotes, no slashes)
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    errors: { label: "key" }
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map(e => e.message)
    });
  }

  next();
};

const checkDuplicateUser = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    // If somehow missing, let other validators handle it
    if (!username && !email) {
      return next();
    }

    const [rows] = await db.execute(
      `SELECT username, email 
       FROM users 
       WHERE username = ? OR email = ?`,
      [username, email]
    );

    const errors = [];

    for (const row of rows) {
      if (row.username === username) {
        errors.push('Username already exists');
      }
      if (row.email === email) {
        errors.push('Email already exists');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  } catch (err) {
    console.error('Duplicate user check error:', err);
    return res.status(500).json({ message: 'Server error while checking user' });
  }
};

export  { addUserValidation, checkDuplicateUser };




