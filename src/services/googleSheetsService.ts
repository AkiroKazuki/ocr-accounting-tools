// Google Sheets Service via Apps Script
// Calls a deployed Google Apps Script web app to update scores

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

interface AppsScriptResponse {
     success: boolean;
     message?: string;
     error?: string;
}

/**
 * Send scores to a Juri sheet via Apps Script
 */
export const sendScoresToJuriSheet = async (
     juriSheet: 'Juri1' | 'Juri2' | 'Juri3',
     kodePeserta: string,
     scores: string[]
): Promise<string> => {
     if (!APPS_SCRIPT_URL) {
          throw new Error('Apps Script URL tidak dikonfigurasi. Tambahkan VITE_APPS_SCRIPT_URL di file .env');
     }

     try {
          const response = await fetch(APPS_SCRIPT_URL, {
               method: 'POST',
               mode: 'no-cors', // Apps Script doesn't support CORS by default for POST
               headers: {
                    'Content-Type': 'text/plain', // Use text/plain to avoid CORS preflight
               },
               body: JSON.stringify({
                    sheetName: juriSheet,
                    kodePeserta: kodePeserta,
                    scores: scores,
               }),
          });

          // Due to no-cors mode, we can't read the response
          // We'll assume success if no network error
          // The user will verify in the spreadsheet
          return `Nilai untuk ${kodePeserta} telah dikirim ke ${juriSheet}. Silakan cek spreadsheet untuk konfirmasi.`;

     } catch (error: any) {
          console.error('Error sending to Apps Script:', error);
          throw new Error(`Gagal mengirim ke Google Sheets: ${error.message}`);
     }
};
