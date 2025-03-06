const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load students data
const dataPath = path.join(__dirname, 'data', 'students.json');
const loadStudents = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};

// Save students data
const saveStudents = (students) => {
  fs.writeFileSync(dataPath, JSON.stringify(students, null, 2));
};

// Calculate attendance percentage for a specific subject
const calculatePercentage = (attendance, subject) => {
  if (!attendance[subject] || attendance[subject].length === 0) return 0; // Avoid division by zero
  const presentDays = attendance[subject].filter(day => day.status === 'Present').length;
  return ((presentDays / attendance[subject].length) * 100).toFixed(2); // Round to 2 decimal places
};

// Routes
app.get('/', (req, res) => {
  const students = loadStudents();
  const subject = req.query.subject || 'dsa'; // yaha pe default dsa set karna ke liye

  // Add percentage for the selected subject to each student
  students.forEach(student => {
    student.percentage = {};
    student.percentage[subject] = calculatePercentage(student.attendance, subject);
  });

  res.render('index', { students, subject });
});

app.get('/add', (req, res) => {
  res.render('add-student');
});

app.post('/add', (req, res) => {
  const students = loadStudents();
  const newStudent = {
    id: students.length + 1,
    name: req.body.name,
    attendance: {
      dsa: [],
      backend: []
    }
  };
  students.push(newStudent);
  saveStudents(students);
  res.redirect('/');
});

app.get('/edit/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  res.render('edit-student', { student });
});

app.post('/edit/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  student.name = req.body.name;
  saveStudents(students);
  res.redirect('/');
});

app.get('/mark-attendance/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  res.render('mark-attendance', { student });
});

app.post('/mark-attendance/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  const { date, status, subject } = req.body;

  // Initialize subject attendance if it doesn't exist
  if (!student.attendance[subject]) {
    student.attendance[subject] = [];
  }

  // Check if attendance for the date already exists
  const existingAttendance = student.attendance[subject].find(a => a.date === date);
  if (existingAttendance) {
    existingAttendance.status = status; // Update status if date exists
  } else {
    student.attendance[subject].push({ date, status }); // Add new attendance record
  }

  // Save updated data
  saveStudents(students);

  // Redirect to the home page with the selected subject
  res.redirect(`/?subject=${subject}`);
});

app.get('/records/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  const subject = req.query.subject || 'dsa'; // Default to 'dsa' if no subject is selected

  if (!student) {
    return res.status(404).send('Student not found');
  }

  res.render('records', { student, subject });
});

app.get('/edit-attendance/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  const subject = req.query.subject;
  const index = parseInt(req.query.index);

  if (!student || !student.attendance[subject] || !student.attendance[subject][index]) {
    return res.status(404).send('Record not found');
  }

  const record = student.attendance[subject][index];
  res.render('edit-attendance', { student, subject, index, record });
});

app.post('/edit-attendance/:id', (req, res) => {
  const students = loadStudents();
  const student = students.find(s => s.id === parseInt(req.params.id));
  const { subject, index, status } = req.body;

  if (!student || !student.attendance[subject] || !student.attendance[subject][index]) {
    return res.status(404).send('Record not found');
  }

  // Update the attendance status
  student.attendance[subject][index].status = status;

  // Save the updated data
  saveStudents(students);

  // Redirect back to the records page
  res.redirect(`/records/${student.id}?subject=${subject}`);
});

app.get('/delete/:id', (req, res) => {
  const students = loadStudents();
  const updatedStudents = students.filter(s => s.id !== parseInt(req.params.id));
  saveStudents(updatedStudents);
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});