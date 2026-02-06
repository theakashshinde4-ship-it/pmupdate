const { hasPermission } = require('./permissions');

function authorize(permission) {
  return (req, res, next) => {
    const rbacEnabled = String(process.env.RBAC_V2 || '').toLowerCase() === 'true';
    if (!rbacEnabled) return next();

    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!hasPermission(role, permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        message: `You do not have permission to ${permission}`
      });
    }

    next();
  };
}

module.exports = { authorize };
