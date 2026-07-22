const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role?.name)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    next();
  };
};

export default authorize;
