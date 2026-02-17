export const isAdmin = (req, res, next) => {
  // Assuming 'authenticate' middleware has already run and attached 'req.user'
  // req.user.role comes from the JWT token payload
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
};
