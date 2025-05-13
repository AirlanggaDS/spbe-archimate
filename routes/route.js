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
router.post('/archimate-structured', upload.single('file'), archiController.archimateStructured);
router.post('/upload', upload.single('file'), archiController.generateDiagram);

module.exports = router;

