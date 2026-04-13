const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { createId, displayName, slugify, truthyCheckbox } = require("./helpers");

const dataPath = path.join(process.cwd(), "data", "db.json");
const defaultProfileOptions = {
  honoraryTitles: ["Dr.", "Prof.", "Engr.", "Mr.", "Mrs.", "Miss."],
  titles: [
    "Professor",
    "Associate Professor",
    "Senior Lecturer",
    "Lecturer I",
    "Lecturer II",
    "Assistant Lecturer",
    "Administrative Officer"
  ],
  colleges: [
    "College of Education",
    "College of Science",
    "College of Technology"
  ],
  schools: [
    "School of Agriculture and Agricultural Technology",
    "School of Multi-Disciplinary Studies",
    "School of Social Sciences",
    "School of Science Education",
    "School of Pure and Applied Sciences",
    "School of Social and Management Sciences",
    "School of Engineering Technology",
    "School of Environmental Technology",
    "School of Vocational and Entrepreneurial Studies"
  ],
  departments: [
    "Arts Education",
    "Business Education",
    "Counselling Psychology",
    "Department of Architecture",
    "Department of Biological Sciences",
    "Department of Building Technology",
    "Department of Chemical Sciences",
    "Department of Civil Engineering",
    "Department of Computing and Information Science",
    "Department of Economics",
    "Department of Electrical/Electronics Engineering",
    "Department of Entrepreneurial Arts",
    "Department of Entrepreneurial Studies",
    "Department of Food Science and Technology",
    "Department of Mathematical Sciences",
    "Department of Management Sciences",
    "Department of Media and Performing Studies",
    "Department of Mechanical Engineering",
    "Department of Peace and Security Studies",
    "Department of Physics",
    "Department of Political Science and International Diplomacy",
    "Department of Spatial and Planning Sciences",
    "Department of Tourism and Hospitality Management",
    "Educational Foundations and Management",
    "Educational Technology",
    "General Studies",
    "Human Kinetics and Health Education",
    "Industrial Technology Education",
    "Language Education",
    "Science Education",
    "Social Sciences Education"
  ]
};
const defaultCustomLinkFields = [{ id: "doi", label: "DOI" }];

const optionFieldMap = {
  honoraryTitles: "honoraryTitle",
  titles: "title",
  colleges: "college",
  schools: "schoolFaculty",
  departments: "department"
};
const staffCategories = ["Academic Staff", "Non Teaching Staff"];
const publicVisibilityFields = [
  "showEmailAddress",
  "showPhone",
  "showOfficeAddress",
  "showScopusUrl",
  "showOrcidUrl",
  "showGoogleScholarUrl",
  "showResearchGateUrl",
  "showOpenScienceUrl",
  "showLinkedinUrl",
  "showCvUrl"
];
const maxActivityLogEntries = 80;

const defaultProfileValues = {
  firstName: "",
  lastName: "",
  honoraryTitle: "",
  staffCategory: "Academic Staff",
  college: "",
  title: "",
  department: "",
  schoolFaculty: "",
  email: "",
  phone: "",
  officeAddress: "",
  bio: "",
  researchAreas: [],
  qualifications: [],
  scopusUrl: "",
  orcidUrl: "",
  googleScholarUrl: "",
  researchGateUrl: "",
  openScienceUrl: "",
  linkedinUrl: "",
  emailAddress: "",
  cvUrl: "",
  customLinks: {},
  showEmailAddress: true,
  showPhone: true,
  showOfficeAddress: true,
  showScopusUrl: true,
  showOrcidUrl: true,
  showGoogleScholarUrl: true,
  showResearchGateUrl: true,
  showOpenScienceUrl: true,
  showLinkedinUrl: true,
  showCvUrl: true,
  photoUrl: "",
  accountStatus: "active",
  isPublished: false
};

const academicHierarchy = {
  "College of Education": {
    "School of Social Sciences": [
      "Business Education",
      "Counselling Psychology",
      "Social Sciences Education"
    ],
    "School of Science Education": [
      "Educational Technology",
      "Human Kinetics and Health Education",
      "Industrial Technology Education",
      "Science Education"
    ],
    "School of Multi-Disciplinary Studies": [
      "Arts Education",
      "Educational Foundations and Management",
      "General Studies",
      "Language Education"
    ]
  },
  "College of Science": {
    "School of Pure and Applied Sciences": [
      "Department of Biological Sciences",
      "Department of Chemical Sciences",
      "Department of Computing and Information Science",
      "Department of Mathematical Sciences",
      "Department of Physics"
    ],
    "School of Social and Management Sciences": [
      "Department of Economics",
      "Department of Management Sciences",
      "Department of Media and Performing Studies",
      "Department of Peace and Security Studies",
      "Department of Political Science and International Diplomacy",
      "Department of Spatial and Planning Sciences"
    ]
  },
  "College of Technology": {
    "School of Engineering Technology": [
      "Department of Civil Engineering",
      "Department of Electrical/Electronics Engineering",
      "Department of Mechanical Engineering"
    ],
    "School of Environmental Technology": [
      "Department of Architecture",
      "Department of Building Technology"
    ],
    "School of Vocational and Entrepreneurial Studies": [
      "Department of Entrepreneurial Arts",
      "Department of Entrepreneurial Studies",
      "Department of Tourism and Hospitality Management"
    ],
    "School of Agriculture and Agricultural Technology": [
      "Department of Food Science and Technology"
    ]
  }
};

function inferStaffCategory(profile = {}) {
  const title = String(profile.title || "").trim().toLowerCase();
  return title === "administrative officer" ? "Non Teaching Staff" : "Academic Staff";
}

function normalizeStaffCategory(value, fallback = "Academic Staff") {
  const trimmed = String(value || "").trim();
  return staffCategories.includes(trimmed) ? trimmed : fallback;
}

function normalizePublicVisibility(profile = {}) {
  return Object.fromEntries(
    publicVisibilityFields.map((field) => [
      field,
      Object.prototype.hasOwnProperty.call(profile, field)
        ? truthyCheckbox(profile[field])
        : true
    ])
  );
}

function normalizeOptionList(values) {
  return [...new Set((values || []).map((item) => String(item || "").trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  );
}

function normalizeCustomLinkFields(fields) {
  const fieldMap = new Map();

  [...defaultCustomLinkFields, ...(Array.isArray(fields) ? fields : [])].forEach((field) => {
    const label = String(field && field.label ? field.label : "").trim();
    const id = slugify(field && field.id ? field.id : label);

    if (!label || !id || fieldMap.has(id)) {
      return;
    }

    fieldMap.set(id, { id, label });
  });

  return [...fieldMap.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeCustomLinks(profile = {}, fields = []) {
  const input =
    profile && typeof profile.customLinks === "object" && profile.customLinks
      ? profile.customLinks
      : {};
  const normalized = {};

  Object.entries(input).forEach(([rawId, entry]) => {
    const id = slugify(rawId);

    if (!id) {
      return;
    }

    normalized[id] = {
      value:
        typeof entry === "string"
          ? String(entry).trim()
          : String(entry && entry.value ? entry.value : "").trim(),
      visible:
        typeof entry === "string"
          ? true
          : Object.prototype.hasOwnProperty.call(entry || {}, "visible")
            ? truthyCheckbox(entry.visible)
            : true
    };
  });

  fields.forEach((field) => {
    if (!normalized[field.id]) {
      normalized[field.id] = { value: "", visible: true };
    }
  });

  return normalized;
}

function ensureFile() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(
      dataPath,
      JSON.stringify(
        {
          users: [],
          staffProfiles: [],
          profileOptions: defaultProfileOptions,
          customLinkFields: defaultCustomLinkFields,
          activityLogs: []
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readState() {
  ensureFile();
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);

  parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
  parsed.customLinkFields = normalizeCustomLinkFields(parsed.customLinkFields);
  parsed.staffProfiles = Array.isArray(parsed.staffProfiles)
    ? parsed.staffProfiles.map((profile) => ({
        ...defaultProfileValues,
        ...profile,
        staffCategory: normalizeStaffCategory(
          profile.staffCategory,
          inferStaffCategory(profile)
        ),
        ...normalizePublicVisibility(profile),
        customLinks: normalizeCustomLinks(profile, parsed.customLinkFields),
        researchAreas: Array.isArray(profile.researchAreas) ? profile.researchAreas : [],
        qualifications: Array.isArray(profile.qualifications) ? profile.qualifications : []
      }))
    : [];
  parsed.profileOptions = parsed.profileOptions || {};
  parsed.activityLogs = Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [];

  Object.entries(defaultProfileOptions).forEach(([key, defaults]) => {
    parsed.profileOptions[key] = normalizeOptionList([
      ...defaults,
      ...(Array.isArray(parsed.profileOptions[key]) ? parsed.profileOptions[key] : [])
    ]);
  });

  return parsed;
}

function writeState(state) {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2), "utf8");
}

async function seedAdmin() {
  const state = readState();
  const email = (process.env.ADMIN_EMAIL || "admin@bouesti.edu.ng").toLowerCase();

  if (state.users.some((user) => user.role === "admin")) {
    return;
  }

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@12345", 10);
  state.users.push({
    id: createId("usr"),
    name: "Directory Administrator",
    email,
    role: "admin",
    passwordHash,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  writeState(state);
}

function listStaffProfiles() {
  const state = readState();

  return state.staffProfiles
    .map((profile) => {
      const owner = state.users.find((user) => user.id === profile.userId) || null;
      return { ...profile, owner };
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function listPublishedProfiles() {
  return listStaffProfiles().filter(
    (profile) => profile.isPublished && profile.accountStatus === "active"
  );
}

function listProfileOptions() {
  const state = readState();
  return state.profileOptions;
}

function listStaffCategories() {
  return [...staffCategories];
}

function listAcademicHierarchy() {
  return academicHierarchy;
}

function listCustomLinkFields() {
  const state = readState();
  return state.customLinkFields;
}

function appendActivityLog(entry) {
  const title = String(entry && entry.title ? entry.title : "").trim();

  if (!title) {
    throw new Error("Activity log title is required.");
  }

  const state = readState();
  const activity = {
    id: createId("act"),
    actorRole: String(entry.actorRole || "system").trim() || "system",
    tone: String(entry.tone || "neutral").trim() || "neutral",
    title,
    detail: String(entry.detail || "").trim(),
    subjectId: String(entry.subjectId || "").trim(),
    createdAt: new Date().toISOString()
  };

  state.activityLogs = [activity, ...state.activityLogs].slice(0, maxActivityLogEntries);
  writeState(state);

  return activity;
}

function listActivityLogs(limit) {
  const state = readState();
  const logs = [...state.activityLogs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  if (!Number.isFinite(limit)) {
    return logs;
  }

  return logs.slice(0, Math.max(0, Number(limit)));
}

function findUserByEmail(email) {
  const state = readState();
  return state.users.find((user) => user.email === String(email || "").toLowerCase()) || null;
}

function findUserById(userId) {
  const state = readState();
  return state.users.find((user) => user.id === userId) || null;
}

function findProfileByUserId(userId) {
  return listStaffProfiles().find((profile) => profile.userId === userId) || null;
}

function findProfileById(profileId) {
  return listStaffProfiles().find((profile) => profile.id === profileId) || null;
}

function findPublishedProfileBySlug(slug) {
  return listPublishedProfiles().find((profile) => profile.slug === slug) || null;
}

function deleteStaffAccount(profileId) {
  const state = readState();
  const profileIndex = state.staffProfiles.findIndex((profile) => profile.id === profileId);

  if (profileIndex === -1) {
    throw new Error("Profile not found.");
  }

  const [profile] = state.staffProfiles.splice(profileIndex, 1);
  state.users = state.users.filter((user) => user.id !== profile.userId);
  writeState(state);

  return profile;
}

function uniqueSlug(desired, currentId) {
  const state = readState();
  const base = slugify(desired) || "staff-profile";
  let candidate = base;
  let index = 1;

  while (
    state.staffProfiles.some(
      (profile) => profile.slug === candidate && profile.id !== currentId
    )
  ) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

async function createStaffAccount(input) {
  const state = readState();
  const email = String(input.email || "").trim().toLowerCase();

  if (!email) {
    throw new Error("Email address is required.");
  }

  if (state.users.some((user) => user.email === email)) {
    throw new Error("A user with that email address already exists.");
  }

  const now = new Date().toISOString();
  const userId = createId("usr");
  const profileId = createId("prs");
  const fullName = String(input.fullName || "").trim();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = {
    id: userId,
    name: fullName,
    email,
    role: "staff",
    passwordHash,
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now
  };

  const profile = {
    id: profileId,
    userId,
    fullName,
    ...defaultProfileValues,
    honoraryTitle: String(input.honoraryTitle || "").trim(),
    staffCategory: normalizeStaffCategory(
      input.staffCategory,
      inferStaffCategory({ title: input.title })
    ),
    college: String(input.college || "").trim(),
    title: String(input.title || "").trim(),
    department: String(input.department || "").trim(),
    schoolFaculty: String(input.schoolFaculty || "").trim(),
    email,
    emailAddress: email,
    customLinks: normalizeCustomLinks({}, state.customLinkFields),
    slug: uniqueSlug(fullName, profileId),
    createdAt: now,
    updatedAt: now
  };

  state.users.push(user);
  state.staffProfiles.push(profile);
  writeState(state);

  return { user, profile };
}

async function updateUserPassword(userId, password, mustChangePassword = false) {
  const state = readState();
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.mustChangePassword = mustChangePassword;
  user.updatedAt = new Date().toISOString();
  writeState(state);

  return user;
}

function updateProfile(profileId, updates) {
  const state = readState();
  const profile = state.staffProfiles.find((entry) => entry.id === profileId);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (Object.prototype.hasOwnProperty.call(updates, "staffCategory")) {
    updates.staffCategory = normalizeStaffCategory(
      updates.staffCategory,
      inferStaffCategory({ ...profile, ...updates })
    );
  }

  Object.assign(profile, updates, {
    fullName: updates.fullName || displayName({ ...profile, ...updates }),
    updatedAt: new Date().toISOString()
  });

  if (updates.slug) {
    profile.slug = uniqueSlug(updates.slug, profile.id);
  } else if (updates.fullName || updates.firstName || updates.lastName) {
    profile.slug = uniqueSlug(profile.fullName, profile.id);
  }

  writeState(state);
  return profile;
}

function updateUser(userId, updates) {
  const state = readState();
  const user = state.users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (updates.email) {
    const normalized = String(updates.email).toLowerCase().trim();
    const duplicate = state.users.find(
      (entry) => entry.email === normalized && entry.id !== userId
    );

    if (duplicate) {
      throw new Error("Another account already uses that email address.");
    }

    user.email = normalized;
  }

  if (typeof updates.name === "string") {
    user.name = updates.name.trim();
  }

  if (typeof updates.mustChangePassword === "boolean") {
    user.mustChangePassword = updates.mustChangePassword;
  }

  user.updatedAt = new Date().toISOString();
  writeState(state);
  return user;
}

function toggleProfilePublish(profileId) {
  const profile = findProfileById(profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  return updateProfile(profileId, { isPublished: !profile.isPublished });
}

function toggleProfileStatus(profileId) {
  const profile = findProfileById(profileId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const nextStatus = profile.accountStatus === "active" ? "inactive" : "active";
  return updateProfile(profileId, { accountStatus: nextStatus });
}

function addProfileOption(field, value) {
  const state = readState();

  if (!Object.prototype.hasOwnProperty.call(defaultProfileOptions, field)) {
    throw new Error("Unsupported option field.");
  }

  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error("Option value is required.");
  }

  state.profileOptions[field] = normalizeOptionList([
    ...(state.profileOptions[field] || []),
    trimmed
  ]);
  writeState(state);
  return state.profileOptions;
}

function removeProfileOption(field, value) {
  const state = readState();

  if (!Object.prototype.hasOwnProperty.call(defaultProfileOptions, field)) {
    throw new Error("Unsupported option field.");
  }

  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error("Option value is required.");
  }

  const profileField = optionFieldMap[field];
  const inUse = state.staffProfiles.some((profile) => String(profile[profileField] || "").trim() === trimmed);
  if (inUse) {
    throw new Error("That option is currently in use by a staff profile.");
  }

  state.profileOptions[field] = (state.profileOptions[field] || []).filter(
    (item) => item !== trimmed
  );
  writeState(state);
  return state.profileOptions;
}

function addCustomLinkField(label) {
  const state = readState();
  const trimmedLabel = String(label || "").trim();

  if (!trimmedLabel) {
    throw new Error("Field label is required.");
  }

  const id = slugify(trimmedLabel);

  if (!id) {
    throw new Error("Field label must include letters or numbers.");
  }

  if (state.customLinkFields.some((field) => field.id === id)) {
    throw new Error("A custom academic link field with that label already exists.");
  }

  state.customLinkFields = normalizeCustomLinkFields([
    ...state.customLinkFields,
    { id, label: trimmedLabel }
  ]);
  state.staffProfiles = state.staffProfiles.map((profile) => ({
    ...profile,
    customLinks: normalizeCustomLinks(profile, state.customLinkFields)
  }));
  writeState(state);

  return state.customLinkFields;
}

function removeCustomLinkField(fieldId) {
  const state = readState();
  const normalizedId = slugify(fieldId);

  if (!normalizedId) {
    throw new Error("Field id is required.");
  }

  if (normalizedId === "doi") {
    throw new Error("The DOI field is required and cannot be removed.");
  }

  if (!state.customLinkFields.some((field) => field.id === normalizedId)) {
    throw new Error("Custom academic link field not found.");
  }

  state.customLinkFields = state.customLinkFields.filter((field) => field.id !== normalizedId);
  writeState(state);

  return state.customLinkFields;
}

module.exports = {
  addCustomLinkField,
  addProfileOption,
  appendActivityLog,
  createStaffAccount,
  deleteStaffAccount,
  findProfileById,
  findProfileByUserId,
  findPublishedProfileBySlug,
  findUserByEmail,
  findUserById,
  listAcademicHierarchy,
  listActivityLogs,
  listCustomLinkFields,
  listProfileOptions,
  listPublishedProfiles,
  listStaffCategories,
  listStaffProfiles,
  removeCustomLinkField,
  removeProfileOption,
  seedAdmin,
  toggleProfilePublish,
  toggleProfileStatus,
  updateProfile,
  updateUser,
  updateUserPassword
};
