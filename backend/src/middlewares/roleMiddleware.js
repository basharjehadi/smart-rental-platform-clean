// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    // Ensure roles is an array
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({
        error:
          'Insufficient permissions. Required roles: ' + rolesArray.join(', '),
      });
    }

    next();
  };
};

// Specific role middlewares
const requireTenant = requireRole(['TENANT']);
const requireLandlord = requireRole(['LANDLORD']);
const requireAdmin = requireRole(['ADMIN']);

export { requireRole, requireTenant, requireLandlord, requireAdmin };
