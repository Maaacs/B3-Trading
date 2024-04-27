import { IncomingForm } from 'formidable';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'public', 'uploads'); // Garantindo que o caminho está correto
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable Error:', err);
      return res.status(500).json({ error: 'Error parsing the form data.' });
    }

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    try {
      let workbook = XLSX.utils.book_new();

      Object.values(files).forEach((file) => {
        if (!file.filepath || !fs.existsSync(file.filepath)) {
          console.error('File path does not exist:', file.filepath);
          return; // Skipping this file
        }

        const sheet = XLSX.readFile(file.filepath);
        XLSX.utils.book_append_sheet(workbook, sheet.Sheets[sheet.SheetNames[0]], path.basename(file.filepath));
      });

      // Save the new workbook to a temporary location
      const mergedPath = path.join(form.uploadDir, 'merged.xlsx');
      XLSX.writeFile(workbook, mergedPath);

      // Set up direct download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(mergedPath)}`);
      fs.createReadStream(mergedPath).pipe(res);
    } catch (error) {
      console.error('Error merging sheets:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });
}
