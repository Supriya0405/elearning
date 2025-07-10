const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/elearning', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original filename but make it unique with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// File filter to accept only PDFs
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
    title: String,
    dueDate: Date,
    fileName: String,
    filePath: String,
    originalName: String,
    uploadedAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

// Routes
app.post('/api/assignments', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file' });
        }

        const newAssignment = new Assignment({
            title: req.body.title || 'Untitled Assignment',
            dueDate: req.body.dueDate,
            fileName: req.file.filename,
            filePath: req.file.path,
            originalName: req.file.originalname
        });

        await newAssignment.save();
        res.status(201).json({ 
            message: 'Assignment uploaded successfully', 
            data: newAssignment 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assignments', async (req, res) => {
    try {
        const assignments = await Assignment.find().sort({ uploadedAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete assignment
app.delete('/api/assignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Delete file from uploads folder
        if (assignment.filePath) {
            fs.unlink(assignment.filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 