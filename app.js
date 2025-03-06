const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 2727;
const studentsFile = "students.json";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Built-in Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Custom Middleware: Logging Middleware
const requestLogger = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};
app.use(requestLogger);

// Custom Middleware: Load Students Data
const loadStudents = (req, res, next) => {
    req.students = getStudents(); // Attach students data to req object
    next();
};

// Home Page
app.get("/", (req, res) => {
    res.render("index");
});

// Subject Selection Page
app.get("/select-subject", (req, res) => {
    res.render("select-subject");
});

// Attendance Marking Page (Uses Middleware)
app.get("/mark-attendance", loadStudents, (req, res) => {
    let students = req.students;
    let subject = req.query.subject;

    if (!subject) {
        return res.send("Invalid subject selection.");
    }

    res.render("mark-attendance", { students, subject });
});

// Submit Attendance
app.post("/submit-attendance", loadStudents, (req, res) => {
    let students = req.students;
    let subject = req.body.subject;
    let date = new Date().toISOString().split("T")[0]; // Current Date

    students.forEach(student => {
        let attendanceStatus = req.body[`attendance_${student.id}`];

        if (attendanceStatus) {
            if (!Array.isArray(student.attendance[subject])) {
                student.attendance[subject] = [];
            }
            student.attendance[subject].push({ date: date, status: attendanceStatus });
        }
    });

    saveStudents(students);
    res.redirect("/");
});

// Add Student Page
app.get("/add-student", (req, res) => {
    res.render("add-student");
});

// Handle Adding a Student
app.post("/add-student", loadStudents, (req, res) => {
    let students = req.students;
    let newStudent = {
        id: students.length + 1,
        name: req.body.name,
        attendance: { DS: [], LINUX: [], AJVA: [] }
    };

    students.push(newStudent);
    saveStudents(students);
    res.redirect("/");
});

// Reports Page
app.get("/reports", loadStudents, (req, res) => {
    let students = req.students;
    let subjects = ["DS", "LINUX", "AJVA"];
    res.render("reports", { students, subjects });
});

// Utility Functions
function getStudents() {
    if (!fs.existsSync(studentsFile)) return [];
    return JSON.parse(fs.readFileSync(studentsFile, "utf-8"));
}

function saveStudents(students) {
    fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
}

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
