const express = require("express");
const bcrypt = require("bcryptjs");
const { findProfileByUserId, findUserByEmail, listPublishedProfiles } = require("../lib/store");
const { summarizePublishedProfiles } = require("../lib/helpers");
const { isAdminRole } = require("../middleware/auth");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) {
    if (isAdminRole(req.session.user.role)) {
      return res.redirect("/admin");
    }

    return res.redirect("/dashboard");
  }

  const staffProfiles = listPublishedProfiles();

  return res.render("login", {
    title: "Sign In",
    pageClass: "page-auth",
    directoryStats: summarizePublishedProfiles(staffProfiles)
  });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);

  if (!user) {
    req.session.flash = { type: "error", message: "Invalid email or password." };
    return res.redirect("/login");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    req.session.flash = { type: "error", message: "Invalid email or password." };
    return res.redirect("/login");
  }

  const profile = user.role === "staff" ? findProfileByUserId(user.id) : null;
  req.session.user = {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
    profileId: profile ? profile.id : null
  };

  if (isAdminRole(user.role)) {
    return res.redirect("/admin");
  }

  return res.redirect("/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
