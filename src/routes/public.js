const express = require("express");
const {
  listAcademicHierarchy,
  listCustomLinkFields,
  findPublishedProfileBySlug,
  listProfileOptions,
  listStaffCategories,
  listPublishedProfiles
} = require("../lib/store");
const { summarizePublishedProfiles } = require("../lib/helpers");

const router = express.Router();
const allowedPerPage = [12, 24, 36, 48];

function sortValues(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function clampPage(value, totalPages) {
  const page = Number.parseInt(value, 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(page, totalPages);
}

function listAllSchools(hierarchy) {
  return Object.values(hierarchy).flatMap((schoolMap) => Object.keys(schoolMap));
}

function listDepartmentsForCollege(college, hierarchy) {
  const schoolMap = hierarchy[college] || {};
  return Object.values(schoolMap).flat();
}

function listDepartmentsForSchool(school, hierarchy, college = "") {
  if (college && hierarchy[college] && hierarchy[college][school]) {
    return hierarchy[college][school];
  }

  return Object.values(hierarchy)
    .map((schoolMap) => schoolMap[school] || [])
    .flat();
}

router.get("/", (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === "admin") {
      return res.redirect("/admin");
    }

    return res.redirect("/dashboard");
  }

  return res.redirect("/login");
});

router.get("/profiles", (req, res) => {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  return res.redirect(`/prs/staff${query}`);
});

router.get("/prs/staff", (req, res) => {
  const staffProfiles = listPublishedProfiles();
  const profileOptions = listProfileOptions();
  const hierarchy = listAcademicHierarchy();
  const structureColleges = sortValues([
    ...Object.keys(hierarchy),
    ...(profileOptions.colleges || [])
  ]);
  const structureDepartments = sortValues([
    ...(profileOptions.departments || []),
    ...Object.values(hierarchy).flatMap((schoolMap) => Object.values(schoolMap).flat())
  ]);

  const filters = {
    q: String(req.query.q || "").trim(),
    staffCategory: String(req.query.staffCategory || "").trim(),
    college: String(req.query.college || "").trim(),
    schoolFaculty: String(req.query.schoolFaculty || "").trim(),
    department: String(req.query.department || "").trim()
  };

  const availableStaffCategories = listStaffCategories();

  if (filters.staffCategory && !availableStaffCategories.includes(filters.staffCategory)) {
    filters.staffCategory = "";
  }

  const allColleges = sortValues([
    ...Object.keys(hierarchy),
    ...(profileOptions.colleges || []),
    ...staffProfiles.map((profile) => profile.college)
  ]);

  if (filters.college && !allColleges.includes(filters.college)) {
    filters.college = "";
  }

  const availableSchools = sortValues(
    filters.college
      ? [
          ...Object.keys(hierarchy[filters.college] || {}),
          ...staffProfiles
            .filter((profile) => profile.college === filters.college)
            .map((profile) => profile.schoolFaculty)
        ]
      : [
          ...listAllSchools(hierarchy),
          ...(profileOptions.schools || []),
          ...staffProfiles.map((profile) => profile.schoolFaculty)
        ]
  );

  if (filters.schoolFaculty && !availableSchools.includes(filters.schoolFaculty)) {
    filters.schoolFaculty = "";
  }

  const availableDepartments = sortValues(
    filters.schoolFaculty
      ? [
          ...listDepartmentsForSchool(filters.schoolFaculty, hierarchy, filters.college),
          ...staffProfiles
            .filter((profile) => {
              if (filters.college && profile.college !== filters.college) {
                return false;
              }

              return profile.schoolFaculty === filters.schoolFaculty;
            })
            .map((profile) => profile.department)
        ]
      : filters.college
        ? [
            ...listDepartmentsForCollege(filters.college, hierarchy),
            ...staffProfiles
              .filter((profile) => profile.college === filters.college)
              .map((profile) => profile.department)
          ]
        : [
            ...(profileOptions.departments || []),
            ...staffProfiles.map((profile) => profile.department)
          ]
  );

  if (filters.department && !availableDepartments.includes(filters.department)) {
    filters.department = "";
  }

  const filterOptions = {
    staffCategories: availableStaffCategories,
    colleges: allColleges,
    schools: availableSchools,
    departments: availableDepartments
  };

  const filteredProfiles = staffProfiles.filter((profile) => {
    const searchText = [
      profile.fullName,
      profile.emailAddress,
      profile.email,
      profile.title,
      profile.staffCategory,
      profile.college,
      profile.schoolFaculty,
      profile.department,
      ...(profile.researchAreas || []),
      ...(profile.qualifications || [])
    ]
      .join(" ")
      .toLowerCase();

    if (filters.q && !searchText.includes(filters.q.toLowerCase())) {
      return false;
    }

    if (filters.staffCategory && profile.staffCategory !== filters.staffCategory) {
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

    return true;
  });
  const directoryStats = {
    ...summarizePublishedProfiles(filteredProfiles),
    totalColleges: structureColleges.length,
    totalDepartments: structureDepartments.length
  };

  const perPage = allowedPerPage.includes(Number(req.query.perPage))
    ? Number(req.query.perPage)
    : 12;
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / perPage));
  const currentPage = clampPage(req.query.page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + perPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) => Math.abs(pageNumber - currentPage) <= 2 || pageNumber === 1 || pageNumber === totalPages
  );

  function buildQuery(overrides = {}) {
    const next = {
      q: filters.q,
      staffCategory: filters.staffCategory,
      college: filters.college,
      schoolFaculty: filters.schoolFaculty,
      department: filters.department,
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

    return `/prs/staff?${params.toString()}`;
  }

  res.render("public/listing", {
    title: "Staff Directory",
    pageClass: "page-listing",
    staffProfiles: paginatedProfiles,
    filterOptions,
    filters,
    perPage,
    allowedPerPage,
    academicHierarchy: hierarchy,
    directoryStats,
    activeFilterCount: Object.values(filters).filter(Boolean).length,
    totalResults: filteredProfiles.length,
    currentPage,
    totalPages,
    pageNumbers,
    buildQuery
  });
});

router.get("/prs/:slug", (req, res) => {
  const profile = findPublishedProfileBySlug(req.params.slug);

  if (!profile) {
    return res.status(404).render("public/not-found", {
      title: "Profile Not Found",
      pageClass: "page-not-found"
    });
  }

  return res.render("public/profile", {
    title: profile.fullName,
    pageClass: "page-profile",
    profile,
    customLinkFields: listCustomLinkFields()
  });
});

module.exports = router;
