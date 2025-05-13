
---

## Image OCR to Excel for Accounting

This project automates the process of extracting text from images using Optical Character Recognition (OCR) and organizing the extracted data into structured Excel files. It aims to simplify accounting by enabling users to upload scanned invoices, receipts, or other documents and automatically process them into an Excel sheet.

---

### Features
- Upload images (e.g., invoices, receipts).
- Perform OCR using AI-based tools.
- Process and structure the extracted text into an Excel file using Pandas.
- Batch processing of multiple images.

---

### Technologies Used
- **Python**: The core programming language.
- **OCR Library**: [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) or alternatives like Google Cloud Vision API.
- **Excel Integration**: [Pandas](https://pandas.pydata.org/) to handle data processing and Excel file creation.

---

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/image-ocr-to-excel.git
   cd image-ocr-to-excel
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up Tesseract OCR:
   - Install Tesseract on your system ([Installation Guide](https://github.com/tesseract-ocr/tesseract)).
   - Ensure the `tesseract` command is in your PATH.

---

### Usage
1. Place images in the `input_images` directory.
2. Run the script:
   ```bash
   python main.py
   ```
3. Output Excel files will be saved in the `output_excel` directory.

---

### Directory Structure
```
image-ocr-to-excel/
├── input_images/         # Directory to store input images.
├── output_excel/         # Directory to store output Excel files.
├── src/                  # Source code for the project.
│   ├── ocr.py            # Module for OCR processing.
│   ├── excel.py          # Module for creating Excel files.
│   ├── utils.py          # Utility functions for the project.
│   └── main.py           # Entry point for the application.
├── tests/                # Unit tests for the project.
│   ├── test_ocr.py
│   ├── test_excel.py
│   └── test_utils.py
├── requirements.txt      # Python dependencies.
└── README.md             # Project documentation.
```

---

### Future Enhancements
- Add a web interface for uploading images and downloading Excel files.
- Support for additional OCR languages.
- Data validation and error handling for extracted text.
- Integration with cloud storage services like Google Drive or Dropbox.

---

### License
This project is licensed under the [MIT License](LICENSE.txt).

---

### Contribution
Contributions are welcome! Feel free to open issues or submit pull requests.

---

### Contact
If you have any questions or suggestions, feel free to reach out at `agungwah900@gmail.com`.