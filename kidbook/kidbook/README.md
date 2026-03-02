# 📚 KidBook Creator

A children's book creator app designed for low-tech users (60+). Create, illustrate, and export print-ready PDFs directly to Amazon KDP.

---

## Features

- ✅ Choose Amazon KDP trim sizes (8.5×8.5, 8×10, 8.5×11)
- ✅ Add, reorder, and delete pages from a visual sidebar
- ✅ Upload images (JPG/PNG) and drag/resize them with corner handles
- ✅ Lock images to prevent accidental movement
- ✅ Double-click to edit text inline on any page
- ✅ Control font size, color, alignment, and position
- ✅ Visual bleed border and safe-margin guides
- ✅ Full-screen book preview mode
- ✅ Export print-ready PDF with proper bleed (0.125") and margins (0.5")
- ✅ Auto-save to browser localStorage

---

## Install & Run

```bash
# Clone or unzip the project, then:
cd kidbook
npm install
npm start
```

Open: http://localhost:3000

---

## Build for Production

```bash
npm run build
```

Output goes to `./build/` folder.

---

## Deploy to Vercel (Free)

1. Install Vercel CLI: `npm install -g vercel`
2. From the project folder: `vercel`
3. Follow the prompts — it auto-detects Create React App
4. Your app will be live at `https://your-app.vercel.app`

**Or use the Vercel web dashboard:**
1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import from GitHub
3. Vercel auto-detects all settings — just click Deploy

---

## Amazon KDP PDF Specs

The exported PDF matches KDP requirements:
- **Bleed**: 0.125" on all sides
- **Margin/safe zone**: 0.5" from trim edge
- **Units**: Inches, embedded at 72pt (layout) with image data preserved at upload resolution
- **Format**: PDF/A compatible via jsPDF

> **Tip**: Use 300 DPI images when uploading for best print quality. The app preserves your original image data in the PDF.

---

## File Structure

```
kidbook/
├── public/
│   └── index.html
├── src/
│   ├── store/
│   │   └── useBookStore.js       # All state + localStorage autosave
│   ├── components/
│   │   ├── PageCanvas.js         # Main editor: images, text, drag/resize
│   │   ├── PageStrip.js          # Left sidebar page thumbnails
│   │   └── PreviewMode.js        # Full-screen book preview
│   ├── utils/
│   │   └── exportPDF.js          # jsPDF export with bleed + margins
│   ├── App.js                    # Top bar, layout, settings
│   └── index.js
├── package.json
├── vercel.json
└── README.md
```

---

## Usage Guide (For Mom 💛)

1. **Start**: The app opens with one blank page
2. **Add a picture**: Click "🖼️ Add Picture" and choose a photo from your computer
3. **Move a picture**: Click it and drag it anywhere on the page
4. **Resize a picture**: Click it and drag the blue circles at the corners
5. **Lock a picture**: Click it, then click 🔒 so it won't move by accident
6. **Add text**: Double-tap anywhere in the middle of the page to type your story
7. **New page**: Click "+ Page" in the left panel
8. **Preview**: Click "👁 Preview Book" to see your book like a reader would
9. **Export**: Click "📥 Export to PDF" to download your print-ready file
10. **Upload to KDP**: Go to kdp.amazon.com → Create New Title → Paperback → Upload your PDF
