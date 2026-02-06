module.exports = function (req, res, next) {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ msg: 'Access denied. Managers only.' });
    }
    next();
  };
