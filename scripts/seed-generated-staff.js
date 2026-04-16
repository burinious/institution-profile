const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const dataPath = path.join(__dirname, "..", "data", "db.json");
const loginSheetPath = path.join(__dirname, "..", "data", "generated-staff-logins.csv");
const defaultPassword = "Staff@12345";

const academicUnits = [
  {
    college: "College of Education",
    schoolFaculty: "School of Social Sciences",
    department: "Business Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Social Sciences",
    department: "Counselling Psychology"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Social Sciences",
    department: "Social Sciences Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Science Education",
    department: "Educational Technology"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Science Education",
    department: "Human Kinetics and Health Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Science Education",
    department: "Industrial Technology Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Science Education",
    department: "Science Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Multi-Disciplinary Studies",
    department: "Arts Education"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Multi-Disciplinary Studies",
    department: "Educational Foundations and Management"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Multi-Disciplinary Studies",
    department: "General Studies"
  },
  {
    college: "College of Education",
    schoolFaculty: "School of Multi-Disciplinary Studies",
    department: "Language Education"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Biological Sciences"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Chemical Sciences"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Computing and Information Science"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Mathematical Sciences"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Physics"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Economics"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Management Sciences"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Media and Performing Studies"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Peace and Security Studies"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Political Science and International Diplomacy"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Social and Management Sciences",
    department: "Department of Spatial and Planning Sciences"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Engineering Technology",
    department: "Department of Civil Engineering"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Engineering Technology",
    department: "Department of Electrical/Electronics Engineering"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Engineering Technology",
    department: "Department of Mechanical Engineering"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Environmental Technology",
    department: "Department of Architecture"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Environmental Technology",
    department: "Department of Building Technology"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Vocational and Entrepreneurial Studies",
    department: "Department of Entrepreneurial Arts"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Vocational and Entrepreneurial Studies",
    department: "Department of Entrepreneurial Studies"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Vocational and Entrepreneurial Studies",
    department: "Department of Tourism and Hospitality Management"
  },
  {
    college: "College of Technology",
    schoolFaculty: "School of Agriculture and Agricultural Technology",
    department: "Department of Food Science and Technology"
  },
  {
    college: "College of Science",
    schoolFaculty: "School of Pure and Applied Sciences",
    department: "Department of Computing and Information Science"
  }
];

const academicPeople = [
  { honoraryTitle: "Dr.", firstName: "Adebisi", lastName: "Akinola", title: "Senior Lecturer" },
  { honoraryTitle: "Prof.", firstName: "Bose", lastName: "Adediran", title: "Professor" },
  { honoraryTitle: "Dr.", firstName: "Chinedu", lastName: "Okafor", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Damilola", lastName: "Fasina", title: "Associate Professor" },
  { honoraryTitle: "Dr.", firstName: "Emeka", lastName: "Nwosu", title: "Lecturer II" },
  { honoraryTitle: "Mrs.", firstName: "Folake", lastName: "Ige", title: "Assistant Lecturer" },
  { honoraryTitle: "Engr.", firstName: "Ganiyu", lastName: "Bello", title: "Senior Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Hauwa", lastName: "Sani", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Ifeoluwa", lastName: "Ajibola", title: "Associate Professor" },
  { honoraryTitle: "Mrs.", firstName: "Jumoke", lastName: "Adebanjo", title: "Lecturer II" },
  { honoraryTitle: "Dr.", firstName: "Kehinde", lastName: "Olusanya", title: "Senior Lecturer" },
  { honoraryTitle: "Mr.", firstName: "Lekan", lastName: "Arogundade", title: "Assistant Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Mojisola", lastName: "Akinsiwaju", title: "Senior Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Nnamdi", lastName: "Eze", title: "Associate Professor" },
  { honoraryTitle: "Dr.", firstName: "Omolara", lastName: "Sodeinde", title: "Lecturer I" },
  { honoraryTitle: "Prof.", firstName: "Peter", lastName: "Olatunji", title: "Professor" },
  { honoraryTitle: "Dr.", firstName: "Ruth", lastName: "Akinyemi", title: "Lecturer II" },
  { honoraryTitle: "Dr.", firstName: "Sade", lastName: "Balogun", title: "Senior Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Tosin", lastName: "Alabi", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Uche", lastName: "Maduka", title: "Associate Professor" },
  { honoraryTitle: "Dr.", firstName: "Victoria", lastName: "Alonge", title: "Lecturer II" },
  { honoraryTitle: "Dr.", firstName: "Wale", lastName: "Fadipe", title: "Senior Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Yinka", lastName: "Owolabi", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Zainab", lastName: "Danjuma", title: "Associate Professor" },
  { honoraryTitle: "Dr.", firstName: "Adetola", lastName: "Omotoso", title: "Senior Lecturer" },
  { honoraryTitle: "Mrs.", firstName: "Bosede", lastName: "Falana", title: "Assistant Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Chika", lastName: "Umeh", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Dolapo", lastName: "Adebusoye", title: "Senior Lecturer" },
  { honoraryTitle: "Dr.", firstName: "Eniola", lastName: "Ibitoye", title: "Lecturer II" },
  { honoraryTitle: "Dr.", firstName: "Funmilayo", lastName: "Adesina", title: "Associate Professor" },
  { honoraryTitle: "Engr.", firstName: "Kabiru", lastName: "Sule", title: "Lecturer I" },
  { honoraryTitle: "Dr.", firstName: "Yetunde", lastName: "Ogunleye", title: "Senior Lecturer" }
];

const nonTeachingUnits = [
  {
    title: "Senior Administrative Officer",
    department: "Registry Unit",
    officeAddress: "Registry Unit, Senate Building, BOUESTI Main Campus"
  },
  {
    title: "Account Officer",
    department: "Bursary Department",
    officeAddress: "Bursary Department, Administrative Block, BOUESTI Main Campus"
  },
  {
    title: "Systems Analyst",
    department: "ICT Directorate",
    officeAddress: "ICT Directorate, Digital Services Hub, BOUESTI Main Campus"
  },
  {
    title: "Senior Library Officer",
    department: "University Library",
    officeAddress: "University Library, Knowledge Resource Centre, BOUESTI Main Campus"
  },
  {
    title: "Works Superintendent",
    department: "Works and Maintenance Unit",
    officeAddress: "Works Unit, Physical Planning Yard, BOUESTI Main Campus"
  },
  {
    title: "Student Affairs Officer",
    department: "Student Affairs Division",
    officeAddress: "Student Affairs Division, Student Support Centre, BOUESTI Main Campus"
  },
  {
    title: "Procurement Officer",
    department: "Procurement Unit",
    officeAddress: "Procurement Unit, Administrative Block, BOUESTI Main Campus"
  },
  {
    title: "Internal Auditor",
    department: "Internal Audit Unit",
    officeAddress: "Internal Audit Unit, Council Complex, BOUESTI Main Campus"
  },
  {
    title: "Security Coordinator",
    department: "Security Services",
    officeAddress: "Security Services, Gate Control Office, BOUESTI Main Campus"
  },
  {
    title: "Health Information Officer",
    department: "Medical Centre",
    officeAddress: "Medical Centre, BOUESTI Health Services Complex"
  },
  {
    title: "Admissions Officer",
    department: "Admissions Office",
    officeAddress: "Admissions Office, Academic Affairs Block, BOUESTI Main Campus"
  },
  {
    title: "Executive Officer",
    department: "Examinations and Records",
    officeAddress: "Examinations and Records Unit, Senate Building, BOUESTI Main Campus"
  },
  {
    title: "Administrative Officer",
    department: "Human Resources Division",
    officeAddress: "Human Resources Division, Administrative Block, BOUESTI Main Campus"
  },
  {
    title: "Planning Officer",
    department: "Academic Planning Unit",
    officeAddress: "Academic Planning Unit, Council Complex, BOUESTI Main Campus"
  },
  {
    title: "Public Relations Officer",
    department: "Alumni and Public Relations Office",
    officeAddress: "Alumni and Public Relations Office, Visitor Services Wing"
  },
  {
    title: "Administrative Officer",
    department: "SIWES and Industrial Liaison Unit",
    officeAddress: "SIWES Unit, Career Development Centre, BOUESTI Main Campus"
  },
  {
    title: "Transport Officer",
    department: "Transport Unit",
    officeAddress: "Transport Unit, Services Yard, BOUESTI Main Campus"
  },
  {
    title: "Protocol Officer",
    department: "Protocol and Ceremonials Office",
    officeAddress: "Protocol Office, Vice Chancellor's Complex, BOUESTI Main Campus"
  }
];

const nonTeachingPeople = [
  { honoraryTitle: "Mrs.", firstName: "Abiola", lastName: "Adegoke" },
  { honoraryTitle: "Mr.", firstName: "Bamidele", lastName: "Arowolo" },
  { honoraryTitle: "Mrs.", firstName: "Chioma", lastName: "Ezeobi" },
  { honoraryTitle: "Mr.", firstName: "David", lastName: "Onifade" },
  { honoraryTitle: "Mrs.", firstName: "Esther", lastName: "Kolawole" },
  { honoraryTitle: "Mr.", firstName: "Femi", lastName: "Ogunbiyi" },
  { honoraryTitle: "Mrs.", firstName: "Grace", lastName: "Akinpelu" },
  { honoraryTitle: "Mr.", firstName: "Haruna", lastName: "Musa" },
  { honoraryTitle: "Mrs.", firstName: "Iyabo", lastName: "Adeoye" },
  { honoraryTitle: "Mr.", firstName: "James", lastName: "Udo" },
  { honoraryTitle: "Mrs.", firstName: "Kemi", lastName: "Ajetunmobi" },
  { honoraryTitle: "Mr.", firstName: "Lanre", lastName: "Akinrinade" },
  { honoraryTitle: "Mrs.", firstName: "Modupe", lastName: "Ajayi" },
  { honoraryTitle: "Mr.", firstName: "Nura", lastName: "Suleiman" },
  { honoraryTitle: "Mrs.", firstName: "Oluwakemi", lastName: "Bankole" },
  { honoraryTitle: "Mr.", firstName: "Paul", lastName: "Edet" },
  { honoraryTitle: "Mrs.", firstName: "Rasheedat", lastName: "Olawale" },
  { honoraryTitle: "Mr.", firstName: "Segun", lastName: "Oladipo" }
];

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildEmail(firstName, lastName) {
  return `${slugify(firstName)}.${slugify(lastName)}@bouesti.edu.ng`;
}

function uniqueSlug(fullName, profiles, currentId) {
  const base = slugify(fullName) || "staff-profile";
  let candidate = base;
  let counter = 1;

  while (profiles.some((profile) => profile.slug === candidate && profile.id !== currentId)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

function mergeUnique(baseValues, additions) {
  return [...new Set([...(baseValues || []), ...(additions || [])].filter(Boolean))].sort((left, right) =>
    String(left).localeCompare(String(right))
  );
}

function academicTheme(department) {
  const value = String(department || "").toLowerCase();

  if (value.includes("business")) {
    return {
      focus: "business teacher education, entrepreneurship, and workplace innovation",
      researchAreas: [
        "Business Education",
        "Entrepreneurship Education",
        "Digital Pedagogy",
        "Curriculum Innovation",
        "Workplace Skills Development"
      ],
      qualifications: [
        "B.Ed. Business Education, Tai Solarin University of Education",
        "M.Ed. Business Education, University of Benin",
        "Ph.D. Vocational Education, University of Nigeria"
      ]
    };
  }

  if (value.includes("counselling")) {
    return {
      focus: "student counselling systems, psychosocial support, and inclusive learner development",
      researchAreas: [
        "Counselling Psychology",
        "Student Support Services",
        "Behavioural Intervention",
        "Inclusive Education",
        "Mental Health Advocacy"
      ],
      qualifications: [
        "B.Ed. Guidance and Counselling, University of Ilorin",
        "M.Ed. Counselling Psychology, University of Lagos",
        "Ph.D. Educational Psychology, Ekiti State University"
      ]
    };
  }

  if (value.includes("social sciences education")) {
    return {
      focus: "social science pedagogy, civic learning, and classroom assessment design",
      researchAreas: [
        "Social Sciences Education",
        "Civic Education",
        "Assessment Design",
        "Teacher Development",
        "Learning Analytics"
      ],
      qualifications: [
        "B.Ed. Social Studies Education, University of Ibadan",
        "M.Ed. Curriculum Studies, Obafemi Awolowo University",
        "Ph.D. Teacher Education, Bamidele Olumilua University"
      ]
    };
  }

  if (value.includes("educational technology")) {
    return {
      focus: "technology-enabled teaching, instructional design, and digital learning systems",
      researchAreas: [
        "Educational Technology",
        "Instructional Design",
        "Learning Management Systems",
        "E-Learning Adoption",
        "Digital Assessment"
      ],
      qualifications: [
        "B.Sc. Educational Technology, University of Ilorin",
        "M.Sc. Educational Media, National Open University of Nigeria",
        "Ph.D. Educational Technology, University of Ibadan"
      ]
    };
  }

  if (value.includes("human kinetics")) {
    return {
      focus: "wellness education, sport development, and school health promotion",
      researchAreas: [
        "Human Kinetics",
        "School Health Education",
        "Sport Psychology",
        "Community Wellness",
        "Exercise Physiology"
      ],
      qualifications: [
        "B.Sc. Human Kinetics, University of Lagos",
        "M.Sc. Exercise and Sport Science, University of Ibadan",
        "Ph.D. Health Education, University of Ilorin"
      ]
    };
  }

  if (value.includes("industrial technology")) {
    return {
      focus: "technical teacher preparation, workshop practice, and skills-for-industry training",
      researchAreas: [
        "Industrial Technology Education",
        "Technical Drawing",
        "Workshop Practice",
        "TVET Curriculum",
        "Manufacturing Skills Development"
      ],
      qualifications: [
        "B.Tech. Industrial Technical Education, Federal University of Technology Akure",
        "M.Tech. Technical Education, University of Benin",
        "Ph.D. Vocational and Technical Education, University of Nigeria"
      ]
    };
  }

  if (value.includes("science education")) {
    return {
      focus: "science teaching methods, practical learning, and evidence-based classroom improvement",
      researchAreas: [
        "Science Education",
        "STEM Pedagogy",
        "Practical Laboratory Teaching",
        "Teacher Professional Development",
        "Assessment for Learning"
      ],
      qualifications: [
        "B.Ed. Integrated Science, University of Nigeria",
        "M.Ed. Science Education, University of Ibadan",
        "Ph.D. Science Education, Ekiti State University"
      ]
    };
  }

  if (value.includes("arts education")) {
    return {
      focus: "creative pedagogy, arts integration, and culturally responsive learning design",
      researchAreas: [
        "Arts Education",
        "Creative Pedagogy",
        "Curriculum Integration",
        "Performance Studies",
        "Cultural Literacy"
      ],
      qualifications: [
        "B.A. Education, Adeyemi Federal University of Education",
        "M.A. Arts Education, University of Lagos",
        "Ph.D. Curriculum and Instruction, University of Ibadan"
      ]
    };
  }

  if (value.includes("foundations") || value.includes("management")) {
    return {
      focus: "education leadership, policy implementation, and institutional quality assurance",
      researchAreas: [
        "Educational Management",
        "Policy Implementation",
        "School Leadership",
        "Quality Assurance",
        "Higher Education Administration"
      ],
      qualifications: [
        "B.Ed. Educational Management, Ekiti State University",
        "M.Ed. Administration and Planning, University of Lagos",
        "Ph.D. Educational Management, University of Ibadan"
      ]
    };
  }

  if (value.includes("general studies")) {
    return {
      focus: "general education, communication skills, and interdisciplinary student development",
      researchAreas: [
        "General Studies",
        "Communication Skills",
        "Interdisciplinary Learning",
        "Study Skills Development",
        "Civic Literacy"
      ],
      qualifications: [
        "B.A. English, University of Ilorin",
        "M.A. Communication Studies, University of Lagos",
        "Ph.D. General Education, University of Ibadan"
      ]
    };
  }

  if (value.includes("language")) {
    return {
      focus: "language instruction, literacy development, and multilingual learning outcomes",
      researchAreas: [
        "Language Education",
        "Applied Linguistics",
        "Literacy Development",
        "Language Assessment",
        "Teacher Training"
      ],
      qualifications: [
        "B.A. English Education, University of Ado-Ekiti",
        "M.A. Applied Linguistics, University of Lagos",
        "Ph.D. Language Education, University of Ibadan"
      ]
    };
  }

  if (value.includes("biological")) {
    return {
      focus: "applied biosciences, environmental monitoring, and laboratory-based teaching",
      researchAreas: [
        "Applied Biology",
        "Environmental Biology",
        "Laboratory Methods",
        "Biodiversity Studies",
        "Public Health Microbiology"
      ],
      qualifications: [
        "B.Sc. Biological Sciences, Federal University Oye-Ekiti",
        "M.Sc. Microbiology, University of Ibadan",
        "Ph.D. Applied Biology, University of Lagos"
      ]
    };
  }

  if (value.includes("chemical")) {
    return {
      focus: "analytical chemistry, materials applications, and practical science training",
      researchAreas: [
        "Analytical Chemistry",
        "Environmental Chemistry",
        "Materials Chemistry",
        "Chemical Education",
        "Quality Control"
      ],
      qualifications: [
        "B.Sc. Chemistry, Ekiti State University",
        "M.Sc. Analytical Chemistry, University of Ibadan",
        "Ph.D. Industrial Chemistry, University of Lagos"
      ]
    };
  }

  if (value.includes("computing")) {
    return {
      focus: "software systems, data-driven decision-making, and digital transformation in education",
      researchAreas: [
        "Software Engineering",
        "Artificial Intelligence",
        "Database Systems",
        "Cybersecurity",
        "Digital Transformation"
      ],
      qualifications: [
        "B.Sc. Computer Science, Federal University of Technology Akure",
        "M.Sc. Computer Science, University of Ibadan",
        "Ph.D. Computer Science, Ekiti State University"
      ]
    };
  }

  if (value.includes("mathematical")) {
    return {
      focus: "mathematical modelling, quantitative reasoning, and applied statistics education",
      researchAreas: [
        "Mathematical Modelling",
        "Applied Statistics",
        "Numerical Analysis",
        "Operations Research",
        "Quantitative Education"
      ],
      qualifications: [
        "B.Sc. Mathematics, University of Ilorin",
        "M.Sc. Applied Mathematics, University of Lagos",
        "Ph.D. Mathematics, University of Ibadan"
      ]
    };
  }

  if (value.includes("physics")) {
    return {
      focus: "applied physics, instrumentation, and science laboratory innovation",
      researchAreas: [
        "Applied Physics",
        "Instrumentation",
        "Renewable Energy",
        "Material Science",
        "Physics Education"
      ],
      qualifications: [
        "B.Sc. Physics, University of Ilorin",
        "M.Sc. Applied Physics, University of Lagos",
        "Ph.D. Physics, University of Ibadan"
      ]
    };
  }

  if (value.includes("economics")) {
    return {
      focus: "development policy, public finance, and labour market studies",
      researchAreas: [
        "Development Economics",
        "Public Finance",
        "Labour Economics",
        "Economic Policy",
        "Regional Development"
      ],
      qualifications: [
        "B.Sc. Economics, University of Ilorin",
        "M.Sc. Economics, University of Ibadan",
        "Ph.D. Economics, Obafemi Awolowo University"
      ]
    };
  }

  if (value.includes("management")) {
    return {
      focus: "management systems, organizational behaviour, and entrepreneurship development",
      researchAreas: [
        "Management Studies",
        "Organizational Behaviour",
        "Entrepreneurship",
        "Strategic Planning",
        "Leadership Development"
      ],
      qualifications: [
        "B.Sc. Business Administration, Ekiti State University",
        "MBA, University of Lagos",
        "Ph.D. Management, Babcock University"
      ]
    };
  }

  if (value.includes("media")) {
    return {
      focus: "creative production, media literacy, and communication for social change",
      researchAreas: [
        "Media Studies",
        "Performance Studies",
        "Broadcast Communication",
        "Media Literacy",
        "Creative Production"
      ],
      qualifications: [
        "B.A. Theatre Arts, University of Lagos",
        "M.A. Media and Communication, Pan-Atlantic University",
        "Ph.D. Performance Studies, University of Ibadan"
      ]
    };
  }

  if (value.includes("peace") || value.includes("security")) {
    return {
      focus: "peacebuilding, security governance, and conflict-sensitive community engagement",
      researchAreas: [
        "Peace Studies",
        "Security Governance",
        "Conflict Resolution",
        "Community Resilience",
        "Strategic Studies"
      ],
      qualifications: [
        "B.Sc. Political Science, University of Lagos",
        "M.Sc. Peace and Conflict Studies, National Open University of Nigeria",
        "Ph.D. Security Studies, University of Ibadan"
      ]
    };
  }

  if (value.includes("political")) {
    return {
      focus: "public policy, diplomacy, and democratic governance in emerging institutions",
      researchAreas: [
        "Public Policy",
        "International Relations",
        "Democratic Governance",
        "Political Communication",
        "Diplomatic Studies"
      ],
      qualifications: [
        "B.Sc. Political Science, University of Benin",
        "M.Sc. International Relations, Covenant University",
        "Ph.D. Political Science, University of Ibadan"
      ]
    };
  }

  if (value.includes("spatial") || value.includes("planning")) {
    return {
      focus: "spatial analysis, urban systems, and sustainable planning practice",
      researchAreas: [
        "Urban Planning",
        "Spatial Analysis",
        "Regional Development",
        "GIS Applications",
        "Sustainable Communities"
      ],
      qualifications: [
        "B.Sc. Urban and Regional Planning, Federal University of Technology Akure",
        "M.Sc. Urban Planning, University of Lagos",
        "Ph.D. Spatial Planning, University of Ibadan"
      ]
    };
  }

  if (value.includes("civil")) {
    return {
      focus: "infrastructure design, construction materials, and resilient public works",
      researchAreas: [
        "Structural Engineering",
        "Transportation Systems",
        "Construction Materials",
        "Water Resources",
        "Infrastructure Management"
      ],
      qualifications: [
        "B.Eng. Civil Engineering, Federal University of Technology Akure",
        "M.Eng. Structural Engineering, University of Lagos",
        "Ph.D. Civil Engineering, University of Ibadan"
      ]
    };
  }

  if (value.includes("electrical")) {
    return {
      focus: "power systems, embedded electronics, and smart energy applications",
      researchAreas: [
        "Power Systems",
        "Embedded Systems",
        "Control Engineering",
        "Renewable Energy",
        "Electronics Design"
      ],
      qualifications: [
        "B.Eng. Electrical Engineering, University of Ilorin",
        "M.Eng. Electrical/Electronics Engineering, University of Lagos",
        "Ph.D. Power Engineering, Federal University of Technology Akure"
      ]
    };
  }

  if (value.includes("mechanical")) {
    return {
      focus: "manufacturing systems, thermal processes, and engineering design optimization",
      researchAreas: [
        "Thermofluids",
        "Manufacturing Systems",
        "Machine Design",
        "Energy Engineering",
        "Maintenance Systems"
      ],
      qualifications: [
        "B.Eng. Mechanical Engineering, University of Ilorin",
        "M.Eng. Mechanical Engineering, University of Lagos",
        "Ph.D. Mechanical Engineering, Federal University of Technology Akure"
      ]
    };
  }

  if (value.includes("architecture")) {
    return {
      focus: "built environment design, sustainable architecture, and studio-based learning",
      researchAreas: [
        "Architectural Design",
        "Sustainable Buildings",
        "Housing Studies",
        "Design Studio Practice",
        "Environmental Behaviour"
      ],
      qualifications: [
        "B.Sc. Architecture, Covenant University",
        "M.Sc. Architecture, University of Lagos",
        "Ph.D. Architecture, Federal University of Technology Akure"
      ]
    };
  }

  if (value.includes("building")) {
    return {
      focus: "construction technology, project delivery, and building performance improvement",
      researchAreas: [
        "Building Technology",
        "Construction Management",
        "Project Delivery",
        "Materials Performance",
        "Site Safety"
      ],
      qualifications: [
        "B.Tech. Building Technology, Federal University of Technology Minna",
        "M.Tech. Construction Management, Federal University of Technology Akure",
        "Ph.D. Building, University of Lagos"
      ]
    };
  }

  if (value.includes("entrepreneurial arts")) {
    return {
      focus: "creative enterprise, art-based innovation, and vocational pathways for graduates",
      researchAreas: [
        "Creative Enterprise",
        "Art and Design Practice",
        "Vocational Training",
        "Cultural Entrepreneurship",
        "Design Thinking"
      ],
      qualifications: [
        "B.A. Fine and Applied Arts, Obafemi Awolowo University",
        "M.A. Creative Enterprise, University of Lagos",
        "Ph.D. Entrepreneurship Education, University of Benin"
      ]
    };
  }

  if (value.includes("entrepreneurial studies")) {
    return {
      focus: "enterprise development, start-up incubation, and practice-oriented student innovation",
      researchAreas: [
        "Entrepreneurship Education",
        "Innovation Management",
        "Business Incubation",
        "Small Enterprise Development",
        "Leadership Skills"
      ],
      qualifications: [
        "B.Sc. Entrepreneurship, University of Ilorin",
        "M.Sc. Entrepreneurship, Covenant University",
        "Ph.D. Management, Babcock University"
      ]
    };
  }

  if (value.includes("tourism")) {
    return {
      focus: "hospitality operations, destination management, and service quality improvement",
      researchAreas: [
        "Hospitality Management",
        "Tourism Planning",
        "Service Quality",
        "Destination Branding",
        "Event Operations"
      ],
      qualifications: [
        "B.Sc. Hospitality and Tourism, Redeemer's University",
        "M.Sc. Tourism Studies, University of Lagos",
        "Ph.D. Hospitality Management, Covenant University"
      ]
    };
  }

  if (value.includes("food")) {
    return {
      focus: "food quality systems, processing innovation, and applied product development",
      researchAreas: [
        "Food Processing",
        "Food Safety",
        "Post-Harvest Technology",
        "Product Development",
        "Quality Assurance"
      ],
      qualifications: [
        "B.Tech. Food Science and Technology, Federal University of Technology Akure",
        "M.Tech. Food Processing, Ladoke Akintola University of Technology",
        "Ph.D. Food Science, University of Ibadan"
      ]
    };
  }

  return {
    focus: "teaching, research, and student-centred academic development",
    researchAreas: [
      "Teaching Practice",
      "Curriculum Development",
      "Applied Research",
      "Student Learning",
      "Institutional Development"
    ],
    qualifications: [
      "B.Sc. or B.Ed., recognized Nigerian university",
      "M.Sc. or M.Ed., recognized Nigerian university",
      "Ph.D., recognized Nigerian university"
    ]
  };
}

function nonTeachingTheme(unit) {
  const value = String(unit || "").toLowerCase();

  if (value.includes("registry")) {
    return {
      focus: "records administration, staff correspondence, and institutional documentation workflow",
      serviceAreas: [
        "Records Management",
        "Document Control",
        "Senate Correspondence",
        "Office Coordination",
        "Service Delivery"
      ],
      qualifications: [
        "B.Sc. Public Administration, Ekiti State University",
        "M.Sc. Public Administration, Bamidele Olumilua University",
        "Certificate in Records and Information Management"
      ]
    };
  }

  if (value.includes("bursary")) {
    return {
      focus: "financial operations, budget support, and transparent transaction processing",
      serviceAreas: [
        "Budget Administration",
        "Financial Reporting",
        "Payroll Support",
        "Payment Processing",
        "Internal Controls"
      ],
      qualifications: [
        "B.Sc. Accounting, Ekiti State University",
        "M.Sc. Finance, University of Lagos",
        "ICAN Professional Stage Certificate"
      ]
    };
  }

  if (value.includes("ict")) {
    return {
      focus: "digital service support, systems administration, and campus technology operations",
      serviceAreas: [
        "Systems Administration",
        "User Support",
        "Network Coordination",
        "IT Service Delivery",
        "Platform Monitoring"
      ],
      qualifications: [
        "B.Sc. Computer Science, Federal University Oye-Ekiti",
        "M.Sc. Information Technology, University of Lagos",
        "Professional Certificate in Network Administration"
      ]
    };
  }

  if (value.includes("library")) {
    return {
      focus: "knowledge services, cataloguing workflow, and user access to academic resources",
      serviceAreas: [
        "Library Services",
        "Cataloguing",
        "Research Support",
        "Reference Services",
        "Digital Archives"
      ],
      qualifications: [
        "B.LIS. Library and Information Science, University of Ibadan",
        "M.LIS. Library Studies, University of Nigeria",
        "Certificate in Digital Archiving"
      ]
    };
  }

  if (value.includes("works")) {
    return {
      focus: "facility operations, maintenance planning, and physical infrastructure support",
      serviceAreas: [
        "Facility Maintenance",
        "Asset Monitoring",
        "Project Coordination",
        "Safety Compliance",
        "Operational Response"
      ],
      qualifications: [
        "HND Building Technology, Federal Polytechnic Ado-Ekiti",
        "B.Tech. Project Management, Bells University",
        "Certificate in Health and Safety"
      ]
    };
  }

  if (value.includes("student affairs")) {
    return {
      focus: "student welfare, support coordination, and co-curricular service delivery",
      serviceAreas: [
        "Student Support",
        "Welfare Coordination",
        "Campus Life Programming",
        "Advisory Services",
        "Student Case Management"
      ],
      qualifications: [
        "B.Sc. Sociology, University of Ilorin",
        "M.Sc. Student Personnel Administration, University of Lagos",
        "Certificate in Guidance Support Services"
      ]
    };
  }

  if (value.includes("procurement")) {
    return {
      focus: "procurement planning, vendor documentation, and compliance with due process",
      serviceAreas: [
        "Procurement Planning",
        "Vendor Management",
        "Compliance Support",
        "Tender Documentation",
        "Inventory Liaison"
      ],
      qualifications: [
        "B.Sc. Purchasing and Supply, Lagos State University",
        "MBA, National Open University of Nigeria",
        "Chartered Institute of Procurement Certification"
      ]
    };
  }

  if (value.includes("audit")) {
    return {
      focus: "risk review, control monitoring, and accountability in university operations",
      serviceAreas: [
        "Internal Controls",
        "Risk Review",
        "Compliance Monitoring",
        "Audit Documentation",
        "Process Improvement"
      ],
      qualifications: [
        "B.Sc. Accounting, University of Benin",
        "M.Sc. Accounting, University of Lagos",
        "Associate Chartered Accountant"
      ]
    };
  }

  if (value.includes("security")) {
    return {
      focus: "campus safety coordination, incident response, and access control support",
      serviceAreas: [
        "Campus Security",
        "Incident Response",
        "Access Control",
        "Safety Coordination",
        "Operations Reporting"
      ],
      qualifications: [
        "B.Sc. Criminology and Security Studies, National Open University of Nigeria",
        "M.Sc. Security and Strategic Studies, Nasarawa State University",
        "Certificate in Safety Administration"
      ]
    };
  }

  if (value.includes("medical")) {
    return {
      focus: "health records coordination, patient information workflow, and front-desk care support",
      serviceAreas: [
        "Health Records",
        "Patient Scheduling",
        "Clinical Support",
        "Data Confidentiality",
        "Service Coordination"
      ],
      qualifications: [
        "B.Sc. Health Information Management, University of Calabar",
        "M.Sc. Public Health, Babcock University",
        "Certificate in Medical Records Administration"
      ]
    };
  }

  if (value.includes("admissions")) {
    return {
      focus: "application workflow management, admissions communication, and records integrity",
      serviceAreas: [
        "Admissions Processing",
        "Applicant Communication",
        "Records Verification",
        "Data Validation",
        "Service Support"
      ],
      qualifications: [
        "B.Sc. Mass Communication, Ekiti State University",
        "M.Sc. Public Administration, National Open University of Nigeria",
        "Certificate in Customer Service Management"
      ]
    };
  }

  if (value.includes("examinations")) {
    return {
      focus: "results processing, records support, and academic documentation workflow",
      serviceAreas: [
        "Examinations Support",
        "Results Processing",
        "Records Coordination",
        "Data Accuracy",
        "Academic Documentation"
      ],
      qualifications: [
        "B.Sc. Office Technology and Management, Rufus Giwa Polytechnic",
        "M.Sc. Information Management, University of Ibadan",
        "Professional Diploma in Office Administration"
      ]
    };
  }

  if (value.includes("human resources")) {
    return {
      focus: "staff documentation, onboarding workflow, and personnel support services",
      serviceAreas: [
        "Personnel Records",
        "Onboarding Support",
        "Leave Administration",
        "Staff Communication",
        "HR Operations"
      ],
      qualifications: [
        "B.Sc. Business Administration, Ekiti State University",
        "M.Sc. Human Resource Management, University of Lagos",
        "Chartered Institute of Personnel Management Certification"
      ]
    };
  }

  if (value.includes("planning")) {
    return {
      focus: "institutional data support, reporting workflow, and planning coordination",
      serviceAreas: [
        "Institutional Planning",
        "Data Reporting",
        "Performance Tracking",
        "Strategic Coordination",
        "Quality Review"
      ],
      qualifications: [
        "B.Sc. Economics, University of Ado-Ekiti",
        "M.Sc. Development Studies, University of Ibadan",
        "Certificate in Monitoring and Evaluation"
      ]
    };
  }

  if (value.includes("public relations") || value.includes("alumni")) {
    return {
      focus: "stakeholder communication, alumni engagement, and brand support services",
      serviceAreas: [
        "Public Communication",
        "Alumni Relations",
        "Stakeholder Engagement",
        "Event Support",
        "Media Liaison"
      ],
      qualifications: [
        "B.Sc. Mass Communication, Bowen University",
        "M.Sc. Communication and Media Studies, University of Lagos",
        "Professional Diploma in Public Relations"
      ]
    };
  }

  if (value.includes("siwes")) {
    return {
      focus: "industrial attachment coordination, employer liaison, and placement support",
      serviceAreas: [
        "Industrial Liaison",
        "Placement Coordination",
        "Student Tracking",
        "Employer Engagement",
        "Career Services Support"
      ],
      qualifications: [
        "B.Sc. Sociology, University of Ilorin",
        "M.Sc. Industrial Relations, Lagos State University",
        "Certificate in Career Development Services"
      ]
    };
  }

  if (value.includes("transport")) {
    return {
      focus: "transport scheduling, fleet coordination, and service logistics support",
      serviceAreas: [
        "Fleet Coordination",
        "Transport Scheduling",
        "Logistics Support",
        "Asset Tracking",
        "Operations Reporting"
      ],
      qualifications: [
        "HND Transport Management, Federal Polytechnic Offa",
        "B.Sc. Logistics and Supply Chain Management, Caleb University",
        "Certificate in Fleet Operations"
      ]
    };
  }

  if (value.includes("protocol")) {
    return {
      focus: "official engagements, event protocol, and executive support coordination",
      serviceAreas: [
        "Protocol Services",
        "Executive Support",
        "Ceremonial Planning",
        "Visitor Coordination",
        "Event Operations"
      ],
      qualifications: [
        "B.Sc. Public Administration, University of Abuja",
        "M.Sc. International Relations, Covenant University",
        "Certificate in Protocol and Event Management"
      ]
    };
  }

  return {
    focus: "administrative support, service coordination, and institutional operations",
    serviceAreas: [
      "Office Coordination",
      "Service Delivery",
      "Documentation",
      "Process Support",
      "Institutional Operations"
    ],
    qualifications: [
      "Relevant first degree from a recognized institution",
      "Relevant master's qualification",
      "Professional certificate in a related administrative field"
    ]
  };
}

function buildAcademicProfile(person, unit, index, profiles) {
  const theme = academicTheme(unit.department);
  const fullName = `${person.honoraryTitle} ${person.firstName} ${person.lastName}`;
  const email = buildEmail(person.firstName, person.lastName);
  const profileId = createId("prs");
  const userId = createId("usr");
  const now = new Date(Date.UTC(2026, 3, 10, 8 + (index % 6), (index * 7) % 60, 0)).toISOString();

  return {
    email,
    password: defaultPassword,
    user: {
      id: userId,
      name: fullName,
      email,
      role: "staff",
      passwordHash: "",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now
    },
    profile: {
      id: profileId,
      userId,
      firstName: person.firstName,
      lastName: person.lastName,
      fullName,
      honoraryTitle: person.honoraryTitle,
      staffCategory: "Academic Staff",
      college: unit.college,
      title: person.title,
      department: unit.department,
      schoolFaculty: unit.schoolFaculty,
      email,
      phone: `+234 80${String(31000000 + index * 173).padStart(8, "0").slice(-8)}`,
      officeAddress: `Office ${210 + index}, ${unit.department}, ${unit.schoolFaculty}, BOUESTI Main Campus`,
      bio: `${fullName} is a ${person.title} in the ${unit.department} at BOUESTI. ${person.firstName} contributes to teaching, mentoring, and curriculum development with emphasis on ${theme.focus}. The profile reflects a blend of shared institutional structure and discipline-specific expertise across the staff directory.`,
      researchAreas: theme.researchAreas,
      qualifications: theme.qualifications,
      scopusUrl: `https://www.scopus.com/authid/detail.uri?authorId=57${String(200000000 + index * 137).slice(-9)}`,
      orcidUrl: `https://orcid.org/0000-0002-${String(4100 + index).padStart(4, "0")}-${String(5200 + index * 3).padStart(4, "0")}`,
      googleScholarUrl: `https://scholar.google.com/citations?user=${slugify(person.firstName + person.lastName).slice(0, 12)}${index}`,
      researchGateUrl: `https://www.researchgate.net/profile/${person.firstName}-${person.lastName}`,
      openScienceUrl: `https://osf.io/${slugify(person.firstName + person.lastName).slice(0, 5)}${index}`,
      linkedinUrl: `https://www.linkedin.com/in/${slugify(`${person.firstName}-${person.lastName}`)}`,
      emailAddress: email,
      cvUrl: `https://drive.google.com/file/d/${slugify(person.firstName + person.lastName).slice(0, 12)}AcademicCV${index}/view`,
      customLinks: {
        doi: {
          value: `10.5555/bouesti.${slugify(person.lastName)}.${2020 + (index % 6)}.${index + 1}`,
          visible: true
        }
      },
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
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${person.firstName} ${person.lastName}`)}&background=114b5f&color=ffffff&size=512`,
      accountStatus: "active",
      isPublished: true,
      slug: uniqueSlug(fullName, profiles, profileId),
      createdAt: now,
      updatedAt: now
    }
  };
}

function buildNonTeachingProfile(person, unit, index, profiles) {
  const theme = nonTeachingTheme(unit.department);
  const fullName = `${person.honoraryTitle} ${person.firstName} ${person.lastName}`;
  const email = buildEmail(person.firstName, person.lastName);
  const profileId = createId("prs");
  const userId = createId("usr");
  const now = new Date(Date.UTC(2026, 3, 10, 10 + (index % 5), (index * 9) % 60, 0)).toISOString();

  return {
    email,
    password: defaultPassword,
    user: {
      id: userId,
      name: fullName,
      email,
      role: "staff",
      passwordHash: "",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now
    },
    profile: {
      id: profileId,
      userId,
      firstName: person.firstName,
      lastName: person.lastName,
      fullName,
      honoraryTitle: person.honoraryTitle,
      staffCategory: "Non Teaching Staff",
      college: "University Administration",
      title: unit.title,
      department: unit.department,
      schoolFaculty: "Central Administration",
      email,
      phone: `+234 81${String(41000000 + index * 211).padStart(8, "0").slice(-8)}`,
      officeAddress: unit.officeAddress,
      bio: `${fullName} serves in the ${unit.department} at BOUESTI. ${person.firstName} supports daily university operations through ${theme.focus}. The profile shares the same institutional template as academic staff while emphasizing administrative delivery, coordination, and campus support responsibilities.`,
      researchAreas: theme.serviceAreas,
      qualifications: theme.qualifications,
      scopusUrl: "",
      orcidUrl: "",
      googleScholarUrl: "",
      researchGateUrl: "",
      openScienceUrl: "",
      linkedinUrl: `https://www.linkedin.com/in/${slugify(`${person.firstName}-${person.lastName}`)}`,
      emailAddress: email,
      cvUrl: `https://drive.google.com/file/d/${slugify(person.firstName + person.lastName).slice(0, 12)}AdminCV${index}/view`,
      customLinks: {
        doi: {
          value: "",
          visible: false
        }
      },
      showEmailAddress: true,
      showPhone: true,
      showOfficeAddress: true,
      showScopusUrl: false,
      showOrcidUrl: false,
      showGoogleScholarUrl: false,
      showResearchGateUrl: false,
      showOpenScienceUrl: false,
      showLinkedinUrl: true,
      showCvUrl: true,
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${person.firstName} ${person.lastName}`)}&background=c9733a&color=ffffff&size=512`,
      accountStatus: "active",
      isPublished: true,
      slug: uniqueSlug(fullName, profiles, profileId),
      createdAt: now,
      updatedAt: now
    }
  };
}

function upsertStaffRecord(state, record) {
  const existingUserIndex = state.users.findIndex((entry) => entry.email === record.email);
  const existingUser = existingUserIndex >= 0 ? state.users[existingUserIndex] : null;
  const userId = existingUser ? existingUser.id : record.user.id;
  const profileIndex = state.staffProfiles.findIndex((entry) => entry.userId === userId);
  const now = new Date().toISOString();

  if (existingUser) {
    state.users[existingUserIndex] = {
      ...existingUser,
      name: record.user.name,
      email: record.user.email,
      role: "staff",
      passwordHash: record.user.passwordHash,
      mustChangePassword: false,
      updatedAt: now
    };
  } else {
    state.users.push(record.user);
  }

  const nextProfile = {
    ...record.profile,
    userId,
    updatedAt: now
  };

  if (profileIndex >= 0) {
    state.staffProfiles[profileIndex] = {
      ...state.staffProfiles[profileIndex],
      ...nextProfile,
      slug: uniqueSlug(nextProfile.fullName, state.staffProfiles, state.staffProfiles[profileIndex].id)
    };
  } else {
    state.staffProfiles.push(nextProfile);
  }
}

async function main() {
  const raw = fs.readFileSync(dataPath, "utf8");
  const state = JSON.parse(raw);
  state.users = Array.isArray(state.users) ? state.users : [];
  state.staffProfiles = Array.isArray(state.staffProfiles) ? state.staffProfiles : [];
  state.profileOptions = state.profileOptions || {};

  const generatedRecords = [];
  const existingProfiles = [...state.staffProfiles];

  academicPeople.forEach((person, index) => {
    generatedRecords.push(buildAcademicProfile(person, academicUnits[index], index, existingProfiles));
  });

  nonTeachingPeople.forEach((person, index) => {
    generatedRecords.push(buildNonTeachingProfile(person, nonTeachingUnits[index], index, existingProfiles));
  });

  for (const record of generatedRecords) {
    record.user.passwordHash = await bcrypt.hash(record.password, 10);
    upsertStaffRecord(state, record);
  }

  state.profileOptions.honoraryTitles = mergeUnique(state.profileOptions.honoraryTitles, [
    "Dr.",
    "Engr.",
    "Miss.",
    "Mr.",
    "Mrs.",
    "Prof."
  ]);
  state.profileOptions.titles = mergeUnique(state.profileOptions.titles, [
    ...academicPeople.map((person) => person.title),
    ...nonTeachingUnits.map((unit) => unit.title)
  ]);
  state.profileOptions.colleges = mergeUnique(state.profileOptions.colleges, [
    "College of Education",
    "College of Science",
    "College of Technology",
    "University Administration"
  ]);
  state.profileOptions.schools = mergeUnique(state.profileOptions.schools, [
    ...academicUnits.map((unit) => unit.schoolFaculty),
    "Central Administration"
  ]);
  state.profileOptions.departments = mergeUnique(state.profileOptions.departments, [
    ...academicUnits.map((unit) => unit.department),
    ...nonTeachingUnits.map((unit) => unit.department)
  ]);

  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2), "utf8");

  const csvLines = [
    "fullName,email,password,staffCategory,title,department"
  ];

  generatedRecords
    .sort((left, right) => left.profile.fullName.localeCompare(right.profile.fullName))
    .forEach((record) => {
      csvLines.push(
        [
          record.profile.fullName,
          record.email,
          record.password,
          record.profile.staffCategory,
          record.profile.title,
          record.profile.department
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      );
    });

  fs.writeFileSync(loginSheetPath, `${csvLines.join("\n")}\n`, "utf8");

  const academicCount = generatedRecords.filter(
    (record) => record.profile.staffCategory === "Academic Staff"
  ).length;
  const nonTeachingCount = generatedRecords.filter(
    (record) => record.profile.staffCategory === "Non Teaching Staff"
  ).length;

  console.log(
    JSON.stringify(
      {
        createdOrUpdated: generatedRecords.length,
        academicCount,
        nonTeachingCount,
        loginSheetPath
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
