const express = require('express');
const multer = require('multer');
const path = require('path');
const archiController = require('../controllers/archimateController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  res.render('index', { umlCode: null, encodedUml: null });
});

router.get('/download', (req, res) => {
  const filePath = path.join(__dirname, '..', 'storage', 'Template Metadata SPBE.xlsx');
  res.download(filePath, 'Template Metadata SPBE.xlsx', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Terjadi kesalahan saat mengunduh file.');
    }
  });
});

router.get('/diagram/:slug', archiController.renderDiagramFromSlug);

router.post('/archimate-structured', upload.single('file'), archiController.archimateStructured);
router.post('/upload', upload.single('file'), archiController.generateDiagram);

module.exports = router;

