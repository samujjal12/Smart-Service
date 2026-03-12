const express = require('express');
const router = express.Router();
const { generateAttendanceReport } = require('../utils/pdfGenerator');

router.post('/generate', async (req, res) => {
  const { student, summary, records } = req.body;

  if (!student || !student.enrollmentId) {
    return res.status(400).json({ error: 'Missing or invalid student payload' });
  }

  try {
    const pdfBuffer = await generateAttendanceReport(student, summary || { present: 0, absent: 0, pending: 0 }, records || []);
    
    // Send as file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${student.enrollmentId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;

