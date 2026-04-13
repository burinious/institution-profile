function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: "error", message: "Please log in to continue." };
    return res.redirect("/login");
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.flash = { type: "error", message: "Admin access is required." };
    return res.redirect("/login");
  }

  return next();
}

function requireStaff(req, res, next) {
  if (!req.session.user || req.session.user.role !== "staff") {
    req.session.flash = { type: "error", message: "Staff access is required." };
    return res.redirect("/login");
  }

  return next();
}

module.exports = {
  attachUser,
  requireAdmin,
  requireAuth,
  requireStaff
};
