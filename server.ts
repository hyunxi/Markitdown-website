import express from "express";
import path from "path";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

dotenv.config();

const app = express();
const PORT = 3000;

// Setup multer for memory storage - accepts multiple files up to 25MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// Configure Express parser for JSON and URL-encoded bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Google GenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper to estimate token counts based on a general heuristic (1 token ~ 4 characters / 0.75 words)
function estimateTokens(text: string): number {
  if (!text) return 0;
  // standard heuristic: characters / 3.9
  return Math.ceil(text.length / 3.9);
}

// Convert spreadsheets (XLSX, XLS, CSV) into clean CSV string representation
function parseExcelToText(buffer: Buffer): { text: string; detail: string } {
  try {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    let resultText = "";
    const sheetDetails: string[] = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      // Convert to clean CSV
      const csv = xlsx.utils.sheet_to_csv(worksheet, { blankrows: false });
      if (csv.trim()) {
        resultText += `\n\n--- Sheet: ${sheetName} ---\n${csv}`;
        sheetDetails.push(sheetName);
      }
    });

    return {
      text: resultText.trim(),
      detail: `Sheets found: ${sheetDetails.join(", ")}`,
    };
  } catch (error: any) {
    console.error("Error parsing Excel:", error);
    return { text: "", detail: `Excel parse failed: ${error.message}` };
  }
}

// API endpoint to check backend health
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Main endpoint to convert document to markdown
app.post("/api/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const {
      stripHeadersFooters = "true",
      optimizeTokens = "true",
      formatTables = "true",
      preserveImages = "true",
      customGuidelines = "",
    } = req.body;

    const file = req.file;
    const filename = file.originalname;
    const mimeType = file.mimetype;
    const extension = path.extname(filename).toLowerCase();

    let extractedText = "";
    let systemInstructions = `You are an expert document parser and technical writer. Your primary job is to convert document source contents into high-quality, pristine Markdown (.md) that is dense, extremely clean, and optimized for input into LLMs (Large Language Models) to save credits/tokens.

When converting, follow these instructions:
1. Output ONLY valid Markdown. Do not wrap the response in a container markdown block like \`\`\`markdown ... \`\`\`. Start directly with the converted content.
2. Structure the document logically using clear Markdown headings (#, ##, etc.).
3. Clean layout issues: Join words hyphenated at line breaks, fix corrupted text characters, and align paragraphs.
${stripHeadersFooters === "true" ? "4. Remove redundant boilerplate, repeated page headers/footers, running headers, and page numbers.\n" : ""}
${optimizeTokens === "true" ? "5. Maintain high-density text. Condense large blank spacing, merge redundant empty lines, and remove repetitive navigation bars or empty sidebars.\n" : ""}
${formatTables === "true" ? "6. Convert visual tables, grid lines, and data sheets into clean GitHub Flavored Markdown (GFM) pipe tables.\n" : ""}
${preserveImages === "true" ? "7. If the document includes descriptions or layouts of images, diagrams, or figures, transcribe them or summarize their content clearly in markdown block quotes.\n" : ""}
8. Maintain important original semantic detail, such as bold, italics, links, and lists.
${customGuidelines ? `9. Follow these custom guidelines specified by the user:\n${customGuidelines}\n` : ""}`;

    let base64Data = "";
    let isDirectPrompt = false;

    // Determine how to parse based on file extension / MIME type
    if (extension === ".pdf" || mimeType === "application/pdf") {
      // Gemini can parse PDF files natively! We can send PDFs directly to Gemini 3.5 Flash
      // For large PDFs, we also have pdf-parse text extraction as a fallback, but native PDF is much higher quality.
      if (file.buffer.length < 15 * 1024 * 1024) { // Under 15MB
        base64Data = file.buffer.toString("base64");
        isDirectPrompt = true;
      } else {
        // Fallback to local text extraction for large PDFs to avoid payload size limits
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      }
    } else if (
      extension === ".docx" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Use mammoth to extract Word documents as clean HTML (maintaining list structures and bold/italics)
      const result = await mammoth.convertToHtml({ buffer: file.buffer });
      extractedText = result.value; // Extracted HTML
    } else if (
      extension === ".xlsx" ||
      extension === ".xls" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      // Use xlsx to parse Excel sheets
      const parseResult = parseExcelToText(file.buffer);
      extractedText = parseResult.text;
    } else if (
      ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mimeType) ||
      [".png", ".jpg", ".jpeg", ".webp"].includes(extension)
    ) {
      // Images can be sent directly to Gemini for OCR and formatting
      base64Data = file.buffer.toString("base64");
      isDirectPrompt = true;
    } else {
      // Fallback for TXT, CSV, HTML, JSON, MD, etc. (read as text)
      extractedText = file.buffer.toString("utf8");
    }

    // Call Gemini API
    const ai = getAIClient();
    let resultMarkdown = "";

    if (isDirectPrompt) {
      // Direct multimodal input
      const filePart = {
        inlineData: {
          mimeType: mimeType === "application/pdf" ? "application/pdf" : mimeType,
          data: base64Data,
        },
      };

      const promptPart = {
        text: "Please convert this entire document to high-quality Markdown optimized for LLMs. Follow the system instructions precisely.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [filePart, promptPart] },
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.2,
        },
      });

      resultMarkdown = response.text || "";
    } else {
      // Text-based input (extracted text from docx, xlsx, plain text, or large PDFs)
      if (!extractedText.trim()) {
        return res.status(400).json({ error: "No readable text content could be extracted from this document." });
      }

      // Limit extracted text to stay within sensible model input limits (approx 150k words)
      const textSample = extractedText.length > 500000 
        ? extractedText.slice(0, 500000) + "\n\n[Content truncated due to size limits...]"
        : extractedText;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Here is the raw extracted text/HTML of the document "${filename}":\n\n${textSample}\n\nConvert this to high-quality, optimized Markdown according to the rules.`,
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.1,
        },
      });

      resultMarkdown = response.text || "";
    }

    // Post-process response to remove surrounding code block if model outputted it despite instructions
    let cleanMarkdown = resultMarkdown.trim();
    if (cleanMarkdown.startsWith("```markdown")) {
      cleanMarkdown = cleanMarkdown.replace(/^```markdown\n/, "").replace(/\n```$/, "");
    } else if (cleanMarkdown.startsWith("```") && cleanMarkdown.endsWith("```")) {
      cleanMarkdown = cleanMarkdown.replace(/^```\w*\n/, "").replace(/\n```$/, "");
    }

    // Calculate details and token saving statistics
    const originalTextSize = extractedText ? extractedText.length : (file.size * 0.5); // fallback estimate
    const originalTokens = estimateTokens(extractedText || file.buffer.toString("utf8", 0, 50000));
    const convertedTokens = estimateTokens(cleanMarkdown);
    const tokenSaving = Math.max(0, originalTokens - convertedTokens);
    const tokenSavingPercent = originalTokens > 0 ? Math.round((tokenSaving / originalTokens) * 100) : 0;

    res.json({
      success: true,
      filename: filename,
      originalSize: file.size,
      mimeType: mimeType,
      markdown: cleanMarkdown,
      stats: {
        originalTokens,
        convertedTokens,
        tokenSaving,
        tokenSavingPercent,
      },
    });

  } catch (error: any) {
    console.error("Error in /api/convert:", error);
    res.status(500).json({
      error: "Conversion failed. Please try again or check the API key settings.",
      details: error.message,
    });
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback route
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
