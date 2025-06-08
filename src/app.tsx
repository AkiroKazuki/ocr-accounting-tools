import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ImageUploader } from './components/ImageUploader.tsx';
import { DataTable } from './components/DataTable.tsx';
import { LoadingIcon } from './components/LoadingIcon.tsx';
import { AlertMessage } from './components/AlertMessage.tsx';
import { extractTextFromImageWithGemini } from './services/geminiServices.ts';
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


const App: React.FC = () => {
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
     const [base64Image, setBase64Image] = useState<string | null>(null);
     const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
     const [extractedText, setExtractedText] = useState<string | null>(null);
     const [organizedData, setOrganizedData] = useState<string[][] | null>(null);
     const [isLoading, setIsLoading] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

     useEffect(() => {
          if (typeof import.meta.env.VITE_GEMINI_API_KEY !== 'string' || import.meta.env.VITE_GEMINI_API_KEY === '') {
               console.warn("API_KEY environment variable not detected or empty. Gemini API calls may fail.");
               // setApiKeyMissing(true); // Let geminiService handle actual error for calls
          }
     }, []);


     const handleFileSelect = useCallback(async (file: File | null) => {
          setSelectedFile(file);
          setError(null);
          setExtractedText(null);
          setOrganizedData(null);
          if (file) {
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
          } else {
               setBase64Image(null);
               setImagePreviewUrl(null);
          }
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

          const prompt = `Extract all text from this image and format it as a CSV (Comma Separated Values) string.
- Each distinct row of text or data in the image should become a new line (\\n) in the CSV.
- Each distinct column or piece of data within a row in the image should be separated by a comma (,).
- If the image contains a table, ensure the CSV output accurately reflects this table structure.
- Include headers as the first line of the CSV if they are identifiable in the image.
- Represent empty cells or missing data as an empty string between commas (e.g., "data1,,data3").
- Output ONLY the CSV formatted string. Do not include any introductory text, explanations, or markdown fences like \`\`\`csv or \`\`\`.`;

          try {
               const resultText = await extractTextFromImageWithGemini(base64Image, selectedFile.type, prompt);
               setExtractedText(resultText);
               if (resultText) {
                    const rows = resultText.trim().split('\n');
                    const dataTable = rows.map(row => {
                         // Basic CSV split, doesn't handle commas within quoted strings if they exist
                         // However, Gemini is prompted to provide a clean CSV string.
                         return row.split(',');
                    });
                    setOrganizedData(dataTable);
               } else {
                    setOrganizedData([]);
                    setError("No text was extracted, or the response was empty.");
               }
          } catch (err: any) {
               console.error('Error processing image with Gemini:', err);
               if (err.message && err.message.includes('API Key is not configured')) {
                    setError('Error: API Key is not configured. Please ensure the API_KEY environment variable is set.');
                    setApiKeyMissing(true); // Set state if API key is confirmed missing by service.
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
          setApiKeyMissing(false); // Reset API key missing status on clear
          const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
     };

     const handleDownloadExcel = () => {
          if (!organizedData || organizedData.length === 0) {
               setError("No data available to download as Excel.");
               return;
          }
          setError(null); // Clear previous errors

          try {
               const ws_name = "ExtractedData";
               const ws = XLSX.utils.aoa_to_sheet(organizedData);
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

                              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                   <button
                                        onClick={processImage}
                                        disabled={!selectedFile || isLoading || apiKeyMissing}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
                                        aria-label={isLoading ? 'Processing image' : 'Extract and organize text from image'}
                                   >
                                        {isLoading ? <LoadingIcon className="w-5 h-5 mr-2" /> : <ProcessIcon />}
                                        {isLoading ? 'Processing...' : 'Extract & Organize Text'}
                                   </button>
                                   <button
                                        onClick={handleClear}
                                        disabled={isLoading && (!selectedFile && !extractedText)}
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
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                             <button
                                                  onClick={() => navigator.clipboard.writeText(extractedText)}
                                                  className="w-full flex items-center justify-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
                                                  aria-label="Copy CSV data to clipboard"
                                             >
                                                  Copy CSV to Clipboard
                                             </button>
                                             <button
                                                  onClick={handleDownloadExcel}
                                                  disabled={!organizedData || organizedData.length === 0 || isLoading}
                                                  className="w-full flex items-center justify-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
                                                  aria-label="Download extracted data as Excel file"
                                             >
                                                  <DownloadIcon />
                                                  Download as Excel
                                             </button>
                                        </div>
                                   </div>
                              )}

                              {!isLoading && organizedData && organizedData.length > 0 && (
                                   <div className="p-4 bg-slate-700 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-emerald-400 mb-3">Organized Table Preview:</h3>
                                        <DataTable data={organizedData} />
                                   </div>
                              )}

                              {!isLoading && !extractedText && !error && !imagePreviewUrl && (
                                   <div className="flex flex-col items-center justify-center p-8 bg-slate-700 rounded-lg min-h-[200px] border-2 border-dashed border-slate-600">
                                        <UploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                                        <p className="text-slate-400 text-center">Upload an image and click "Extract & Organize Text" to see the results here.</p>
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
