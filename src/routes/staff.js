const express = require("express");
const {
  appendActivityLog,
  updateProfile,
  updateUser,
  updateUserPassword,
  listCustomLinkFields,
  findProfileByUserId,
  listProfileOptions,
  listStaffCategories
} = require("../lib/store");
const {
  normalizeAcademicLink,
  normalizeOptional,
  splitLines,
  summarizeProfileCompleteness,
  truthyCheckbox
} = require("../lib/helpers");

const router = express.Router();

function buildSelectOptions(baseOptions, currentValue) {
  return [...new Set([...(baseOptions || []), String(currentValue || "").trim()].filter(Boolean))];
}

function buildCustomLinks(body, customLinkFields) {
  return customLinkFields.reduce((result, field) => {
    const rawValue = normalizeOptional(body[`customLink_${field.id}`]);

    result[field.id] = {
      value: normalizeAcademicLink(rawValue, { isDoi: field.id === "doi" }),
      visible: truthyCheckbox(body[`showCustomLink_${field.id}`])
    };

    return result;
  }, {});
}

function recordActivity(entry) {
  try {
    appendActivityLog(entry);
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

router.get("/", (req, res) => {
  const profile = findProfileByUserId(req.session.user.id);

  if (!profile) {
    req.session.flash = { type: "error", message: "Profile not found." };
    return res.redirect("/login");
  }

  return res.render("staff/dashboard", {
    title: "My Staff Profile",
    pageClass: "page-staff",
    profile,
    customLinkFields: listCustomLinkFields(),
    profileSummary: summarizeProfileCompleteness(profile),
    publicUrl: `${req.protocol}://${req.get("host")}/prs/${profile.slug}`,
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

router.post("/", async (req, res) => {
  const profile = findProfileByUserId(req.session.user.id);

  if (!profile) {
    req.session.flash = { type: "error", message: "Profile not found." };
    return res.redirect("/dashboard");
  }

  try {
    const fullName = normalizeOptional(req.body.fullName);
    const emailAddress = normalizeOptional(req.body.emailAddress);
    const customLinkFields = listCustomLinkFields();

    const updatedUser = updateUser(profile.userId, {
      name: fullName || profile.fullName,
      email: normalizeOptional(req.body.loginEmail) || profile.email
    });

    updateProfile(profile.id, {
      fullName,
      honoraryTitle: normalizeOptional(req.body.honoraryTitle),
      staffCategory: normalizeOptional(req.body.staffCategory),
      college: normalizeOptional(req.body.college),
      title: normalizeOptional(req.body.title),
      department: normalizeOptional(req.body.department),
      schoolFaculty: normalizeOptional(req.body.schoolFaculty),
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
      emailAddress,
      cvUrl: normalizeOptional(req.body.cvUrl),
      customLinks: buildCustomLinks(req.body, customLinkFields),
      showEmailAddress: truthyCheckbox(req.body.showEmailAddress),
      showPhone: truthyCheckbox(req.body.showPhone),
      showOfficeAddress: truthyCheckbox(req.body.showOfficeAddress),
      showScopusUrl: truthyCheckbox(req.body.showScopusUrl),
      showOrcidUrl: truthyCheckbox(req.body.showOrcidUrl),
      showGoogleScholarUrl: truthyCheckbox(req.body.showGoogleScholarUrl),
      showResearchGateUrl: truthyCheckbox(req.body.showResearchGateUrl),
      showOpenScienceUrl: truthyCheckbox(req.body.showOpenScienceUrl),
      showLinkedinUrl: truthyCheckbox(req.body.showLinkedinUrl),
      showCvUrl: truthyCheckbox(req.body.showCvUrl)
    });

    const newPassword = normalizeOptional(req.body.newPassword);
    if (newPassword) {
      await updateUserPassword(profile.userId, newPassword, false);
      req.session.user.mustChangePassword = false;
    }

    recordActivity({
      actorRole: "staff",
      tone: "neutral",
      title: newPassword ? "Updated profile and password" : "Updated own profile",
      detail: updatedUser.name,
      subjectId: profile.id
    });

    req.session.user.name = updatedUser.name;
    req.session.user.email = updatedUser.email;

    req.session.flash = {
      type: "success",
      message: "Your profile has been saved."
    };
    return res.redirect("/dashboard");
  } catch (error) {
    req.session.flash = { type: "error", message: error.message };
    return res.redirect("/dashboard");
  }
});

module.exports = router;
