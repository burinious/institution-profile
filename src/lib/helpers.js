const path = require("path");
const institutionalDomain = (
  process.env.INSTITUTIONAL_EMAIL_DOMAIN || "bouesti.edu.ng"
).toLowerCase();

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function displayName(profile) {
  if (profile.fullName && profile.fullName.trim()) {
    return profile.fullName.trim();
  }

  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}

function sanitizeFilename(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  const base = path
    .basename(filename || "file", ext)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "file"}${ext}`;
}

function truthyCheckbox(value) {
  return value === "on" || value === "true" || value === true;
}

function normalizeOptional(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : "";
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function summarizePublishedProfiles(profiles) {
  const list = Array.isArray(profiles) ? profiles : [];
  const countUnique = (values) => new Set(values.filter(Boolean)).size;

  return {
    totalProfiles: list.length,
    totalColleges: countUnique(list.map((profile) => profile.college)),
    totalSchools: countUnique(list.map((profile) => profile.schoolFaculty)),
    totalDepartments: countUnique(list.map((profile) => profile.department))
  };
}

function summarizeAdminProfiles(profiles) {
  const list = Array.isArray(profiles) ? profiles : [];

  return {
    totalProfiles: list.length,
    publishedProfiles: list.filter((profile) => profile.isPublished).length,
    activeProfiles: list.filter((profile) => profile.accountStatus === "active").length,
    pendingProfiles: list.filter((profile) => !profile.isPublished).length,
    passwordResetCount: list.filter(
      (profile) => profile.owner && profile.owner.mustChangePassword
    ).length
  };
}

function summarizeProfileCompleteness(profile) {
  const value = profile || {};
  const checks = [
    Boolean(String(value.fullName || "").trim()),
    Boolean(String(value.title || "").trim()),
    Boolean(String(value.department || "").trim()),
    Boolean(String(value.schoolFaculty || "").trim()),
    Boolean(String(value.college || "").trim()),
    Boolean(String(value.bio || "").trim()),
    Array.isArray(value.qualifications) && value.qualifications.length > 0,
    Array.isArray(value.researchAreas) && value.researchAreas.length > 0,
    Boolean(String(value.emailAddress || value.email || "").trim()),
    Boolean(String(value.photoUrl || "").trim()),
    Boolean(
      String(
        value.scopusUrl ||
          value.orcidUrl ||
          value.googleScholarUrl ||
          value.researchGateUrl ||
          value.openScienceUrl ||
          value.linkedinUrl ||
          value.cvUrl ||
          ""
      ).trim()
    )
  ];

  const completedItems = checks.filter(Boolean).length;
  const totalItems = checks.length;

  return {
    completedItems,
    totalItems,
    completionPercent: Math.round((completedItems / totalItems) * 100)
  };
}

function assertInstitutionalEmail(value) {
  const email = normalizeEmail(value);

  if (!email) {
    throw new Error("Institutional email address is required.");
  }

  if (!email.endsWith(`@${institutionalDomain}`)) {
    throw new Error(`Email must use the @${institutionalDomain} domain.`);
  }

  return email;
}

function parseCsv(content) {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  const normalized = String(content || "").replace(/\r\n/g, "\n");

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const nextCharacter = normalized[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if (character === "\n" && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  if (currentField.length || currentRow.length) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function escapeCsvField(value) {
  const stringValue = String(value ?? "");
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildStaffCsvTemplate() {
  const headers = ["fullName", "email", "password"];
  const sample = ["Dr. Ayoyinka Akomolafe", "ayoyinka.akomolafe@bouesti.edu.ng", "Staff@12345"];

  return `${headers.map(escapeCsvField).join(",")}\n${sample
    .map(escapeCsvField)
    .join(",")}\n`;
}

module.exports = {
  assertInstitutionalEmail,
  buildStaffCsvTemplate,
  createId,
  displayName,
  normalizeEmail,
  normalizeOptional,
  parseCsv,
  sanitizeFilename,
  slugify,
  splitLines,
  summarizeAdminProfiles,
  summarizeProfileCompleteness,
  summarizePublishedProfiles,
  truthyCheckbox
};
