/* ================= CHECK AUTH MIDDLEWARE ================= */

export const requireAuth = (req, res, next) => {
  // Check if user is authenticated via Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: "Unauthorized - Please login first",
      code: "NO_AUTH"
    });
  }

  // For now, just check if token exists
  // In production, you can verify JWT token here
  req.userId = authHeader;
  next();
};
