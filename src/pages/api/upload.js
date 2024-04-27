import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.uploadDir = "./public/uploads";
    form.keepExtensions = true;
    await fs.mkdir(form.uploadDir, { recursive: true });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ files });
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
