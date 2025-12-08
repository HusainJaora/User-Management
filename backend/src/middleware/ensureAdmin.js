const ensureAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: token data not found" });
  }

  if (user.role !== 'Admin') {
    return res.status(403).json({ message: "Forbidden: only Admins can perform this action" });
  }

  next();
};

export default ensureAdmin;
