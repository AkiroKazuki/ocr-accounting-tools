export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/png;base64, 실제base64인코딩된데이터"
        // We need to strip the "data:image/png;base64," part.
        const base64String = reader.result.split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error("Failed to extract base64 data from Data URL."));
        }
      } else {
        reject(new Error("FileReader did not return a string."));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
