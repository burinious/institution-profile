const express = require("express");
const multer = require("multer");
const {
  addProfileOption,
  appendActivityLog,
  createStaffAccount,
  deleteStaffAccount,
  findProfileById,
  listActivityLogs,
  listProfileOptions,
  listStaffCategories,
  listStaffProfiles,
  removeProfileOption,
  toggleProfilePublish,
  toggleProfileStatus,
  updateProfile,
  updateUser,
  updateUserPassword
} = require("../lib/store");
const {
  assertInstitutionalEmail,
  buildStaffCsvTemplate,
  normalizeEmail,
  normalizeOptional,
  parseCsv,
  splitLines,
  summarizeAdminProfiles,
  truthyCheckbox
} = require("../lib/helpers");

const router = express.Router();
const DEFAULT_RESET_PASSWORD = "password1@bouesti";
const allowedPerPage = [10, 20, 40, 80];
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

function buildSelectOptions(baseOptions, currentValue) {
  return [...new Set([...(baseOptions || []), String(currentValue || "").trim()].filter(Boolean))];
}

function sortValues(values) {
  return [...new Set((values || []).filter(Boolean))].sort((left, right) =>
    String(left).localeCompare(String(right))
  );
}

function clampPage(value, totalPages) {
  const page = Number.parseInt(value, 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(page, totalPages);
}

function resolveAdminRedirect(req, fallback = "/admin") {
  const redirectTo = normalizeOptional(req.body.redirectTo || req.query.redirectTo);
  return redirectTo.startsWith("/admin") ? redirectTo : fallback;
}

function wantsJson(req) {
  const accept = String(req.headers.accept || "").toLowerCase();
  const requestedWith = String(req.headers["x-requested-with"] || "").toLowerCase();
  return accept.includes("application/json") || requestedWith === "fetch";
}

function recordActivity(entry) {
  try {
    appendActivityLog(entry);
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

function formatActivityTime(value) {
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Just now";
  }

  if (diffMs < 60 * 1000) {
    return "Just now";
  }

  if (diffMs < 60 * 60 * 1000) {
    return `${Math.floor(diffMs / (60 * 1000))} min ago`;
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diffMs / (60 * 60 * 1000))} hr ago`;
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp);
}

function buildRecentActivity(limit = 6) {
  return listActivityLogs(limit).map((entry) => ({
    ...entry,
    actorLabel:
      entry.actorRole === "admin"
        ? "Admin"
        : entry.actorRole === "staff"
          ? "Staff"
          : "System",
    timeLabel: formatActivityTime(entry.createdAt)
  }));
}

function serializeAdminProfile(profileId) {
  const profile = findProfileById(profileId);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.fullName,
    slug: profile.slug,
    email: profile.owner ? profile.owner.email : profile.email,
    title: profile.title,
    staffCategory: profile.staffCategory,
    department: profile.department,
    schoolFaculty: profile.schoolFaculty,
    college: profile.college,
    accountStatus: profile.accountStatus,
    isPublished: profile.isPublished,
    needsPasswordChange: Boolean(profile.owner && profile.owner.mustChangePassword)
  };
}

function respondAdminAction(req, res, payload) {
  const {
    redirectTo = "/admin",
    status = 200,
    type = status >= 400 ? "error" : "success",
    message = "",
    profile = null,
    deletedId = ""
  } = payload;

  if (wantsJson(req)) {
    return res.status(status).json({
      ok: status < 400,
      type,
      message,
      profile,
      deletedId
    });
  }

  req.session.flash = { type, message };
  return res.redirect(redirectTo);
}

function buildStaffManagementView(query = {}) {
  const profiles = listStaffProfiles();
  const profileOptions = listProfileOptions();
  const filters = {
    q: normalizeOptional(query.q),
    college: normalizeOptional(query.college),
    schoolFaculty: normalizeOptional(query.schoolFaculty),
    department: normalizeOptional(query.department),
    accountStatus: normalizeOptional(query.accountStatus),
    visibility: normalizeOptional(query.visibility)
  };

  const filterOptions = {
    colleges: sortValues([...(profileOptions.colleges || []), ...profiles.map((profile) => profile.college)]),
    schools: sortValues([...(profileOptions.schools || []), ...profiles.map((profile) => profile.schoolFaculty)]),
    departments: sortValues([...(profileOptions.departments || []), ...profiles.map((profile) => profile.department)])
  };

  const filteredProfiles = profiles.filter((profile) => {
    const searchText = [
      profile.fullName,
      profile.email,
      profile.department,
      profile.schoolFaculty,
      profile.college,
      profile.title
    ]
      .join(" ")
      .toLowerCase();

    if (filters.q && !searchText.includes(filters.q.toLowerCase())) {
      return false;
    }

    if (filters.college && profile.college !== filters.college) {
      return false;
    }

    if (filters.schoolFaculty && profile.schoolFaculty !== filters.schoolFaculty) {
      return false;
    }

    if (filters.department && profile.department !== filters.department) {
      return false;
    }

    if (filters.accountStatus && profile.accountStatus !== filters.accountStatus) {
      return false;
    }

    if (filters.visibility === "published" && !profile.isPublished) {
      return false;
    }

    if (filters.visibility === "draft" && profile.isPublished) {
      return false;
    }

    return true;
  });

  const perPage = allowedPerPage.includes(Number(query.perPage))
    ? Number(query.perPage)
    : 10;
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / perPage));
  const currentPage = clampPage(query.page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + perPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) => Math.abs(pageNumber - currentPage) <= 2 || pageNumber === 1 || pageNumber === totalPages
  );

  function buildQuery(overrides = {}) {
    const next = {
      q: filters.q,
      college: filters.college,
      schoolFaculty: filters.schoolFaculty,
      department: filters.department,
      accountStatus: filters.accountStatus,
      visibility: filters.visibility,
      perPage,
      page: currentPage,
      ...overrides
    };

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });

    return `/admin/staff/manage?${params.toString()}`;
  }

  return {
    profiles: paginatedProfiles,
    profileOptions,
    adminSummary: summarizeAdminProfiles(profiles),
    filterOptions,
    filters,
    perPage,
    allowedPerPage,
    totalResults: filteredProfiles.length,
    currentPage,
    totalPages,
    pageNumbers,
    buildQuery
  };
}

router.get("/", (req, res) => {
  const profiles = listStaffProfiles();
  const profileOptions = listProfileOptions();

  res.render("admin/dashboard", {
    title: "Admin Dashboard",
    pageClass: "page-admin",
    adminSummary: summarizeAdminProfiles(profiles),
    recentActivity: buildRecentActivity(6),
    profileOptionCounts: {
      colleges: (profileOptions.colleges || []).length,
      schools: (profileOptions.schools || []).length,
      departments: (profileOptions.departments || []).length,
      titles: (profileOptions.titles || []).length
    }
  });
});

router.get("/staff/manage", (req, res) => {
  res.render("admin/staff-management", {
    title: "Manage Staff",
    pageClass: "page-admin",
    ...buildStaffManagementView(req.query)
  });
});

router.get("/options/manage", (req, res) => {
  const profileOptions = listProfileOptions();

  res.render("admin/options-management", {
    title: "Manage Directory Structure",
    pageClass: "page-admin",
    profileOptions,
    optionCounts: {
      colleges: (profileOptions.colleges || []).length,
      schools: (profileOptions.schools || []).length,
      departments: (profileOptions.departments || []).length,
      honoraryTitles: (profileOptions.honoraryTitles || []).length,
      titles: (profileOptions.titles || []).length
    }
  });
});

router.get("/staff/new", (req, res) => {
  res.render("admin/staff-form", {
    title: "Create Staff Account",
    pageClass: "page-admin",
    mode: "create",
    profile: null,
    formOptions: {
      ...listProfileOptions(),
      staffCategories: listStaffCategories()
    }
  });
});

router.post("/staff", async (req, res) => {
  try {
    const fullName = normalizeOptional(req.body.fullName);
    const email = assertInstitutionalEmail(req.body.email);
    const password = normalizeOptional(req.body.password);

    if (!fullName || !email || !password) {
      throw new Error("Full name, institutional email address, and default password are required.");
    }

    await createStaffAccount({
      fullName,
      email,
      password,
      staffCategory: normalizeOptional(req.body.staffCategory)
    });
    recordActivity({
      actorRole: "admin",
      tone: "success",
      title: "Created staff account",
      detail: fullName
    });

    req.session.flash = {
      type: "success",
      message: `Staff account created for ${fullName}.`
    };
    return res.redirect("/admin/staff/manage");
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
    return res.redirect("/admin/staff/new");
  }
});

router.get("/staff/template.csv", (req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="staff-bulk-upload-template.csv"'
  );
  return res.send(buildStaffCsvTemplate());
});

router.post("/staff/import", csvUpload.single("staffCsv"), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    req.session.flash = { type: "error", message: "Upload a CSV file to continue." };
    return res.redirect("/admin");
  }

  try {
    const rows = parseCsv(req.file.buffer.toString("utf8"));

    if (rows.length < 2) {
      throw new Error("CSV file must contain a header row and at least one staff row.");
    }

    const [headerRow, ...dataRows] = rows;
    const normalizedHeaders = headerRow.map((item) => normalizeEmail(item));
    const requiredHeaders = ["fullname", "email", "password"];

    if (requiredHeaders.some((header, index) => normalizedHeaders[index] !== header)) {
      throw new Error("CSV headers must be exactly: fullName,email,password");
    }

    let createdCount = 0;
    const failures = [];

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const rowNumber = index + 2;

      try {
        const fullName = normalizeOptional(row[0]);
        const email = assertInstitutionalEmail(row[1]);
        const password = normalizeOptional(row[2]);

        if (!fullName || !password) {
          throw new Error("Full name and password are required.");
        }

        await createStaffAccount({
          fullName,
          email,
          password
        });
        createdCount += 1;
      } catch (error) {
        failures.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    if (!createdCount && failures.length) {
      throw new Error(failures.join(" "));
    }

    if (createdCount) {
      recordActivity({
        actorRole: "admin",
        tone: failures.length ? "warning" : "success",
        title: failures.length ? "Imported staff with warnings" : "Imported staff accounts",
        detail: failures.length
          ? `${createdCount} created, ${failures.length} issue(s) found.`
          : `${createdCount} staff account(s) added by CSV.`
      });
    }

    req.session.flash = {
      type: failures.length ? "warning" : "success",
      message: failures.length
        ? `${createdCount} staff account(s) created. ${failures.join(" ")}`
        : `${createdCount} staff account(s) created successfully.`
    };
    return res.redirect("/admin/staff/manage");
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
    return res.redirect("/admin/staff/manage");
  }
});

router.get("/staff/:id/edit", (req, res) => {
  const profile = findProfileById(req.params.id);

  if (!profile) {
    req.session.flash = { type: "error", message: "Staff profile not found." };
    return res.redirect("/admin");
  }

  return res.render("admin/staff-form", {
    title: `Edit ${profile.fullName}`,
    pageClass: "page-admin",
    mode: "edit",
    profile,
    formOptions: {
      honoraryTitles: buildSelectOptions(listProfileOptions().honoraryTitles, profile.honoraryTitle),
      staffCategories: buildSelectOptions(listStaffCategories(), profile.staffCategory),
      titles: buildSelectOptions(listProfileOptions().titles, profile.title),
      colleges: buildSelectOptions(listProfileOptions().colleges, profile.college),
      schools: buildSelectOptions(listProfileOptions().schools, profile.schoolFaculty),
      departments: buildSelectOptions(listProfileOptions().departments, profile.department)
    }
  });
});

router.post("/options", (req, res) => {
  try {
    addProfileOption(req.body.field, req.body.value);
    recordActivity({
      actorRole: "admin",
      tone: "success",
      title: "Added directory option",
      detail: `${req.body.field}: ${normalizeOptional(req.body.value)}`
    });
    req.session.flash = { type: "success", message: "Dropdown option added." };
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
  }

  return res.redirect(resolveAdminRedirect(req, "/admin/options/manage"));
});

router.post("/options/remove", (req, res) => {
  try {
    removeProfileOption(req.body.field, req.body.value);
    recordActivity({
      actorRole: "admin",
      tone: "warning",
      title: "Removed directory option",
      detail: `${req.body.field}: ${normalizeOptional(req.body.value)}`
    });
    req.session.flash = { type: "success", message: "Dropdown option removed." };
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
  }

  return res.redirect(resolveAdminRedirect(req, "/admin/options/manage"));
});

router.post("/staff/:id", async (req, res) => {
  const profile = findProfileById(req.params.id);

  if (!profile) {
    req.session.flash = { type: "error", message: "Staff profile not found." };
    return res.redirect("/admin");
  }

  try {
    const fullName = normalizeOptional(req.body.fullName);
    const email = assertInstitutionalEmail(req.body.email);

    updateUser(profile.userId, {
      name: fullName,
      email
    });

    updateProfile(profile.id, {
      fullName,
      honoraryTitle: normalizeOptional(req.body.honoraryTitle),
      staffCategory: normalizeOptional(req.body.staffCategory),
      college: normalizeOptional(req.body.college),
      title: normalizeOptional(req.body.title),
      department: normalizeOptional(req.body.department),
      schoolFaculty: normalizeOptional(req.body.schoolFaculty),
      email,
      emailAddress: normalizeOptional(req.body.emailAddress) || email,
      phone: normalizeOptional(req.body.phone),
      officeAddress: normalizeOptional(req.body.officeAddress),
      bio: normalizeOptional(req.body.bio),
      researchAreas: splitLines(req.body.researchAreas),
      qualifications: splitLines(req.body.qualifications),
      scopusUrl: normalizeOptional(req.body.scopusUrl),
      orcidUrl: normalizeOptional(req.body.orcidUrl),
      googleScholarUrl: normalizeOptional(req.body.googleScholarUrl),
      researchGateUrl: normalizeOptional(req.body.researchGateUrl),
      openScienceUrl: normalizeOptional(req.body.openScienceUrl),
      linkedinUrl: normalizeOptional(req.body.linkedinUrl),
      cvUrl: normalizeOptional(req.body.cvUrl),
      showEmailAddress: truthyCheckbox(req.body.showEmailAddress),
      showPhone: truthyCheckbox(req.body.showPhone),
      showOfficeAddress: truthyCheckbox(req.body.showOfficeAddress),
      showScopusUrl: truthyCheckbox(req.body.showScopusUrl),
      showOrcidUrl: truthyCheckbox(req.body.showOrcidUrl),
      showGoogleScholarUrl: truthyCheckbox(req.body.showGoogleScholarUrl),
      showResearchGateUrl: truthyCheckbox(req.body.showResearchGateUrl),
      showOpenScienceUrl: truthyCheckbox(req.body.showOpenScienceUrl),
      showLinkedinUrl: truthyCheckbox(req.body.showLinkedinUrl),
      showCvUrl: truthyCheckbox(req.body.showCvUrl),
      isPublished: truthyCheckbox(req.body.isPublished),
      accountStatus: truthyCheckbox(req.body.accountStatus) ? "active" : "inactive"
    });
    recordActivity({
      actorRole: "admin",
      tone: "neutral",
      title: "Updated staff profile",
      detail: fullName,
      subjectId: profile.id
    });

    req.session.flash = {
      type: "success",
      message: `Updated ${fullName}'s record.`
    };
    return res.redirect("/admin/staff/manage");
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
    return res.redirect(`/admin/staff/${req.params.id}/edit`);
  }
});

router.post("/staff/:id/reset-password", async (req, res) => {
  const profile = findProfileById(req.params.id);
  const redirectTo = resolveAdminRedirect(req, `/admin/staff/${req.params.id}/edit`);

  if (!profile) {
    return respondAdminAction(req, res, {
      redirectTo: "/admin",
      status: 404,
      message: "Staff profile not found."
    });
  }

  try {
    const password = normalizeOptional(req.body.password) || DEFAULT_RESET_PASSWORD;
    const isDefaultReset = !normalizeOptional(req.body.password);

    await updateUserPassword(profile.userId, password, true);
    recordActivity({
      actorRole: "admin",
      tone: "warning",
      title: "Reset staff password",
      detail: profile.fullName,
      subjectId: profile.id
    });
    return respondAdminAction(req, res, {
      redirectTo,
      message: isDefaultReset
        ? `Password reset for ${profile.fullName}. Default password is ${DEFAULT_RESET_PASSWORD}.`
        : `Password reset for ${profile.fullName}. They must change it at next sign in.`,
      profile: serializeAdminProfile(req.params.id)
    });
  } catch (error) {
    return respondAdminAction(req, res, {
      redirectTo,
      status: 400,
      message: error.message
    });
  }
});

router.post("/staff/:id/toggle-publish", (req, res) => {
  const redirectTo = resolveAdminRedirect(req);
  try {
    const profile = toggleProfilePublish(req.params.id);
    recordActivity({
      actorRole: "admin",
      tone: profile.isPublished ? "success" : "neutral",
      title: profile.isPublished ? "Published staff profile" : "Unpublished staff profile",
      detail: profile.fullName,
      subjectId: profile.id
    });
    return respondAdminAction(req, res, {
      redirectTo,
      message: `${profile.fullName} is now ${
        profile.isPublished ? "published" : "hidden"
      }.`,
      profile: serializeAdminProfile(req.params.id)
    });
  } catch (error) {
    return respondAdminAction(req, res, {
      redirectTo,
      status: 400,
      message: error.message
    });
  }
});

router.post("/staff/:id/toggle-status", (req, res) => {
  const redirectTo = resolveAdminRedirect(req);
  try {
    const profile = toggleProfileStatus(req.params.id);
    recordActivity({
      actorRole: "admin",
      tone: profile.accountStatus === "active" ? "success" : "warning",
      title:
        profile.accountStatus === "active"
          ? "Activated staff account"
          : "Deactivated staff account",
      detail: profile.fullName,
      subjectId: profile.id
    });
    return respondAdminAction(req, res, {
      redirectTo,
      message: `${profile.fullName} is now ${profile.accountStatus}.`,
      profile: serializeAdminProfile(req.params.id)
    });
  } catch (error) {
    return respondAdminAction(req, res, {
      redirectTo,
      status: 400,
      message: error.message
    });
  }
});

router.post("/staff/:id/delete", (req, res) => {
  const redirectTo = resolveAdminRedirect(req);

  try {
    const profile = deleteStaffAccount(req.params.id);
    recordActivity({
      actorRole: "admin",
      tone: "danger",
      title: "Deleted staff account",
      detail: profile.fullName,
      subjectId: profile.id
    });
    return respondAdminAction(req, res, {
      redirectTo,
      message: `${profile.fullName}'s account and profile were deleted.`,
      deletedId: profile.id
    });
  } catch (error) {
    return respondAdminAction(req, res, {
      redirectTo,
      status: 400,
      message: error.message
    });
  }
});

module.exports = router;
