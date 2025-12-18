import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ImageUploader } from './components/ImageUploader.tsx';
import { DataTable } from './components/DataTable.tsx';
import { LoadingIcon } from './components/LoadingIcon.tsx';
import { AlertMessage } from './components/AlertMessage.tsx';
import { extractTextFromImageWithGemini } from './services/geminiServices.ts';
import { sendScoresToJuriSheet } from './services/googleSheetsService.ts';
import { convertFileToBase64 } from './utils/imageUtils.ts';
import { GEMINI_MODEL_NAME } from './constants.ts';

// Icons
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
     </svg>
);

const ProcessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
     </svg>
);

const ClearIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0L12 14.25m2.25-2.25L14.25 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
     </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
     </svg>
);

const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
     </svg>
);



const App: React.FC = () => {
     // Original single-image state (for current image processing)
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
     const [base64Image, setBase64Image] = useState<string | null>(null);
     const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
     const [extractedText, setExtractedText] = useState<string | null>(null);
     const [organizedData, setOrganizedData] = useState<string[][] | null>(null);
     const [isLoading, setIsLoading] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
     const [kodePeserta, setKodePeserta] = useState<string | null>(null);
     const [extractedScores, setExtractedScores] = useState<string[] | null>(null);
     const [sheetsMessage, setSheetsMessage] = useState<string | null>(null);
     const [isSendingToSheets, setIsSendingToSheets] = useState<boolean>(false);

     // Multi-image batch state
     interface ProcessedImage {
          id: string;
          file: File;
          previewUrl: string;
          extractedText: string | null;
          organizedData: string[][] | null;
          kodePeserta: string | null;
          extractedScores: string[] | null;
          error: string | null;
          sheetsMessage: string | null;
          isSendingToSheets: boolean;
     }
     const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
     const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
     const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

     useEffect(() => {
          if (typeof import.meta.env.VITE_GEMINI_API_KEY !== 'string' || import.meta.env.VITE_GEMINI_API_KEY === '') {
               console.warn("API_KEY environment variable not detected or empty. Gemini API calls may fail.");
               // setApiKeyMissing(true); // Let geminiService handle actual error for calls
          }
     }, []);


     // Handle multiple file selection
     const handleFileSelect = useCallback(async (files: File[]) => {
          // Clear previous results
          setError(null);
          setExtractedText(null);
          setOrganizedData(null);
          setProcessedImages([]);

          if (files.length === 0) {
               setSelectedFile(null);
               setBase64Image(null);
               setImagePreviewUrl(null);
               return;
          }

          // For single file, use original flow
          if (files.length === 1) {
               const file = files[0];
               setSelectedFile(file);
               try {
                    const b64 = await convertFileToBase64(file);
                    setBase64Image(b64);
                    setImagePreviewUrl(URL.createObjectURL(file));
               } catch (err) {
                    setError('Failed to read image file. Please try another image.');
                    setBase64Image(null);
                    setImagePreviewUrl(null);
                    console.error(err);
               }
               return;
          }

          // For multiple files, set up batch processing
          setSelectedFile(files[0]); // Show first file as preview
          setImagePreviewUrl(URL.createObjectURL(files[0]));
          setBatchProgress({ current: 0, total: files.length });

          // Store files for batch processing
          const initialProcessedImages: ProcessedImage[] = files.map((file, index) => ({
               id: `img-${Date.now()}-${index}`,
               file,
               previewUrl: URL.createObjectURL(file),
               extractedText: null,
               organizedData: null,
               kodePeserta: null,
               extractedScores: null,
               error: null,
               sheetsMessage: null,
               isSendingToSheets: false,
          }));
          setProcessedImages(initialProcessedImages);
     }, []);

     const processImage = useCallback(async () => {
          if (!base64Image || !selectedFile) {
               setError('Please select an image first.');
               return;
          }

          // This check is a bit redundant if geminiService throws, but can provide early UI feedback.
          // However, per instructions, we avoid direct process.env manipulation/UI for key.
          // The service layer handles the missing key error properly.
          // if (apiKeyMissing) { 
          //     setError('Gemini API Key is not configured. Please ensure the API_KEY environment variable is set.');
          //     return;
          // }

          setIsLoading(true);
          setError(null);
          setExtractedText(null);
          setOrganizedData(null);

          const prompt = `Extract all text from this image. The image contains a grading form with:
1. Metadata section at the top with fields like: Judul Penelitian, Nama Ketua Kelompok, Kode Peserta, Asal Sekolah
2. A scoring table with columns: NO, Kriteria Penilaian, Bobot, Nilai (0-100)

Format your response as CSV with the following structure:
- First line: METADATA header
- Lines 2-5: Metadata values in format "field_name,value" (extract: Kode Peserta, Judul Penelitian, Nama Ketua Kelompok, Asal Sekolah)
- Line 6: Empty line
- Line 7: TABLE header (NO,Kriteria Penilaian,Bobot,Nilai)
- Remaining lines: Table data rows

Example output format:
METADATA
Kode Peserta,IPTR08
Judul Penelitian,Some Title
Nama Ketua Kelompok,Some Name
Asal Sekolah,SMP Example

NO,Kriteria Penilaian,Bobot,Nilai (0-100)
1,Korelasi Ide dan Kekomunikatifan,(30%),100
2,Media Presentasi,(20%),80
...

Output ONLY the CSV. No markdown fences or explanations.`;

          try {
               const resultText = await extractTextFromImageWithGemini(base64Image, selectedFile.type, prompt);
               setExtractedText(resultText);
               if (resultText) {
                    const rows = resultText.trim().split('\n');
                    const dataTable = rows.map(row => {
                         return row.split(',');
                    });
                    setOrganizedData(dataTable);

                    // Extract Kode Peserta from metadata section
                    let foundKodePeserta: string | null = null;
                    const scores: string[] = [];

                    for (let i = 0; i < rows.length; i++) {
                         const row = rows[i].toLowerCase();
                         if (row.includes('kode peserta')) {
                              const parts = rows[i].split(',');
                              if (parts.length >= 2) {
                                   foundKodePeserta = parts[1].trim();
                              }
                         }
                    }

                    // Extract scores from the table section (look for numeric values in last column)
                    let inTableSection = false;
                    for (let i = 0; i < rows.length; i++) {
                         const row = rows[i].toLowerCase();
                         if (row.includes('kriteria') && row.includes('nilai')) {
                              inTableSection = true;
                              continue;
                         }
                         if (inTableSection) {
                              const parts = rows[i].split(',');
                              if (parts.length >= 4) {
                                   const nilai = parts[parts.length - 1].trim();
                                   // Check if it's a number
                                   if (nilai && !isNaN(Number(nilai))) {
                                        scores.push(nilai);
                                   }
                              }
                         }
                    }

                    setKodePeserta(foundKodePeserta);
                    setExtractedScores(scores.length > 0 ? scores : null);
                    setSheetsMessage(null);

                    console.log('Extracted Kode Peserta:', foundKodePeserta);
                    console.log('Extracted Scores:', scores);
               } else {
                    setOrganizedData([]);
                    setKodePeserta(null);
                    setExtractedScores(null);
                    setError("No text was extracted, or the response was empty.");
               }
          } catch (err: any) {
               console.error('Error processing image with Gemini:', err);
               if (err.message && err.message.includes('API Key is not configured')) {
                    setError('Error: API Key is not configured. Please ensure the API_KEY environment variable is set.');
                    setApiKeyMissing(true);
               } else if (err.message && err.message.includes('Invalid Gemini API Key')) {
                    setError('Error: Invalid Gemini API Key. Please check your configuration.');
                    setApiKeyMissing(true);
               } else if (err.message && err.message.toLowerCase().includes('quota')) {
                    setError('Error: Gemini API quota exceeded. Please check your quota or try again later.');
               }
               else {
                    setError(`Failed to extract text: ${err.message || 'Unknown error'}`);
               }
               setOrganizedData(null);
               setKodePeserta(null);
               setExtractedScores(null);
          } finally {
               setIsLoading(false);
          }
     }, [base64Image, selectedFile]);

     const handleClear = () => {
          setSelectedFile(null);
          setBase64Image(null);
          setImagePreviewUrl(null);
          setExtractedText(null);
          setOrganizedData(null);
          setError(null);
          setIsLoading(false);
          setApiKeyMissing(false);
          setKodePeserta(null);
          setExtractedScores(null);
          setSheetsMessage(null);
          setIsSendingToSheets(false);
          // Clear batch state
          setProcessedImages([]);
          setIsProcessingBatch(false);
          setBatchProgress({ current: 0, total: 0 });
          const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
     };

     // Process all images in batch
     const processBatch = useCallback(async () => {
          if (processedImages.length === 0) {
               // Single image mode - use original processImage
               processImage();
               return;
          }

          setIsProcessingBatch(true);
          setError(null);

          const prompt = `Extract all text from this image. The image contains a grading form with:
1. Metadata section at the top with fields like: Judul Penelitian, Nama Ketua Kelompok, Kode Peserta, Asal Sekolah
2. A scoring table with columns: NO, Kriteria Penilaian, Bobot, Nilai (0-100)

Format your response as CSV with the following structure:
- First line: METADATA header
- Lines 2-5: Metadata values in format "field_name,value" (extract: Kode Peserta, Judul Penelitian, Nama Ketua Kelompok, Asal Sekolah)
- Line 6: Empty line
- Line 7: TABLE header (NO,Kriteria Penilaian,Bobot,Nilai)
- Remaining lines: Table data rows

Example output format:
METADATA
Kode Peserta,IPTR08
Judul Penelitian,Some Title
Nama Ketua Kelompok,Some Name
Asal Sekolah,SMP Example

NO,Kriteria Penilaian,Bobot,Nilai (0-100)
1,Korelasi Ide dan Kekomunikatifan,(30%),100
2,Media Presentasi,(20%),80
...

Output ONLY the CSV. No markdown fences or explanations.`;

          for (let i = 0; i < processedImages.length; i++) {
               setBatchProgress({ current: i + 1, total: processedImages.length });
               const img = processedImages[i];

               try {
                    const b64 = await convertFileToBase64(img.file);
                    const resultText = await extractTextFromImageWithGemini(b64, img.file.type, prompt);

                    // Parse results
                    let foundKodePeserta: string | null = null;
                    const scores: string[] = [];
                    let organizedData: string[][] | null = null;

                    if (resultText) {
                         const rows = resultText.trim().split('\n');
                         organizedData = rows.map(row => row.split(','));

                         for (const row of rows) {
                              if (row.toLowerCase().includes('kode peserta')) {
                                   const parts = row.split(',');
                                   if (parts.length >= 2) {
                                        foundKodePeserta = parts[1].trim();
                                   }
                              }
                         }

                         let inTableSection = false;
                         for (const row of rows) {
                              if (row.toLowerCase().includes('kriteria') && row.toLowerCase().includes('nilai')) {
                                   inTableSection = true;
                                   continue;
                              }
                              if (inTableSection) {
                                   const parts = row.split(',');
                                   if (parts.length >= 4) {
                                        const nilai = parts[parts.length - 1].trim();
                                        if (nilai && !isNaN(Number(nilai))) {
                                             scores.push(nilai);
                                        }
                                   }
                              }
                         }
                    }

                    setProcessedImages(prev => prev.map((p, idx) =>
                         idx === i ? {
                              ...p,
                              extractedText: resultText,
                              organizedData,
                              kodePeserta: foundKodePeserta,
                              extractedScores: scores.length > 0 ? scores : null,
                              error: null,
                         } : p
                    ));
               } catch (err: any) {
                    setProcessedImages(prev => prev.map((p, idx) =>
                         idx === i ? { ...p, error: err.message || 'Failed to process' } : p
                    ));
               }
          }

          setIsProcessingBatch(false);
     }, [processedImages, processImage]);

     // Handler to send scores to a Juri sheet for a specific processed image
     const handleSendToJuriForImage = async (imageId: string, juriSheet: 'Juri1' | 'Juri2' | 'Juri3') => {
          const img = processedImages.find(p => p.id === imageId);
          if (!img || !img.kodePeserta || !img.extractedScores) return;

          setProcessedImages(prev => prev.map(p =>
               p.id === imageId ? { ...p, isSendingToSheets: true, sheetsMessage: null } : p
          ));

          try {
               const message = await sendScoresToJuriSheet(juriSheet, img.kodePeserta, img.extractedScores);
               setProcessedImages(prev => prev.map(p =>
                    p.id === imageId ? { ...p, isSendingToSheets: false, sheetsMessage: message } : p
               ));
          } catch (err: any) {
               setProcessedImages(prev => prev.map(p =>
                    p.id === imageId ? { ...p, isSendingToSheets: false, error: err.message } : p
               ));
          }
     };

     // Handler to send scores to a Juri sheet
     const handleSendToJuri = async (juriSheet: 'Juri1' | 'Juri2' | 'Juri3') => {
          if (!kodePeserta) {
               setError('Kode Peserta tidak ditemukan. Pastikan form memiliki Kode Peserta.');
               return;
          }
          if (!extractedScores || extractedScores.length === 0) {
               setError('Nilai tidak ditemukan. Pastikan form memiliki nilai yang dapat dibaca.');
               return;
          }

          setIsSendingToSheets(true);
          setError(null);
          setSheetsMessage(null);

          try {
               const message = await sendScoresToJuriSheet(juriSheet, kodePeserta, extractedScores);
               setSheetsMessage(message);
          } catch (err: any) {
               console.error('Error sending to Google Sheets:', err);
               setError(err.message || 'Gagal mengirim ke Google Sheets');
          } finally {
               setIsSendingToSheets(false);
          }
     };

     const handleDownloadExcel = () => {
          if (!organizedData || organizedData.length === 0) {
               setError("No data available to download as Excel.");
               return;
          }
          setError(null); // Clear previous errors

          try {
               const ws_name = "ExtractedData";

               // Transpose the data: criteria names become column headers
               // Assuming the input has columns like: NO, Kriteria, Bobot, Nilai
               // We want: each kriteria+bobot becomes a column header with empty rows below

               const formattedData: string[][] = [];
               const rowHeights: { [key: number]: number } = {};

               // Check if this is a criteria table (has "Kriteria" or "Bobot" in headers)
               const headerRow = organizedData[0];
               const isCriteriaTable = headerRow.some(cell =>
                    cell.toLowerCase().includes('kriteria') ||
                    cell.toLowerCase().includes('bobot') ||
                    cell.toLowerCase().includes('penilaian')
               );

               if (isCriteriaTable && organizedData.length > 1) {
                    // Find the index of the criteria, bobot, and nilai columns
                    let kriteriaIdx = headerRow.findIndex(cell =>
                         cell.toLowerCase().includes('kriteria') || cell.toLowerCase().includes('penilaian')
                    );
                    let bobotIdx = headerRow.findIndex(cell => cell.toLowerCase().includes('bobot'));
                    // IMPORTANT: Check if 'nilai' is at the START of the cell to avoid matching 'Penilaian'
                    let nilaiIdx = headerRow.findIndex(cell => {
                         const lowerCell = cell.toLowerCase().trim();
                         return lowerCell.startsWith('nilai') || lowerCell.includes('score') || lowerCell.includes('(0-100)');
                    });

                    // Get the number of columns in the data
                    const numColumns = Math.max(...organizedData.map(row => row.length));

                    // If not found, use common column positions
                    if (kriteriaIdx === -1) kriteriaIdx = 1;
                    if (bobotIdx === -1) bobotIdx = 2;
                    // Nilai is the LAST column if not found by name
                    if (nilaiIdx === -1) nilaiIdx = numColumns - 1;

                    console.log('Column indices:', { kriteriaIdx, bobotIdx, nilaiIdx, numColumns });
                    console.log('Header row:', headerRow);
                    console.log('First data row:', organizedData[1]);

                    // Build transposed headers and data: each row's kriteria+bobot becomes a column
                    const transposedHeaders: string[] = [];
                    const transposedData: string[] = [];

                    for (let i = 1; i < organizedData.length; i++) {
                         const row = organizedData[i];
                         const kriteria = (row[kriteriaIdx] || '').trim();
                         let bobot = (row[bobotIdx] || '').trim();
                         const nilai = (row[nilaiIdx] || '').trim();

                         // Remove existing parentheses from bobot if present to avoid double wrapping
                         bobot = bobot.replace(/^\(/, '').replace(/\)$/, '');

                         // Combine kriteria and bobot like "Korelasi Ide dan Kekomunikatifan (30%)"
                         const header = bobot ? `${kriteria} (${bobot})` : kriteria;
                         transposedHeaders.push(header);
                         transposedData.push(nilai);

                         console.log(`Row ${i}: kriteria="${kriteria}", bobot="${bobot}", nilai="${nilai}"`);
                    }

                    console.log('Transposed headers:', transposedHeaders);
                    console.log('Transposed data:', transposedData);

                    // Add header row
                    formattedData.push(transposedHeaders);
                    rowHeights[0] = 50; // Header row height

                    // Add the first data row with the OCR values
                    formattedData.push(transposedData);
                    rowHeights[1] = 60; // Data row height

                    // Add 4 more empty data rows with tall height for additional entries
                    const numEmptyRows = 4;
                    for (let i = 0; i < numEmptyRows; i++) {
                         formattedData.push(new Array(transposedHeaders.length).fill(''));
                         rowHeights[formattedData.length - 1] = 120; // Tall row height
                    }
               } else {
                    // Default behavior for non-criteria tables
                    organizedData.forEach((row, index) => {
                         formattedData.push(row);
                         const currentRowIndex = formattedData.length - 1;

                         if (index === 0) {
                              rowHeights[currentRowIndex] = 40;
                         } else {
                              rowHeights[currentRowIndex] = 120;
                         }

                         if (index > 0 && index < organizedData.length - 1) {
                              formattedData.push(new Array(row.length).fill(''));
                              rowHeights[formattedData.length - 1] = 120;
                         }
                    });
               }

               const ws = XLSX.utils.aoa_to_sheet(formattedData);

               // Set column widths (wider columns like in the reference image)
               const numCols = Math.max(...formattedData.map(row => row.length));
               const colWidths: XLSX.ColInfo[] = [];
               for (let i = 0; i < numCols; i++) {
                    colWidths.push({ wch: 30 }); // 30 characters wide for longer headers
               }
               ws['!cols'] = colWidths;

               // Set row heights
               const rowInfos: XLSX.RowInfo[] = [];
               for (let i = 0; i < formattedData.length; i++) {
                    rowInfos.push({ hpt: rowHeights[i] || 120 }); // height in points
               }
               ws['!rows'] = rowInfos;

               const wb = XLSX.utils.book_new();
               XLSX.utils.book_append_sheet(wb, ws, ws_name);

               const fileName = selectedFile
                    ? `${selectedFile.name.split('.').slice(0, -1).join('.')}_extracted.xlsx`
                    : "extracted_data.xlsx";

               XLSX.writeFile(wb, fileName);

          } catch (excelError: any) {
               console.error("Error generating Excel file:", excelError);
               setError(`Failed to generate Excel file: ${excelError.message || "Unknown error"}`);
          }

     };

     const handleOpenInGoogleSheets = () => {
          if (!organizedData || organizedData.length === 0) {
               setError("No data available to open in Google Sheets.");
               return;
          }
          setError(null);

          try {
               // Format data with empty rows like the Excel download
               const formattedData: string[][] = [];

               organizedData.forEach((row, index) => {
                    formattedData.push(row);
                    // Add empty spacing row after each data row (not after header, not after last row)
                    if (index > 0 && index < organizedData.length - 1) {
                         formattedData.push(new Array(row.length).fill(''));
                    }
               });

               // Convert to CSV format
               const csvContent = formattedData.map(row =>
                    row.map(cell => {
                         // Escape quotes and wrap in quotes if contains comma or newline
                         const escaped = String(cell).replace(/"/g, '""');
                         return `"${escaped}"`;
                    }).join(',')
               ).join('\n');

               // Create a blob and generate a data URL
               const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
               const dataUrl = URL.createObjectURL(blob);

               // Open Google Sheets with the CSV data
               // Using Google Sheets import URL pattern
               const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQRVE/create?usp=sharing`;

               // Alternative: Open as a downloadable link that Google can import
               // We'll create a new Google Sheet and let user paste the data
               const newSheetUrl = 'https://docs.google.com/spreadsheets/create';

               // Open new Google Sheet in new tab
               const newWindow = window.open(newSheetUrl, '_blank');

               // Copy CSV to clipboard so user can paste it
               navigator.clipboard.writeText(csvContent).then(() => {
                    alert('Data copied to clipboard! A new Google Sheet is opening. Press Ctrl+V (or Cmd+V on Mac) to paste the data.');
               }).catch(() => {
                    // If clipboard fails, create a downloadable CSV instead
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = 'data_for_sheets.csv';
                    link.click();
                    alert('CSV file downloaded! Open it with Google Sheets.');
               });

          } catch (error: any) {
               console.error("Error opening in Google Sheets:", error);
               setError(`Failed to open in Google Sheets: ${error.message || "Unknown error"}`);
          }
     };

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
               <header className="w-full max-w-4xl mb-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                         Image Text Extractor & Organizer
                    </h1>
                    <p className="mt-3 text-slate-400 text-lg">
                         Upload an image, extract text, and get it organized as CSV for easy use with Pandas or Excel.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Using Gemini Model: {GEMINI_MODEL_NAME}</p>
               </header>

               <main className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                         {/* Left Column: Upload & Preview */}
                         <div className="space-y-6">
                              <ImageUploader onFileSelect={handleFileSelect} disabled={isLoading} />

                              {imagePreviewUrl && (
                                   <div className="mt-4 p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-700">
                                        <h3 className="text-lg font-semibold text-sky-400 mb-2">Image Preview:</h3>
                                        <img src={imagePreviewUrl} alt="Selected preview" className="max-w-full max-h-80 rounded-md object-contain mx-auto" />
                                   </div>
                              )}

                              {/* Multi-image preview thumbnails */}
                              {processedImages.length > 1 && (
                                   <div className="mt-4 p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-700">
                                        <h3 className="text-lg font-semibold text-sky-400 mb-2">
                                             📁 {processedImages.length} Images Selected
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                                             {processedImages.map((img, idx) => (
                                                  <div key={img.id} className="relative">
                                                       <img
                                                            src={img.previewUrl}
                                                            alt={`Preview ${idx + 1}`}
                                                            className="w-full h-16 object-cover rounded"
                                                       />
                                                       {img.kodePeserta && (
                                                            <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center truncate">
                                                                 {img.kodePeserta}
                                                            </span>
                                                       )}
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              )}

                              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                   <button
                                        onClick={processedImages.length > 1 ? processBatch : processImage}
                                        disabled={!selectedFile || isLoading || isProcessingBatch || apiKeyMissing}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
                                        aria-label={isLoading || isProcessingBatch ? 'Processing images' : 'Extract and organize text from images'}
                                   >
                                        {(isLoading || isProcessingBatch) ? <LoadingIcon className="w-5 h-5 mr-2" /> : <ProcessIcon />}
                                        {isProcessingBatch
                                             ? `Processing ${batchProgress.current}/${batchProgress.total}...`
                                             : isLoading
                                                  ? 'Processing...'
                                                  : processedImages.length > 1
                                                       ? `Extract All (${processedImages.length})`
                                                       : 'Extract & Organize Text'}
                                   </button>
                                   <button
                                        onClick={handleClear}
                                        disabled={(isLoading || isProcessingBatch) && (!selectedFile && !extractedText)}
                                        className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-75"
                                        aria-label="Clear all selections and results"
                                   >
                                        <ClearIcon />
                                        Clear
                                   </button>
                              </div>
                              {apiKeyMissing && (
                                   <AlertMessage type="error" message="Gemini API Key is not configured correctly. Please ensure the API_KEY environment variable is set and valid for the application to function." />
                              )}
                              {error && <AlertMessage type="error" message={error} />}
                         </div>

                         {/* Right Column: Extracted Data */}
                         <div className="space-y-6">
                              {isLoading && (
                                   <div className="flex flex-col items-center justify-center p-8 bg-slate-700 rounded-lg min-h-[200px]" role="status" aria-live="polite">
                                        <LoadingIcon className="w-12 h-12 text-sky-400" />
                                        <p className="mt-4 text-slate-300 text-lg">Extracting text, please wait...</p>
                                   </div>
                              )}

                              {!isLoading && extractedText && (
                                   <div className="p-4 bg-slate-700 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-emerald-400 mb-3">Extracted CSV Data:</h3>
                                        <textarea
                                             id="csv-output"
                                             aria-label="Extracted CSV data"
                                             readOnly
                                             value={extractedText}
                                             className="w-full h-40 p-3 bg-slate-800 border border-slate-600 rounded-md text-slate-200 text-sm font-mono focus:ring-emerald-500 focus:border-emerald-500"
                                             placeholder="Extracted text will appear here in CSV format..."
                                        />
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                             <button
                                                  onClick={() => navigator.clipboard.writeText(extractedText)}
                                                  className="w-full flex items-center justify-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
                                                  aria-label="Copy CSV data to clipboard"
                                             >
                                                  Copy CSV
                                             </button>
                                             <button
                                                  onClick={handleDownloadExcel}
                                                  disabled={!organizedData || organizedData.length === 0 || isLoading}
                                                  className="w-full flex items-center justify-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
                                                  aria-label="Download extracted data as Excel file"
                                             >
                                                  <DownloadIcon />
                                                  Excel
                                             </button>
                                             <button
                                                  onClick={handleOpenInGoogleSheets}
                                                  disabled={!organizedData || organizedData.length === 0 || isLoading}
                                                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                                                  aria-label="Open extracted data in Google Sheets"
                                             >
                                                  <ExternalLinkIcon />
                                                  Google Sheets
                                             </button>
                                        </div>

                                        {/* Juri Sheets Section */}
                                        {kodePeserta && extractedScores && extractedScores.length > 0 && (
                                             <div className="mt-4 p-4 bg-slate-600 rounded-lg">
                                                  <h4 className="text-sm font-semibold text-amber-400 mb-2">
                                                       📝 Kirim ke Google Sheets
                                                  </h4>
                                                  <p className="text-xs text-slate-300 mb-3">
                                                       Kode Peserta: <span className="font-bold text-white">{kodePeserta}</span> |
                                                       Nilai: <span className="font-bold text-white">{extractedScores.join(', ')}</span>
                                                  </p>
                                                  <div className="grid grid-cols-3 gap-2">
                                                       <button
                                                            onClick={() => handleSendToJuri('Juri1')}
                                                            disabled={isSendingToSheets}
                                                            className="w-full flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                       >
                                                            {isSendingToSheets ? '...' : 'Juri 1'}
                                                       </button>
                                                       <button
                                                            onClick={() => handleSendToJuri('Juri2')}
                                                            disabled={isSendingToSheets}
                                                            className="w-full flex items-center justify-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                       >
                                                            {isSendingToSheets ? '...' : 'Juri 2'}
                                                       </button>
                                                       <button
                                                            onClick={() => handleSendToJuri('Juri3')}
                                                            disabled={isSendingToSheets}
                                                            className="w-full flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                       >
                                                            {isSendingToSheets ? '...' : 'Juri 3'}
                                                       </button>
                                                  </div>
                                             </div>
                                        )}

                                        {/* Success Message for Sheets */}
                                        {sheetsMessage && (
                                             <div className="mt-3 p-3 bg-green-600 rounded-md text-white text-sm">
                                                  ✅ {sheetsMessage}
                                             </div>
                                        )}
                                   </div>
                              )}

                              {!isLoading && organizedData && organizedData.length > 0 && (
                                   <div className="p-4 bg-slate-700 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-emerald-400 mb-3">Organized Table Preview:</h3>
                                        <DataTable data={organizedData} />
                                   </div>
                              )}

                              {!isLoading && !extractedText && !error && !imagePreviewUrl && processedImages.length === 0 && (
                                   <div className="flex flex-col items-center justify-center p-8 bg-slate-700 rounded-lg min-h-[200px] border-2 border-dashed border-slate-600">
                                        <UploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                                        <p className="text-slate-400 text-center">Upload images and click "Extract" to see the results here.</p>
                                   </div>
                              )}

                              {/* Batch Processing Results */}
                              {processedImages.length > 0 && processedImages.some(p => p.extractedText || p.error) && (
                                   <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-emerald-400">
                                             📊 Batch Results ({processedImages.filter(p => p.extractedText).length}/{processedImages.length} processed)
                                        </h3>
                                        {processedImages.map((img, idx) => (
                                             <div key={img.id} className="p-4 bg-slate-700 rounded-lg shadow">
                                                  <div className="flex items-start gap-3">
                                                       <img
                                                            src={img.previewUrl}
                                                            alt={`Result ${idx + 1}`}
                                                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                                                       />
                                                       <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                 <span className="text-sm font-medium text-slate-300 truncate">
                                                                      {img.file.name}
                                                                 </span>
                                                                 {img.kodePeserta && (
                                                                      <span className="px-2 py-0.5 bg-sky-500 text-white text-xs rounded">
                                                                           {img.kodePeserta}
                                                                      </span>
                                                                 )}
                                                            </div>

                                                            {img.error && (
                                                                 <p className="text-red-400 text-sm">❌ {img.error}</p>
                                                            )}

                                                            {img.extractedScores && img.extractedScores.length > 0 && (
                                                                 <>
                                                                      <p className="text-xs text-slate-400 mb-2">
                                                                           Nilai: <span className="text-white">{img.extractedScores.join(', ')}</span>
                                                                      </p>
                                                                      <div className="flex gap-2">
                                                                           <button
                                                                                onClick={() => handleSendToJuriForImage(img.id, 'Juri1')}
                                                                                disabled={img.isSendingToSheets}
                                                                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                                                           >
                                                                                {img.isSendingToSheets ? '...' : 'Juri 1'}
                                                                           </button>
                                                                           <button
                                                                                onClick={() => handleSendToJuriForImage(img.id, 'Juri2')}
                                                                                disabled={img.isSendingToSheets}
                                                                                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                                                           >
                                                                                {img.isSendingToSheets ? '...' : 'Juri 2'}
                                                                           </button>
                                                                           <button
                                                                                onClick={() => handleSendToJuriForImage(img.id, 'Juri3')}
                                                                                disabled={img.isSendingToSheets}
                                                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                                                           >
                                                                                {img.isSendingToSheets ? '...' : 'Juri 3'}
                                                                           </button>
                                                                      </div>
                                                                 </>
                                                            )}

                                                            {img.sheetsMessage && (
                                                                 <p className="text-green-400 text-xs mt-2">✅ {img.sheetsMessage}</p>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              )}
                         </div>
                    </div>
               </main>

               <footer className="w-full max-w-4xl mt-12 text-center text-slate-500 text-sm">
                    <p>
                         &copy; {new Date().getFullYear()} AkiroKazuki All rights reserved. AI Powered Solutions.
                    </p>

                    <div className="flex justify-center gap-x-6 mt-4">
                         <a
                              href="https://github.com/AkiroKazuki"
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="GitHub Profile"
                              className="hover:text-slate-300"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                         </a>
                         <a
                              href="https://www.instagram.com/akiro_kazuki/"
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram Profile"
                              className="hover:text-slate-300"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069s-3.585-.011-4.85-.069c-3.252-.149-4.771-1.664-4.919-4.919-.058-1.265-.069-1.644-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" />
                              </svg>
                         </a>
                    </div>

                    <p className="mt-4">
                         This tool uses Gemini API for text extraction.
                    </p>
               </footer>
          </div>
     );
};

export default App;
