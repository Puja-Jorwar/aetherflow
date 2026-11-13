const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/analyze', protect, upload.single('resume'), async (req, res, next) => {
  try {
    let text = req.body.text || '';
    let filename = 'Text Paste';

    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return next(new AppError('Please upload a PDF Resume', 400));
      }
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
      filename = req.file.originalname;
    }

    if (!text || text.length < 50) {
      return next(new AppError('Please provide sufficient resume text or upload a PDF', 400));
    }

    // Perform analysis
    const analysis = analyzeResumeText(text);

    return successResponse(res, 'Resume analyzed successfully', {
      filename,
      analysis
    });
  } catch (err) {
    next(err);
  }
});

const analyzeResumeText = (text) => {
  const lowercase = text.toLowerCase();
  
  // Look for skills
  const skillsList = [
    { name: 'React', found: lowercase.includes('react') },
    { name: 'Node.js', found: lowercase.includes('node') },
    { name: 'Express', found: lowercase.includes('express') },
    { name: 'MongoDB', found: lowercase.includes('mongodb') },
    { name: 'JavaScript', found: lowercase.includes('javascript') || lowercase.includes('js') },
    { name: 'Python', found: lowercase.includes('python') },
    { name: 'Git', found: lowercase.includes('git') },
    { name: 'Docker', found: lowercase.includes('docker') },
    { name: 'TypeScript', found: lowercase.includes('typescript') || lowercase.includes('ts') },
    { name: 'SQL', found: lowercase.includes('sql') }
  ];

  const identifiedSkills = skillsList.filter(s => s.found).map(s => s.name);
  const missingSkills = skillsList.filter(s => !s.found).map(s => s.name);

  // Simple ATS score calculation
  const foundCount = identifiedSkills.length;
  let score = 30 + (foundCount * 7); // Base score of 30 + 7 points per skill
  if (lowercase.includes('education') || lowercase.includes('degree')) score += 10;
  if (lowercase.includes('experience') || lowercase.includes('work')) score += 15;
  if (score > 100) score = 98; // Caps at 98 for realistic look!

  // Check formatting issues
  const recommendations = [];
  if (!lowercase.includes('summary') && !lowercase.includes('objective')) {
    recommendations.push('Add a professional summary at the top to highlight key achievements.');
  }
  if (missingSkills.length > 3) {
    recommendations.push(`Consider adding keywords for missing skills: ${missingSkills.slice(0, 3).join(', ')}.`);
  }
  if (!lowercase.includes('github') && !lowercase.includes('linkedin')) {
    recommendations.push('Include links to your GitHub and LinkedIn profiles in your header contact details.');
  }
  if (text.split(' ').length < 150) {
    recommendations.push('Your resume is thin. Expand your experience descriptions with bullet points outlining specific outcomes.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Resume formatting looks highly optimized! Ensure bullet points contain metric metrics (e.g., "Improved load speed by 30%").');
  }

  return {
    atsScore: score,
    skillsIdentified: identifiedSkills,
    skillsMissing: missingSkills,
    recommendations,
    atsStatus: score >= 80 ? 'Highly Match' : score >= 60 ? 'Needs Optimization' : 'Poor Match'
  };
};

module.exports = router;
