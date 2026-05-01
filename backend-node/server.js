console.log("Server starting...");
const express = require("express");
const multer  = require("multer");
const axios   = require("axios");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

// Optional: for PDF and DOCX parsing
// Run: npm install pdf-parse mammoth
let pdfParse, mammoth;
try { pdfParse = require("pdf-parse"); } catch(e) { console.log("pdf-parse not installed, PDF support disabled"); }
try { mammoth  = require("mammoth");  } catch(e) { console.log("mammoth not installed, DOCX support disabled"); }

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = [".txt", ".pdf", ".doc", ".docx"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error("Only .txt, .pdf, .doc, .docx files are allowed"));
    }
});

// ── Helper: extract text from any supported file ──
async function extractText(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();

    if (ext === ".txt") {
        return fs.readFileSync(filePath, "utf-8");
    }

    if (ext === ".pdf") {
        if (!pdfParse) throw new Error("PDF support not installed. Run: npm install pdf-parse");
        const buffer = fs.readFileSync(filePath);
        const data   = await pdfParse(buffer);
        return data.text;
    }

    if (ext === ".docx" || ext === ".doc") {
        if (!mammoth) throw new Error("DOCX support not installed. Run: npm install mammoth");
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }

    throw new Error("Unsupported file type");
}

// ── Main route ──
app.post("/analyze", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const tempPath = req.file.path;

    try {
        const fileContent = await extractText(tempPath, req.file.originalname);

        if (!fileContent || fileContent.trim().length < 20) {
            return res.status(400).json({ error: "File appears to be empty or unreadable" });
        }

        const response = await axios.post("http://127.0.0.1:5000/analyze", {
            text: fileContent
        }, { timeout: 15000 });

        res.json(response.data);

    } catch (err) {
        console.error("ERROR:", err.message);

        if (err.code === "ECONNREFUSED") {
            res.status(503).json({ error: "Python ML service is not running. Start it with: python app.py" });
        } else {
            res.status(500).json({ error: err.message || "Something went wrong" });
        }

    } finally {
        // Always clean up temp file
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
});

// ── Health check ──
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Node server is running" });
});

// ── Multer error handler ──
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        res.status(400).json({ error: err.message });
    } else {
        next(err);
    }
});

console.log("About to listen...");
app.listen(3000, () => {
    console.log("✅ Node server running on http://localhost:3000");
});