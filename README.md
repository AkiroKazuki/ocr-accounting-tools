# 🖼️ OCR Grading Form Extractor

A web application that extracts text from grading form images using Google's Gemini AI and automatically sends scores to Google Sheets.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Vite](https://img.shields.io/badge/Vite-6.x-purple) ![Gemini AI](https://img.shields.io/badge/Gemini-AI-green)

## ✨ Features

### Core Features
- **📷 Multi-Image Batch Upload** - Upload multiple grading form images at once
- **🔍 OCR Text Extraction** - Uses Gemini AI to extract text from images
- **📊 CSV Data Formatting** - Automatically formats extracted data as CSV
- **📥 Excel Export** - Download data as transposed Excel file with proper formatting

### Google Sheets Integration
- **🔗 Auto-fill to Sheets** - Send scores directly to your Google Spreadsheet
- **👥 Multi-Juri Support** - Separate Juri1, Juri2, Juri3 sheet buttons
- **🎯 Smart Row Matching** - Finds correct row by Kode Peserta automatically

### User Experience
- **🖱️ Drag & Drop** - Easy image upload with drag-and-drop support
- **📈 Batch Progress** - Visual progress indicator for multi-image processing
- **✅ Per-Image Actions** - Each processed image has its own Juri buttons

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini API (`gemini-2.5-flash-preview`)
- **Excel Export**: SheetJS (xlsx)
- **Sheets Integration**: Google Apps Script

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/AkiroKazuki/ocr-accounting-tools.git
cd ocr-accounting-tools
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL_NAME=models/gemini-2.5-flash-preview-05-20
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 📋 Google Sheets Setup (Optional)

To enable automatic score entry to Google Sheets:

### 1. Open Apps Script Editor
In your Google Spreadsheet: **Extensions → Apps Script**

### 2. Paste This Code

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { sheetName, kodePeserta, scores } = data;
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: `Sheet "${sheetName}" not found` 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find row by Kode Peserta (Column A)
    const dataRange = sheet.getRange('A:A').getValues();
    let rowNumber = -1;
    
    for (let i = 0; i < dataRange.length; i++) {
      if (dataRange[i][0] && dataRange[i][0].toString().toUpperCase() === kodePeserta.toUpperCase()) {
        rowNumber = i + 1;
        break;
      }
    }
    
    if (rowNumber === -1) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: `Kode Peserta "${kodePeserta}" not found in ${sheetName}` 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Write scores to columns E-I
    const scoreRange = sheet.getRange(rowNumber, 5, 1, scores.length);
    scoreRange.setValues([scores.map(s => Number(s) || s)]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: `Scores for ${kodePeserta} saved to ${sheetName} (row ${rowNumber})!` 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. Deploy as Web App
1. Click **Deploy → New deployment**
2. Select **Web app**
3. Set "Who has access" to **Anyone**
4. Click **Deploy** and copy the URL
5. Add URL to your `.env` as `VITE_APPS_SCRIPT_URL`

## 📖 How to Use

1. **Upload Images** - Click or drag-drop one or multiple grading form images
2. **Extract Text** - Click "Extract & Organize Text" (or "Extract All" for batch)
3. **Review Results** - Check extracted Kode Peserta and scores
4. **Export Data**:
   - Click **Copy CSV** to copy to clipboard
   - Click **Excel** to download as .xlsx file
   - Click **Juri 1/2/3** to send scores to Google Sheets

## 📁 Project Structure

```
├── src/
│   ├── app.tsx                 # Main application component
│   ├── components/
│   │   ├── ImageUploader.tsx   # Multi-image upload component
│   │   ├── DataTable.tsx       # CSV data table display
│   │   ├── AlertMessage.tsx    # Error/success messages
│   │   └── LoadingIcon.tsx     # Loading spinner
│   ├── services/
│   │   ├── geminiServices.ts   # Gemini API integration
│   │   └── googleSheetsService.ts  # Apps Script integration
│   ├── utils/
│   │   └── imageUtils.ts       # Image file utilities
│   └── constants.ts            # App constants
├── .env.example                # Environment template
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the [MIT License](LICENSE.txt).

## 📧 Contact

**AkiroKazuki** - agungwah900@gmail.com

- GitHub: [@AkiroKazuki](https://github.com/AkiroKazuki)
- Instagram: [@akiro_kazuki](https://www.instagram.com/akiro_kazuki/)
