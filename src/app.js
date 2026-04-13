require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const staffRoutes = require("./routes/staff");
const { attachUser, requireAdmin, requireStaff } = require("./middleware/auth");
const {
  appendActivityLog,
  findProfileById,
  findProfileByUserId,
  seedAdmin,
  updateProfile
} = require("./lib/store");
const { normalizeOptional } = require("./lib/helpers");
const { uploadImageBuffer } = require("./lib/cloudinary");

const app = express();
const port = Number(process.env.PORT || 3000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

function recordActivity(entry) {
  try {
    appendActivityLog(entry);
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bouesti-directory-secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static(path.join(process.cwd(), "public")));
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.siteName = "BOUESTI Staff Directory";
  next();
});

app.use(publicRoutes);
app.use(authRoutes);

app.post(
  "/dashboard/upload",
  requireStaff,
  upload.fields([{ name: "photoFile", maxCount: 1 }]),
  async (req, res) => {
    const profile = findProfileByUserId(req.session.user.id);

    if (!profile) {
      req.session.flash = { type: "error", message: "Profile not found." };
      return res.redirect("/dashboard");
    }

    try {
      const updates = {};
      const photoFile = req.files && req.files.photoFile ? req.files.photoFile[0] : null;

      if (!photoFile || !photoFile.buffer) {
        throw new Error("Choose a photo file to upload.");
      }

      const uploadResult = await uploadImageBuffer(photoFile.buffer);
      updates.photoUrl = uploadResult.secure_url;
      updateProfile(profile.id, updates);
      recordActivity({
        actorRole: "staff",
        tone: "success",
        title: "Updated profile image",
        detail: profile.fullName,
        subjectId: profile.id
      });
      req.session.flash = {
        type: "success",
        message: "Profile image uploaded successfully."
      };
    } catch (error) {
      req.session.flash = { type: "error", message: error.message };
    }

    return res.redirect("/dashboard");
  }
);

app.post(
  "/admin/staff/:id/upload",
  requireAdmin,
  upload.fields([{ name: "photoFile", maxCount: 1 }]),
  async (req, res) => {
    const profile = findProfileById(req.params.id);

    if (!profile) {
      req.session.flash = { type: "error", message: "Profile not found." };
      return res.redirect("/admin");
    }

    try {
      const updates = {};
      const photoFile = req.files && req.files.photoFile ? req.files.photoFile[0] : null;
      let activityTitle = "Updated profile image";

      if (photoFile && photoFile.buffer) {
        const uploadResult = await uploadImageBuffer(photoFile.buffer);
        updates.photoUrl = uploadResult.secure_url;
        activityTitle = "Uploaded profile image";
      } else if (normalizeOptional(req.body.photoUrl)) {
        updates.photoUrl = normalizeOptional(req.body.photoUrl);
        activityTitle = "Updated profile image URL";
      } else {
        throw new Error("Choose a photo file or provide a photo URL.");
      }

      updateProfile(profile.id, updates);
      recordActivity({
        actorRole: "admin",
        tone: "neutral",
        title: activityTitle,
        detail: profile.fullName,
        subjectId: profile.id
      });
      req.session.flash = { type: "success", message: "Assets updated." };
    } catch (error) {
      req.session.flash = { type: "error", message: error.message };
    }

    return res.redirect(`/admin/staff/${req.params.id}/edit`);
  }
);

app.use("/admin", requireAdmin, adminRoutes);
app.use("/dashboard", requireStaff, staffRoutes);

app.use((req, res) => {
  res.status(404).render("public/not-found", {
    title: "Page Not Found",
    pageClass: "page-not-found"
  });
});

seedAdmin()
  .then(() => {
    app.listen(port, () => {
      console.log(`BOUESTI staff directory running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start application:", error);
    process.exit(1);
  });
