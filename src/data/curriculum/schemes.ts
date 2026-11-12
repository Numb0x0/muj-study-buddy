/**
 * B.Tech Robotics & Artificial Intelligence schemes, transcribed from the
 * official documents (Department of Mechatronics Engineering, MUJ):
 *
 *   2025 onwards — RAI-Scheme.pdf + RAI-Syllabus.pdf
 *   2024 batch   — Scheme & Syllabus_BTech_R&AI_B.Tech 2024-04.02.2025.pdf
 *
 * The two schemes differ (course order, codes, flexi cores), so they are kept
 * separate. Codes/names/L-T-P-C follow the SCHEME; placeholder codes
 * (RAIXXXX, MASXXXX …) are kept exactly as printed. See docs/CURRICULUM.md.
 */
import type { BatchCurriculum, CourseKind, CourseOption, SchemeCourse } from "./types";
import { SYLLABUS_2024 } from "./syllabus-2024";
import { SYLLABUS_2025 } from "./syllabus-2025";

function course(code: string, name: string, ltpc: [number, number, number, number], kind: CourseKind = "theory", extra: Partial<SchemeCourse> = {}): SchemeCourse {
  const [l, t, p, c] = ltpc;
  return { code, name, l, t, p, c, kind, ...extra };
}
const syl = (...keys: string[]) => ({ syllabus: keys });
const opt = (code: string, name: string, extra: Partial<CourseOption> = {}): CourseOption => ({ code, name, ...extra });

const OPEN_ELECTIVE_LIST = (withSyllabus: boolean): CourseOption[] => [
  opt("RAI0001", "Fundamental of Robotics", withSyllabus ? syl("fundamental-of-robotics") : {}),
  opt("RAI0002", "Automation in Industry", withSyllabus ? syl("automation-in-industry") : {}),
  opt("RAI0003", "Building Automation", withSyllabus ? syl("building-automation") : {}),
  opt("RAI0004", "Sensor Technologies", withSyllabus ? syl("sensor-technologies") : {}),
  opt("RAI0005", "Smart Agriculture", withSyllabus ? syl("smart-agriculture") : {}),
  opt("RAI0006", "Manufacturing Process"),
];

// ── 2025–26 onwards ─────────────────────────────────────────────

const B2025: BatchCurriculum = {
  id: "2025",
  label: "2025 onwards",
  title: "B.Tech Robotics & AI — scheme for 2025–26 onwards",
  description: "For students admitted from 2025–26. 160 credits over eight semesters.",
  totalCredits: 160,
  programId: "muj-btech-robotics-ai",
  sources: { scheme: "RAI-Scheme.pdf (2025–2026 onwards, 160 credits)", syllabus: "RAI-Syllabus.pdf (Semesters 3–8)" },
  coverageNote: "The syllabus document starts at Semester 3, so first-year courses show the scheme only.",
  semesters: [
    {
      number: 1,
      totalCredits: 20,
      courses: [
        course("CHY1001", "Engineering Chemistry & Lab", [2, 0, 2, 3]),
        course("MAS1001", "Calculus & Matrices", [2, 1, 0, 3]),
        course("ECE1002", "Electronic Circuits", [2, 1, 0, 3]),
        course("MEE1008", "Basic Mechanical Engineering", [3, 0, 0, 3]),
        course("CSCXXXX", "Problem-Solving Using Computers", [2, 1, 0, 3]),
        course("DOA1001", "Universal Human Values", [1, 0, 0, 1]),
        course("CSCXXXX", "Problem-Solving Using Computers Lab", [0, 0, 2, 1], "lab"),
        course("LLC1011", "Communication Skills", [2, 0, 0, 2]),
        course("MEE1036", "Engineering Graphics", [0, 0, 2, 1], "lab"),
      ],
    },
    {
      number: 2,
      totalCredits: 20,
      courses: [
        course("PHY1001", "Engineering Physics & Lab", [2, 1, 2, 4]),
        course("MAS1002", "Computational Mathematics", [2, 1, 0, 3]),
        course("CHY1002", "Environmental Studies", [2, 0, 0, 2]),
        course("EEE1001", "Electrical Technology", [2, 0, 0, 2]),
        course("CIV1002", "Engineering Material and Mechanics", [2, 1, 0, 3]),
        course("MEE1038", "Creativity & Innovation IDEA Lab", [1, 0, 2, 2], "lab"),
        course("BIT1001", "Biology for Engineers", [2, 0, 0, 2]),
        course("MEE1037", "MATLAB for Engineer’s Lab", [0, 0, 2, 1], "lab"),
        course("DOA1002", "Wellness and Community Services", [1, 0, 0, 1]),
      ],
    },
    {
      number: 3,
      totalCredits: 24,
      courses: [
        course("MBBXXX/MEEXXXX", "Principles of Management / Engineering Economics", [3, 0, 0, 3], "theory", syl("principle-of-management", "engineering-economics")),
        course("RAI2101", "Embedded Controllers", [3, 1, 0, 4], "theory", { ...syl("embedded-controllers"), note: "The syllabus lists this course as MCE2101." }),
        course("RAI2102", "Basics of AI and ML", [3, 1, 0, 4], "theory", syl("basics-of-ai-and-ml")),
        course("RAI2103", "Strength of Materials", [3, 0, 0, 3], "theory", { ...syl("strength-of-materials"), note: "The syllabus lists this course as MCE2103." }),
        course("RAI2104", "Manufacturing Technology", [3, 1, 0, 4], "theory", syl("manufacturing-technology")),
        course("RAI2105", "Robot Kinematics and Dynamics", [3, 1, 0, 4], "theory", syl("robot-kinematics-and-dynamics")),
        course("RAI2130", "Embedded Controllers Lab", [0, 0, 1, 1], "lab", syl("embedded-controllers-lab")),
        course("RAI2131", "AI and ML Lab", [0, 0, 1, 1], "lab", syl("ai-and-ml-lab")),
      ],
    },
    {
      number: 4,
      totalCredits: 23,
      courses: [
        course("MASXXXX", "Statistics & Probability", [3, 0, 0, 3], "theory", syl("statistics-and-probability")),
        course("MBBXXX/MEEXXXX", "Principles of Management / Engineering Economics", [3, 0, 0, 3], "theory", syl("principle-of-management", "engineering-economics")),
        course("RAI2203", "Sensors and Actuators", [3, 1, 0, 4], "theory", syl("sensors-and-actuators")),
        course("RAIXXXX", "Program Elective 1", [3, 0, 0, 3], "program-elective", { group: "pe1" }),
        course("RAI00XX", "Open Elective 1", [3, 0, 0, 3], "open-elective"),
        course("XXXXXXX", "Technical Report Writing", [2, 0, 0, 2], "theory", syl("technical-report-writing")),
        course("RAI2232", "Sensors and Actuators Lab", [0, 0, 1, 1], "lab", syl("sensors-and-actuators-lab")),
        course("RAI2233", "Integrated Electronics Lab", [0, 0, 2, 1], "lab", syl("integrated-electronics-lab")),
        course("RAI2271", "Project Based Learning - 1", [0, 0, 3, 3], "project", syl("project-based-learning-1")),
      ],
    },
    {
      number: 5,
      totalCredits: 25,
      courses: [
        course("RAI3102", "Deep Learning", [3, 1, 0, 4], "theory", syl("deep-learning")),
        course("RAI3103", "Design of Machine Elements", [3, 0, 0, 3], "theory", syl("design-of-machine-elements")),
        course("RAI3104", "Modern Control Theory", [3, 0, 0, 3], "theory", syl("modern-control-theory")),
        course("RAI3105", "Mobile Robots", [3, 1, 0, 4], "theory", { ...syl("mobile-robots"), note: "The syllabus lists this course as MCE3105." }),
        course("RAIXXXX", "Program Elective 2", [3, 0, 0, 3], "program-elective", { group: "pe2" }),
        course("RAIXXXX", "Program Elective 3", [3, 0, 0, 3], "program-elective", { group: "pe3" }),
        course("RAI3131", "Modeling and Simulation Lab", [0, 0, 1, 1], "lab", { ...syl("modelling-and-simulation-lab"), note: "The syllabus lists this lab as RAI3130." }),
        course("RAI3132", "Robotics Lab", [0, 0, 1, 1], "lab", { ...syl("robotics-lab"), note: "The syllabus lists this lab as RAI3131." }),
        course("RAI3271", "Project Based Learning - 2", [0, 0, 3, 3], "project", { ...syl("project-based-learning-2"), note: "The syllabus lists this course as MCE3171." }),
      ],
    },
    {
      number: 6,
      totalCredits: 23,
      courses: [
        course("RAI3201", "Drives and Automation", [3, 1, 0, 4], "theory", syl("drives-and-automation")),
        course("RAI3202", "Reinforcement Learning in Robotics", [3, 1, 0, 4], "theory", { ...syl("reinforcement-learning-in-robotics"), note: "The syllabus prints this course as RAI3102, the same code as Deep Learning." }),
        course("RAIXXXX", "Program Elective 4", [3, 0, 0, 3], "program-elective", { group: "pe4" }),
        course("RAIXXXX", "Program Elective 5", [3, 0, 0, 3], "program-elective", { group: "pe5" }),
        course("RAIXXXX", "Program Elective 6", [3, 0, 0, 3], "program-elective", { group: "pe6" }),
        course("RAIXXXX", "Open Elective 2", [3, 0, 0, 3], "open-elective"),
        course("RAI3231", "Drives and Automation Lab", [0, 0, 1, 1], "lab", syl("drives-and-automation-lab")),
        course("RAI3232", "Pneumatics and Hydraulics Lab", [0, 0, 2, 2], "lab", syl("pneumatics-and-hydraulics-lab")),
      ],
    },
    {
      number: 7,
      totalCredits: 13,
      courses: [
        course("RAIXXXX", "Open Elective 3", [3, 0, 0, 3], "open-elective"),
        course("RAIXXXX", "Open Elective 4", [3, 0, 0, 3], "open-elective"),
        course("RAIXXXX", "Program Elective 7", [3, 0, 0, 3], "program-elective", { group: "pe7" }),
        course("RAIXXXX", "Program Elective 8", [3, 0, 0, 3], "program-elective", { group: "pe8" }),
        course("RAIXXXX", "Internship (Industry / Research / Industry Certification)", [0, 0, 0, 1], "internship", {
          ...syl("internship-industry-research-industrial-certification"),
          note: "The syllabus lists the internship as RAI4170 (0-0-2-1).",
        }),
      ],
    },
    {
      number: 8,
      totalCredits: 12,
      courses: [course("RAI4170", "Major Project", [0, 0, 12, 12], "project", { note: "The syllabus and the Honours scheme list the major project as RAI4270." })],
    },
  ],
  groups: [
    { id: "pe1", label: "Program Elective 1", semester: 4, options: [opt("RAI2240", "Digital System Design", syl("digital-system-design")), opt("RAI2241", "Robot Gripper Design", { ...syl("robot-gripper-design"), note: "Syllabus code: MCE2241." })] },
    { id: "pe2", label: "Program Elective 2", semester: 5, options: [opt("RAI3140", "Signals and Systems", syl("signals-and-systems")), opt("RAI3142", "Smart Materials", syl("smart-materials"))] },
    { id: "pe3", label: "Program Elective 3", semester: 5, options: [opt("RAI3150", "Cyber Physical System", syl("cyber-physical-system")), opt("RAI3151", "Digital Signal Processing", syl("digital-signal-processing"))] },
    { id: "pe4", label: "Program Elective 4", semester: 6, options: [opt("RAI3242", "Pneumatics and Hydraulics for Robots", syl("pneumatics-and-hydraulics-for-robots")), opt("RAI3244", "Collaborative Robots", syl("collaborative-robots"))] },
    { id: "pe5", label: "Program Elective 5", semester: 6, options: [opt("RAI3253", "Ethics and Social Implications in AI", syl("ethics-and-social-implications-in-ai")), opt("RAI3254", "Intelligent Systems", { ...syl("intelligent-systems"), note: "Syllabus code: MCE3254." })] },
    { id: "pe6", label: "Program Elective 6", semester: 6, options: [opt("RAI3263", "Production and Operations Management", syl("production-and-operations-management")), opt("RAI3264", "Machine Vision", { ...syl("machine-vision"), note: "Syllabus code: RAI3260." })] },
    { id: "pe7", label: "Program Elective 7", semester: 7, options: [opt("RAI4143", "Internet of Robotic Things", syl("internet-of-robotic-things")), opt("RAI4142", "Robot Process Automation", syl("robot-process-automation"))] },
    {
      id: "pe8",
      label: "Program Elective 8",
      semester: 7,
      options: [
        opt("RAI4154", "Industrial IoT", syl("industrial-iot")),
        opt("RAI4155", "AI in Industrial Applications", { note: "Syllabus code: MCE4153. The syllabus prints e-mobility topics under this title, so they aren't shown here — check the official topics with the department." }),
      ],
    },
  ],
  openElectives: OPEN_ELECTIVE_LIST(true),
  tracks: [
    {
      id: "minor-honours",
      title: "Minor specialisation / Honours",
      credits: "160 + 18 credits",
      additions: [
        { semester: 5, courses: [course("RAIXXXX", "Minor Specialization - 1 / Honors", [3, 0, 0, 3], "honours-minor")] },
        { semester: 6, courses: [course("RAIXXXX", "Minor Specialization - 2 / Honors", [3, 0, 0, 3], "honours-minor")] },
        {
          semester: 7,
          courses: [course("RAIXXXX", "Minor Specialization - 3 / Honors", [3, 0, 0, 3], "honours-minor"), course("RAIXXXX", "Minor Specialization - 4 / Honors", [3, 0, 0, 3], "honours-minor")],
        },
        { semester: 8, courses: [course("RAI4271/RAI4272", "Minor Specialization / Honors (Research Project)", [0, 0, 6, 6], "honours-minor", syl("minor-specialization-project", "honors-research-project"))] },
      ],
      electives: [
        {
          title: "Minor specialisation in 3D Printing",
          options: [
            opt("RAI3190", "Additive Manufacturing", { ...syl("additive-manufacturing-minor-specialization-1"), note: "Syllabus code: MCE3190." }),
            opt("RAI3290", "Software Skills for 3D Printing", syl("software-skills-for-3d-printing")),
            opt("RAI4192", "Product Design and Development", syl("product-design-and-development")),
            opt("RAI4171", "Project Based Learning - 3 (Minor specialization)", syl("project-based-learning-3")),
          ],
        },
        {
          title: "Honours electives",
          options: [
            opt("RAI3180", "Data Analytics and Visualization", { note: "Syllabus code: MCE3180. The syllabus prints introductory mechatronics topics under this title, so they aren't shown here." }),
            opt("RAI3281", "Robot System Design", syl("robot-system-design")),
            opt("RAI4182", "Robot Safety & Maintenance", syl("robot-safety-and-maintenance")),
            opt("RAI4183", "Biomedical Robots", syl("biomedical-robots")),
          ],
        },
      ],
      notes: [
        "Scheme note: students pursuing a minor specialisation or honours undertake an 18-credit project in Semester VIII related to the specialisation.",
        "Scheme note: students pursuing a specialisation may take Program Elective 7 as a development-, design-, lab- or study-oriented project relevant to their field.",
      ],
    },
  ],
  syllabus: SYLLABUS_2025,
  notes: [],
};

// ── 2024 batch ──────────────────────────────────────────────────

const B2024: BatchCurriculum = {
  id: "2024",
  label: "2024 batch",
  title: "B.Tech Robotics & AI — scheme for the 2024 batch",
  description: "For students admitted in 2024. 160 credits in total; this scheme covers Semesters 3–8 (120 credits).",
  totalCredits: 160,
  programId: "muj-btech-robotics-ai-2024",
  sources: { scheme: "Scheme & Syllabus_BTech_R&AI_B.Tech 2024 (04.02.2025), 160 credits", syllabus: "Same document (Semester 3–4 courses only)" },
  coverageNote: "The 2024 scheme document covers Semesters 3–8 and includes detailed syllabi for Semester 3–4 courses only. First-year courses aren't listed in it.",
  semesters: [
    {
      number: 3,
      totalCredits: 24,
      courses: [
        course("MEE2001", "Engineering Economics", [3, 0, 0, 3], "theory", syl("engineering-economics")),
        course("MBB2101", "Management of Technology", [3, 0, 0, 3], "theory", syl("management-of-technology")),
        course("RAI2101", "Embedded Controllers", [3, 1, 0, 4], "theory", syl("embedded-controllers")),
        course("RAI2102", "Basics of AI and ML", [3, 1, 0, 4], "theory", syl("basics-of-ai-and-ml")),
        course("RAI2103", "Strength of Materials", [3, 0, 0, 3], "theory", syl("strength-of-materials")),
        course("RAI21XX", "Flexi Core 1", [3, 1, 0, 4], "flexi-core", { group: "fc1" }),
        course("RAI2130", "Embedded Controllers Lab", [0, 0, 2, 1], "lab", syl("embedded-controllers-lab")),
        course("RAI2131", "AI and ML Lab", [0, 0, 2, 1], "lab", syl("ai-and-ml-lab")),
        course("RAI2170", "Project-based Learning-1", [0, 0, 2, 1], "project", { ...syl("project-based-learning-i"), note: "The syllabus prints this course as RAI2270 (the scheme's code for Project-Based Learning-2)." }),
      ],
    },
    {
      number: 4,
      totalCredits: 25,
      courses: [
        course("MAS21XX/MEE22XX", "Statistics & Probability", [3, 0, 0, 3], "theory", { ...syl("statistical-methods-and-probability-theory"), note: "The syllabus lists this course as MAS2001 Statistical Methods and Probability Theory." }),
        course("RAI2201", "Sensors and Control System", [3, 1, 0, 4], "theory", syl("sensors-and-control-system")),
        course("RAI2202", "Robot Kinematics and Dynamics", [3, 1, 0, 4], "theory", syl("robot-kinematics-and-dynamics")),
        course("RAI22XX", "Program Elective 1", [3, 0, 0, 3], "program-elective", { group: "pe1" }),
        course("RAI22XX", "Flexi Core 2", [3, 1, 0, 4], "flexi-core", { group: "fc2" }),
        course("RAI20XX", "Open Elective 1", [3, 0, 0, 3], "open-elective"),
        course("RAI2230", "Sensors and Control System Lab", [0, 0, 2, 1], "lab", syl("sensor-and-control-systems-lab")),
        course("RAI2231", "Integrated Electronics Lab", [0, 0, 3, 2], "lab", syl("integrated-electronics-lab")),
        course("RAI2270", "Project-Based Learning-2", [0, 0, 2, 1], "project", { ...syl("project-based-learning-i"), note: "The syllabus entry with this code is titled “Project Based Learning-I”; its description is the generic project-based-learning text." }),
      ],
    },
    {
      number: 5,
      totalCredits: 24,
      courses: [
        course("RAI3101", "Design of Machine Elements", [3, 1, 0, 4], "theory", { note: "The Honours page of the same document lists RAI3101 as “AI in Robotics”." }),
        course("RAI3102", "Deep Learning", [3, 1, 0, 4]),
        course("RAI31XX", "Flexi Core 3", [3, 1, 0, 4], "flexi-core", { group: "fc3" }),
        course("RAI31XX", "Program Elective 2", [3, 0, 0, 3], "program-elective", { group: "pe2" }),
        course("RAI31XX", "Program Elective 3", [3, 0, 0, 3], "program-elective", { group: "pe3" }),
        course("RAI30XX", "Open Elective 2", [3, 0, 0, 3], "open-elective"),
        course("RAI3130", "Mobile Robotics Lab", [0, 0, 2, 1], "lab"),
        course("RAI3131", "Modeling and Simulation Lab", [0, 0, 2, 1], "lab"),
        course("RAI3170", "Project Based Learning 3", [0, 0, 2, 1], "project"),
      ],
    },
    {
      number: 6,
      totalCredits: 22,
      courses: [
        course("RAI3201", "Drives and Automation", [3, 1, 0, 4]),
        course("RAI32XX", "Program Elective 4", [3, 0, 0, 3], "program-elective", { group: "pe4" }),
        course("RAI32XX", "Program Elective 5", [3, 0, 0, 3], "program-elective", { group: "pe5" }),
        course("RAI32XX", "Program Elective 6", [3, 0, 0, 3], "program-elective", { group: "pe6" }),
        course("RAI30XX", "Open Elective 3", [3, 0, 0, 3], "open-elective"),
        course("RAI3202", "Professional Practice", [0, 0, 2, 1], "lab"),
        course("RAI3230", "Industrial Robotics Lab", [0, 0, 2, 1], "lab"),
        course("RAI3231", "Drives and Automation Lab", [0, 0, 3, 1], "lab"),
        course("RAI3270", "Project-based Learning 4", [0, 0, 3, 3], "project"),
      ],
    },
    {
      number: 7,
      totalCredits: 13,
      courses: [
        course("RAI41XX", "Program Elective 7", [3, 0, 0, 3], "program-elective", { group: "pe7" }),
        course("RAI41XX", "Program Elective 8", [3, 0, 0, 3], "program-elective", { group: "pe8" }),
        course("RAI40XX", "Open Elective 4", [3, 0, 0, 3], "open-elective"),
        course("RAI40XX", "Open Elective 5", [3, 0, 0, 3], "open-elective"),
        course("RAI4170", "Internship (Industry or Research)", [0, 0, 2, 1], "internship"),
      ],
    },
    {
      number: 8,
      totalCredits: 12,
      courses: [course("RAI4270", "Major Project", [0, 0, 0, 12], "project")],
    },
  ],
  groups: [
    { id: "fc1", label: "Flexi Core 1", semester: 3, options: [opt("RAI2120", "Manufacturing Process", syl("manufacturing-process")), opt("CSE22XX", "Data Structures and Algorithms", { ...syl("data-structures-and-algorithms"), note: "Syllabus code: CSE2101, printed as [3 1 0 3]." })] },
    { id: "fc2", label: "Flexi Core 2", semester: 4, options: [opt("RAI2220", "Mobile Robots", syl("mobile-robots")), opt("CSE21XX", "Object Oriented Programming", { ...syl("object-oriented-programming-using-python"), note: "Syllabus: CSE2122 Object Oriented Programming using Python." })] },
    { id: "fc3", label: "Flexi Core 3", semester: 5, options: [opt("RAI3120", "Robot Path Planning and Control"), opt("CSE31XX", "Relational Database Management Systems")] },
    { id: "pe1", label: "Program Elective 1", semester: 4, options: [opt("RAI2240", "Digital System Design", syl("digital-system-design")), opt("RAI2241", "Robot Gripper Design", syl("robot-gripper-design"))] },
    { id: "pe2", label: "Program Elective 2", semester: 5, options: [opt("RAI3140", "Signals and Systems"), opt("RAI3141", "Reinforcement Learning in Robotics"), opt("RAI3142", "Smart Materials")] },
    { id: "pe3", label: "Program Elective 3", semester: 5, options: [opt("RAI3150", "Cyber Physical System"), opt("RAI3151", "Digital Signal Processing"), opt("RAI3152", "Advance Control Systems")] },
    {
      id: "pe4",
      label: "Program Elective 4",
      semester: 6,
      options: [opt("RAI3240", "Modelling and Simulation of UAV"), opt("RAI3241", "Biomedical Robots"), opt("RAI3242", "Pneumatics and Hydraulics for Robots"), opt("RAI3243", "Electronics for Robotics")],
    },
    {
      id: "pe5",
      label: "Program Elective 5",
      semester: 6,
      options: [opt("RAI3150", "Design and Analysis of Algorithms"), opt("RAI3151", "Machine Learning for Robotics"), opt("RAI3152", "Sustainable Energy Systems in Robotics")],
      note: "The scheme reuses the Program Elective 3 codes (RAI3150–RAI3152) for these courses.",
    },
    { id: "pe6", label: "Program Elective 6", semester: 6, options: [opt("RAI3261", "Robotics Vision and Image Processing"), opt("RAI3262", "Wireless Sensor Networks"), opt("RAI4163", "Production and Operations Management")] },
    { id: "pe7", label: "Program Elective 7", semester: 7, options: [opt("RAI4140", "AI in Agriculture"), opt("RAI4141", "Smart Manufacturing"), opt("RAI4142", "Robot Process Automation")] },
    {
      id: "pe8",
      label: "Program Elective 8",
      semester: 7,
      options: [opt("RAI4151", "PLC and SCADA"), opt("RAI4152", "Collaborative Robots"), opt("RAI4153", "AI in Industrial Applications"), opt("RAI4154", "Ethics and Social Implications in AI")],
    },
  ],
  openElectives: OPEN_ELECTIVE_LIST(false),
  tracks: [
    {
      id: "honours",
      title: "B.Tech (Hons) Robotics & AI",
      credits: "178 credits (160 + 18)",
      additions: [
        { semester: 5, courses: [course("RAI3181", "Research Methodology", [1, 0, 0, 1], "honours-minor")] },
        { semester: 6, courses: [course("RAI328X*", "Honors Elective 1", [3, 0, 0, 3], "honours-minor")] },
        { semester: 7, courses: [course("RAI418X*", "Honors Elective 2", [3, 0, 0, 3], "honours-minor"), course("RAI418X*", "Honors Elective 3", [3, 0, 0, 3], "honours-minor")] },
        { semester: 8, courses: [course("RAI428X*", "Honors Project", [0, 0, 0, 8], "honours-minor")] },
      ],
      electives: [{ title: "Honours electives (all without prerequisites)", options: [opt("RAI3281", "Robot System Design"), opt("RAI4181", "Robot Safety & Maintenance"), opt("RAI4182", "Data Analytics and Visualization")] }],
    },
    {
      id: "minor-3d-printing",
      title: "Minor specialisation in 3D Printing",
      credits: "178 credits (160 + 18)",
      additions: [
        { semester: 5, courses: [course("RAI3181", "Research Methodology", [1, 0, 0, 1], "honours-minor")] },
        { semester: 6, courses: [course("RAI329X*", "Minor Elective 1", [3, 0, 0, 3], "honours-minor")] },
        { semester: 7, courses: [course("RAI419X*", "Minor Elective 2", [3, 0, 0, 3], "honours-minor"), course("RAI419X*", "Minor Elective 3", [3, 0, 0, 3], "honours-minor")] },
        { semester: 8, courses: [course("RAI4271*", "Minor Specialization Project", [0, 0, 0, 8], "honours-minor")] },
      ],
      electives: [
        {
          title: "Minor electives",
          options: [
            opt("RAI3290", "Additive Manufacturing", { note: "Prerequisite: RAI4103 Manufacturing Process (offered as OE6 by the Mechatronics department)." }),
            opt("RAI4191", "Software Skills for 3D Printing"),
            opt("RAI4192", "Product Design and Development"),
          ],
        },
      ],
      notes: ["Offered by the Mechatronics department to students of all branches except Mechanical Engineering and Electronics & Communication Engineering. For eligibility, the scheme refers to the AICTE APH."],
    },
  ],
  syllabus: SYLLABUS_2024,
  notes: [],
};

export const CURRICULA: Record<"2025" | "2024", BatchCurriculum> = { "2025": B2025, "2024": B2024 };
export const BATCH_ORDER = ["2025", "2024"] as const;
export const DEFAULT_BATCH = "2025" as const;
