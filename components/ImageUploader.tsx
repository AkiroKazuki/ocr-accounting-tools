import React, { useCallback, useState } from 'react';

interface ImageUploaderProps {
     onFileSelect: (file: File | null) => void;
     disabled?: boolean;
}

const UploadFileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 01-1.737 11.097H6.75z" />
     </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, disabled }) => {
     const [dragging, setDragging] = useState(false);

     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0] || null;
          onFileSelect(file);
     };

     const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragging(true);
     }, [disabled]);

     const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
     }, []);

     const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
               e.dataTransfer.dropEffect = 'copy'; // Show a copy cursor
          } else {
               e.dataTransfer.dropEffect = 'none';
          }
     }, [disabled]);

     const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (disabled) return;

          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
               const file = e.dataTransfer.files[0];
               // You might want to add file type validation here
               if (file.type.startsWith('image/')) {
                    onFileSelect(file);
               } else {
                    alert("Please upload an image file (e.g., PNG, JPG, GIF, WEBP).");
                    onFileSelect(null); // Clear any previously selected file
               }
               e.dataTransfer.clearData();
          }
     }, [onFileSelect, disabled]);


     return (
          <div className="w-full">
               <label
                    htmlFor="image-upload-input"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`group flex flex-col items-center justify-center w-full h-48 border-2 ${dragging ? 'border-sky-500 bg-slate-700' : 'border-slate-600 hover:border-sky-500'} border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600 transition-all duration-200 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         <UploadFileIcon />
                         <p className={`mb-2 text-sm ${dragging ? 'text-sky-300' : 'text-slate-400 group-hover:text-sky-300'}`}>
                              <span className="font-semibold">Click to upload</span> or drag and drop
                         </p>
                         <p className="text-xs text-slate-500 group-hover:text-slate-400">PNG, JPG, GIF, WEBP (MAX. 5MB recommended)</p>
                    </div>
                    <input
                         id="image-upload-input"
                         type="file"
                         accept="image/png, image/jpeg, image/gif, image/webp"
                         className="hidden"
                         onChange={handleFileChange}
                         disabled={disabled}
                    />
               </label>
          </div>
     );
};
