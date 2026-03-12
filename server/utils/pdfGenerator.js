/**
 * utils/pdfGenerator.js
 * Generates an attendance PDF report using pdfkit.
 */
const PDFDocument = require('pdfkit');

function generateAttendanceReport(studentInfo, summary, attendanceRecords) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 1. Header
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();

      // 2. Student Details
      doc.fontSize(12).font('Helvetica-Bold').text('Student Details:');
      doc.font('Helvetica').text(`Name: ${studentInfo.name}`);
      doc.text(`Enrollment ID: ${studentInfo.enrollmentId}`);
      doc.text(`Batch: ${studentInfo.batch || 'N/A'}`);
      doc.moveDown();

      // 3. Attendance Summary
      doc.font('Helvetica-Bold').text('Attendance Summary:');
      doc.font('Helvetica').text(`Days Present: ${summary.present}`);
      doc.text(`Days Absent: ${summary.absent}`);
      doc.text(`Pending Records: ${summary.pending}`);
      doc.moveDown();

      // 4. Attendance Table Header
      doc.font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Date', 50, tableTop);
      doc.text('Status', 200, tableTop);
      
      // Draw Line
      doc.moveTo(50, tableTop + 15).lineTo(400, tableTop + 15).stroke();
      doc.moveDown(0.5);

      // 5. Table Rows
      doc.font('Helvetica');
      let currentY = doc.y;
      
      attendanceRecords.forEach(record => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.text(record.date, 50, currentY);
        doc.text(record.status, 200, currentY);
        currentY += 15;
      });

      // 6. Footer
      doc.moveDown(2);
      doc.fontSize(10).fillColor('gray').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateAttendanceReport };
