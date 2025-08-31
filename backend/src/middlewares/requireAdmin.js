export const requireAdmin = (req, res, next) => {
  console.log('requireAdmin middleware called');
  console.log('User object:', req.user);
  console.log('User role:', req.user?.role);
  
  if (req.user && req.user.role === 'ADMIN') {
    console.log('Admin access granted');
    next();
  } else {
    console.log('Admin access denied');
    res.status(403).json({
      error: 'Access denied. Admin privileges required.',
    });
  }
};
