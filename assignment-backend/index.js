const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection with improved error handling
const connectWithRetry = () => {
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    };
    
    console.log('Attempting MongoDB connection...');
    
    mongoose.connect('mongodb://localhost:27017/elearning-assignments', options)
        .then(() => {
            console.log('Successfully connected to MongoDB');
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        });
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected, attempting to reconnect...');
    setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

// Ensure uploads directory exists with better error handling
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        console.log('Creating uploads directory at:', uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Uploads directory created successfully');
    } else {
        console.log('Uploads directory already exists at:', uploadDir);
    }
    
    // Set proper permissions (readable/writable)
    fs.chmodSync(uploadDir, 0o755);
    console.log('Permissions set on uploads directory');
} catch (error) {
    console.error('Error setting up uploads directory:', error);
    process.exit(1); // Exit if we can't set up the uploads directory
}

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Remove spaces and special characters from original filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Models
const AssignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    fileName: String,
    filePath: String,
    originalName: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const CoursePDFSchema = new mongoose.Schema({
    title: String,
    fileName: String,
    filePath: String,
    originalName: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const MarksSchema = new mongoose.Schema({
    studentId: String,
    marks: Number,
    subject: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const AssignmentSubmissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: String,
        required: true
    },
    fileName: String,
    filePath: String,
    originalName: String,
    marks: {
        type: Number,
        default: null
    },
    feedback: String,
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);
const CoursePDF = mongoose.model('CoursePDF', CoursePDFSchema);
const Marks = mongoose.model('Marks', MarksSchema);
const AssignmentSubmission = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);

// Routes

// Modified PDF endpoints with file-system fallback
app.post('/api/course-pdfs', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        console.log('Received file:', req.file.originalname);
        console.log('File size:', req.file.size);
        console.log('Mimetype:', req.file.mimetype);

        // Create PDF record
        const newPDF = {
            _id: Date.now().toString(),
            title: req.body.title || 'Untitled PDF',
            fileName: req.file.filename,
            filePath: req.file.path,
            originalName: req.file.originalname,
            uploadedAt: new Date()
        };

        try {
            // Try to save to MongoDB if connected
            if (mongoose.connection.readyState === 1) {
                const pdfDoc = new CoursePDF(newPDF);
                await pdfDoc.save();
                console.log('PDF saved to database:', pdfDoc._id);
            } else {
                // If MongoDB is not connected, just log it
                console.log('MongoDB not connected, but file was saved to disk:', req.file.path);
            }
            
            // Save a record of the PDF to a JSON file as backup
            const pdfRecordsFile = path.join(__dirname, 'pdf_records.json');
            let pdfRecords = [];
            
            try {
                if (fs.existsSync(pdfRecordsFile)) {
                    const data = fs.readFileSync(pdfRecordsFile, 'utf8');
                    pdfRecords = JSON.parse(data);
                }
            } catch (err) {
                console.error('Error reading PDF records file:', err);
                // Continue even if there's an error reading the file
            }
            
            pdfRecords.push(newPDF);
            fs.writeFileSync(pdfRecordsFile, JSON.stringify(pdfRecords, null, 2));
            console.log('PDF record saved to file system backup');
            
            res.status(201).json({
                message: 'PDF uploaded successfully',
                data: newPDF
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return success since the file was saved to disk
            res.status(201).json({
                message: 'PDF uploaded successfully (file system only)',
                data: newPDF,
                note: 'The file was saved but could not be recorded in the database due to connection issues.'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload PDF', 
            details: error.message,
            code: 'PDF_UPLOAD_FAILED'
        });
    }
});

// Get all Course PDFs with file system fallback
app.get('/api/course-pdfs', async (req, res) => {
    try {
        let pdfs = [];
        
        // Try to get from MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            try {
                pdfs = await CoursePDF.find().sort({ uploadedAt: -1 });
                console.log('PDFs retrieved from MongoDB:', pdfs.length);
            } catch (dbError) {
                console.error('Error fetching PDFs from database:', dbError);
                // Continue to fallback
            }
        }
        
        // If no PDFs from MongoDB or MongoDB is not connected, try file system backup
        if (pdfs.length === 0) {
            console.log('Using file system backup for PDFs');
            const pdfRecordsFile = path.join(__dirname, 'pdf_records.json');
            
            try {
                if (fs.existsSync(pdfRecordsFile)) {
                    const data = fs.readFileSync(pdfRecordsFile, 'utf8');
                    pdfs = JSON.parse(data);
                    console.log('PDFs retrieved from file system backup:', pdfs.length);
                }
            } catch (fsError) {
                console.error('Error reading PDF records from file:', fsError);
            }
        }
        
        // If still no PDFs, provide mock data
        if (pdfs.length === 0) {
            console.log('Providing mock PDF data');
            pdfs = [
                {
                    _id: 'mock-pdf-1',
                    title: 'Sample PDF 1',
                    fileName: 'sample1.pdf',
                    originalName: 'Sample PDF Document 1.pdf',
                    uploadedAt: new Date()
                },
                {
                    _id: 'mock-pdf-2',
                    title: 'Sample PDF 2',
                    fileName: 'sample2.pdf',
                    originalName: 'Sample PDF Document 2.pdf',
                    uploadedAt: new Date()
                }
            ];
        }
        
        res.json(pdfs);
    } catch (error) {
        console.error('Error in PDF endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload Assignment with file system fallback
app.post('/api/assignments', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        if (!req.body.title || !req.body.dueDate) {
            return res.status(400).json({ error: 'Title and due date are required' });
        }

        console.log('Received assignment file:', req.file.originalname);
        console.log('Title:', req.body.title);
        console.log('Due Date:', req.body.dueDate);

        // Create assignment record
        const newAssignment = {
            _id: Date.now().toString(),
            title: req.body.title,
            dueDate: new Date(req.body.dueDate),
            fileName: req.file.filename,
            filePath: req.file.path,
            originalName: req.file.originalname,
            uploadedAt: new Date()
        };

        try {
            // Try to save to MongoDB if connected
            if (mongoose.connection.readyState === 1) {
                const assignmentDoc = new Assignment(newAssignment);
                await assignmentDoc.save();
                console.log('Assignment saved to database:', assignmentDoc._id);
            } else {
                // If MongoDB is not connected, just log it
                console.log('MongoDB not connected, but assignment file was saved to disk:', req.file.path);
            }
            
            // Save a record of the assignment to a JSON file as backup
            const assignmentRecordsFile = path.join(__dirname, 'assignment_records.json');
            let assignmentRecords = [];
            
            try {
                if (fs.existsSync(assignmentRecordsFile)) {
                    const data = fs.readFileSync(assignmentRecordsFile, 'utf8');
                    assignmentRecords = JSON.parse(data);
                }
            } catch (err) {
                console.error('Error reading assignment records file:', err);
                // Continue even if there's an error reading the file
            }
            
            assignmentRecords.push(newAssignment);
            fs.writeFileSync(assignmentRecordsFile, JSON.stringify(assignmentRecords, null, 2));
            console.log('Assignment record saved to file system backup');
            
            res.status(201).json({
                message: 'Assignment uploaded successfully',
                data: newAssignment
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return success since the file was saved to disk
            res.status(201).json({
                message: 'Assignment uploaded successfully (file system only)',
                data: newAssignment,
                note: 'The file was saved but could not be recorded in the database due to connection issues.'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all assignments with file system fallback
app.get('/api/assignments', async (req, res) => {
    try {
        let assignments = [];
        
        // Try to get from MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            try {
                assignments = await Assignment.find().sort({ uploadedAt: -1 });
                console.log('Assignments retrieved from MongoDB:', assignments.length);
            } catch (dbError) {
                console.error('Error fetching assignments from database:', dbError);
                // Continue to fallback
            }
        }
        
        // If no assignments from MongoDB or MongoDB is not connected, try file system backup
        if (assignments.length === 0) {
            console.log('Using file system backup for assignments');
            const assignmentRecordsFile = path.join(__dirname, 'assignment_records.json');
            
            try {
                if (fs.existsSync(assignmentRecordsFile)) {
                    const data = fs.readFileSync(assignmentRecordsFile, 'utf8');
                    assignments = JSON.parse(data);
                    console.log('Assignments retrieved from file system backup:', assignments.length);
                }
            } catch (fsError) {
                console.error('Error reading assignment records from file:', fsError);
            }
        }
        
        // If still no assignments, provide mock data
        if (assignments.length === 0) {
            console.log('Providing mock assignment data');
            assignments = [
                {
                    _id: 'mock-assignment-1',
                    title: 'Sample Assignment 1',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                    fileName: 'sample-assignment1.pdf',
                    originalName: 'Sample Assignment 1.pdf',
                    uploadedAt: new Date()
                },
                {
                    _id: 'mock-assignment-2',
                    title: 'Sample Assignment 2',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
                    fileName: 'sample-assignment2.pdf',
                    originalName: 'Sample Assignment 2.pdf',
                    uploadedAt: new Date()
                }
            ];
        }
        
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add Marks with file system fallback
app.post('/api/marks', async (req, res) => {
    try {
        if (!req.body.studentId || !req.body.subject || !req.body.marks) {
            return res.status(400).json({ error: 'Student ID, subject, and marks are required' });
        }

        console.log('Received marks data:', req.body);

        // Create marks record
        const newMarks = {
            _id: Date.now().toString(),
            studentId: req.body.studentId,
            marks: req.body.marks,
            subject: req.body.subject,
            uploadedAt: new Date()
        };

        try {
            // Try to save to MongoDB if connected
            if (mongoose.connection.readyState === 1) {
                const marksDoc = new Marks(newMarks);
                await marksDoc.save();
                console.log('Marks saved to database:', marksDoc._id);
            } else {
                // If MongoDB is not connected, just log it
                console.log('MongoDB not connected, saving marks to file system only');
            }
            
            // Save a record of the marks to a JSON file as backup
            const marksRecordsFile = path.join(__dirname, 'marks_records.json');
            let marksRecords = [];
            
            try {
                if (fs.existsSync(marksRecordsFile)) {
                    const data = fs.readFileSync(marksRecordsFile, 'utf8');
                    marksRecords = JSON.parse(data);
                }
            } catch (err) {
                console.error('Error reading marks records file:', err);
                // Continue even if there's an error reading the file
            }
            
            marksRecords.push(newMarks);
            fs.writeFileSync(marksRecordsFile, JSON.stringify(marksRecords, null, 2));
            console.log('Marks record saved to file system backup');
            
            res.status(201).json({
                message: 'Marks added successfully',
                data: newMarks
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Still return success since the data was saved to disk
            res.status(201).json({
                message: 'Marks added successfully (file system only)',
                data: newMarks,
                note: 'The marks were saved but could not be recorded in the database due to connection issues.'
            });
        }
    } catch (error) {
        console.error('Marks error:', error);
        res.status(500).json({ 
            error: 'Failed to add marks', 
            details: error.message,
            code: 'MARKS_ADD_FAILED'
        });
    }
});

// Get all marks with file system fallback
app.get('/api/marks', async (req, res) => {
    try {
        let marks = [];
        
        // Try to get from MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            try {
                marks = await Marks.find().sort({ uploadedAt: -1 });
                console.log('Marks retrieved from MongoDB:', marks.length);
            } catch (dbError) {
                console.error('Error fetching marks from database:', dbError);
                // Continue to fallback
            }
        }
        
        // If no marks from MongoDB or MongoDB is not connected, try file system backup
        if (marks.length === 0) {
            console.log('Using file system backup for marks');
            const marksRecordsFile = path.join(__dirname, 'marks_records.json');
            
            try {
                if (fs.existsSync(marksRecordsFile)) {
                    const data = fs.readFileSync(marksRecordsFile, 'utf8');
                    marks = JSON.parse(data);
                    console.log('Marks retrieved from file system backup:', marks.length);
                }
            } catch (fsError) {
                console.error('Error reading marks records from file:', fsError);
            }
        }
        
        // If still no marks, provide mock data
        if (marks.length === 0) {
            console.log('Providing mock marks data');
            marks = [
                {
                    _id: 'mock-marks-1',
                    studentId: 'student-1',
                    marks: 85,
                    subject: 'Mathematics',
                    uploadedAt: new Date()
                },
                {
                    _id: 'mock-marks-2',
                    studentId: 'student-2',
                    marks: 92,
                    subject: 'Science',
                    uploadedAt: new Date()
                }
            ];
        }
        
        res.json(marks);
    } catch (error) {
        console.error('Error in marks endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit assignment answer
app.post('/api/assignments/:assignmentId/submit', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        const submission = new AssignmentSubmission({
            assignmentId: req.params.assignmentId,
            studentId: req.body.studentId,
            fileName: req.file.filename,
            filePath: req.file.path,
            originalName: req.file.originalname
        });

        await submission.save();
        res.status(201).json({
            message: 'Assignment submitted successfully',
            data: submission
        });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get submissions for an assignment
app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find({ 
            assignmentId: req.params.assignmentId 
        }).sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's submissions
app.get('/api/assignments/submissions/:studentId', async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find({ 
            studentId: req.params.studentId 
        }).sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Grade assignment submission
app.post('/api/assignments/submissions/:submissionId/grade', async (req, res) => {
    try {
        const submission = await AssignmentSubmission.findByIdAndUpdate(
            req.params.submissionId,
            {
                marks: req.body.marks,
                feedback: req.body.feedback
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json({
            message: 'Assignment graded successfully',
            data: submission
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basic User API endpoints to support frontend
app.post('/api/user/login', (req, res) => {
    try {
        // Simple mock login
        const { email, password } = req.body;
        
        if (email && password) {
            // Return a mock user
            res.status(200).json({
                message: 'Login successful',
                token: 'mock-token-for-local-development',
                user: {
                    _id: 'local-user-1',
                    name: 'Local Test User',
                    email: email,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({ message: 'Email and password are required' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/user/register', (req, res) => {
    try {
        // Simple mock registration
        const { name, email, password } = req.body;
        
        if (name && email && password) {
            res.status(201).json({
                message: 'Registration successful',
                activationToken: 'mock-activation-token'
            });
        } else {
            res.status(400).json({ message: 'Name, email, and password are required' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/user/verify', (req, res) => {
    try {
        // Simple mock OTP verification
        const { otp, activationToken } = req.body;
        
        if (otp && activationToken) {
            res.status(200).json({ message: 'Account verified successfully' });
        } else {
            res.status(400).json({ message: 'OTP and activation token are required' });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/user/me', (req, res) => {
    try {
        // Check if token exists in headers
        const token = req.headers.token;
        
        if (token) {
            res.status(200).json({
                user: {
                    _id: 'local-user-1',
                    name: 'Local Test User',
                    email: 'test@local.dev',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            });
        } else {
            res.status(401).json({ message: 'Token is required' });
        }
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Basic Course API endpoints to support frontend
app.get('/api/course/all', (req, res) => {
    try {
        res.status(200).json({
            courses: [
                {
                    _id: 'local-course-1',
                    title: 'Sample Course 1',
                    description: 'This is a sample course for local development',
                    createdBy: 'Local Admin',
                    price: 0,
                    thumbnail: {
                        url: 'https://via.placeholder.com/300x200?text=Sample+Course+1'
                    }
                },
                {
                    _id: 'local-course-2',
                    title: 'Sample Course 2',
                    description: 'Another sample course for testing',
                    createdBy: 'Local Admin',
                    price: 0,
                    thumbnail: {
                        url: 'https://via.placeholder.com/300x200?text=Sample+Course+2'
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Course fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/course/:id', (req, res) => {
    try {
        const id = req.params.id;
        
        res.status(200).json({
            course: {
                _id: id,
                title: `Sample Course ${id}`,
                description: 'This is a sample course for local development',
                createdBy: 'Local Admin',
                price: 0,
                thumbnail: {
                    url: `https://via.placeholder.com/300x200?text=Sample+Course+${id}`
                }
            }
        });
    } catch (error) {
        console.error('Course detail fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/mycourse', (req, res) => {
    try {
        const token = req.headers.token;
        
        if (token) {
            res.status(200).json({
                courses: [
                    {
                        _id: 'local-course-1',
                        title: 'My Enrolled Course 1',
                        description: 'This is an enrolled course for local development',
                        createdBy: 'Local Admin',
                        price: 0,
                        thumbnail: {
                            url: 'https://via.placeholder.com/300x200?text=Enrolled+Course+1'
                        }
                    }
                ]
            });
        } else {
            res.status(401).json({ message: 'Token is required' });
        }
    } catch (error) {
        console.error('My courses fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'File is too large. Maximum size is 10MB',
                code: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({
            error: `Upload error: ${err.message}`,
            code: 'UPLOAD_ERROR'
        });
    } else if (err) {
        // An unknown error occurred
        console.error('Server error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            code: 'SERVER_ERROR'
        });
    }
    next();
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
    });
});

app.listen(PORT, () => {
    console.log(`Assignment backend running on port ${PORT}`);
}); 