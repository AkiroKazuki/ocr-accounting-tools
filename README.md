# Image Text Extractor & Organizer

## Description

The Image Text Extractor & Organizer is a web application that allows users to upload an image, extract text from it using Google's Gemini API, and then view the extracted text formatted as CSV. Users can copy the CSV data or download it directly as an Excel (.xlsx) file, making it easy to use with tools like Pandas or for direct import into spreadsheets.

The application displays a preview of the uploaded image and the organized data in a table format. It provides clear feedback during processing and for any errors encountered, including issues related to API key configuration.

## Features

- **Image Upload**: Supports drag-and-drop or file selection for PNG, JPG, GIF, and WEBP images.
- **Image Preview**: Displays a preview of the selected image.
- **Text Extraction**: Utilizes the Google Gemini API (`gemini-2.5-flash-preview-04-17` model) to extract text from images.
- **CSV Formatting**: Prompts Gemini to return extracted text in a CSV format.
- **Data Table Preview**: Displays the extracted and parsed CSV data in a user-friendly table.
- **Copy to Clipboard**: Allows users to easily copy the raw extracted CSV text.
- **Download as Excel**: Enables users to download the extracted data as an `.xlsx` file.
- **Loading & Error States**: Provides visual feedback for loading operations and clear error messages.
- **Responsive Design**: UI adapts to different screen sizes with a clean, modern look.
- **Clear Functionality**: Allows resetting the application state (clearing image, text, and errors).

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini API (`gemini-2.5-flash-preview-04-17`) via `@google/genai` SDK
- **Excel Export**: `xlsx` (SheetJS) library
- **Runtime**: Modern web browser with JavaScript (ESM modules loaded via `esm.sh`)

## Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
- A Google Gemini API Key.

## Environment Setup

### API Key Configuration

This application requires a Google Gemini API Key to function. The API key **must** be available as `process.env.API_KEY` in the JavaScript execution environment where the application is run.

**Important:** The application code itself does not provide a way to input or manage the API key. It is assumed that `process.env.API_KEY` is pre-configured and accessible. If the API key is not set or is invalid, the text extraction functionality will fail, and an error message will be displayed.

How you make this environment variable available will depend on how you are serving/hosting the `index.html` file:
- If using a build system (though not explicitly defined in this project structure), it would typically be injected during the build process.
- If served by a custom server, the server might inject it.
- For local development without a build step, you might need to manually define `window.process = { env: { API_KEY: "YOUR_ACTUAL_API_KEY" } };` in your browser's developer console or via a script tag in `index.html` before `index.tsx` is loaded (ensure this is done securely and not committed if the key is sensitive).

## Getting Started

This project is set up to run directly in a browser using ESM modules, without a separate build step for its core dependencies.

1.  **Clone the repository (Optional):**
    If you have this project in a Git repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    Otherwise, ensure all the provided files (`index.html`, `index.tsx`, `App.tsx`, `components/`, `services/`, `utils/`, `constants.ts`, `types.ts`, `metadata.json`) are in the same directory structure.

2.  **Configure Environment Variables:**
    Ensure the `API_KEY` is set up as described in the "Environment Setup" section.

3.  **Running the Application:**
    You can run the application by opening the `index.html` file directly in your web browser.
    For a better experience and to avoid potential issues with file path routing or CORS for API calls (though Gemini API calls are client-side here), it's recommended to serve the files using a simple local HTTP server.
    If you have Node.js installed, you can use a package like `http-server`:
    ```bash
    npx http-server .
    ```
    Then, open the provided URL (e.g., `http://localhost:8080`) in your browser.

## How to Use

1.  **Open the Application**: Launch `index.html` in your browser.
2.  **Upload an Image**:
    - Click on the "Click to upload" area or drag and drop an image file (PNG, JPG, GIF, WEBP) onto it.
    - A preview of the uploaded image will appear.
3.  **Extract Text**:
    - Click the "Extract & Organize Text" button.
    - A loading indicator will show while the Gemini API processes the image.
4.  **View Results**:
    - Once processing is complete, the extracted text (formatted as CSV) will appear in a text area.
    - A preview of this data organized into a table will also be displayed.
5.  **Use the Data**:
    - **Copy CSV**: Click "Copy CSV to Clipboard" to copy the raw CSV text.
    - **Download Excel**: Click "Download as Excel" to save the data as an `.xlsx` file.
6.  **Clear**:
    - Click the "Clear" button to remove the uploaded image, extracted text, and any error messages, resetting the application.

## Key Components

-   **`App.tsx`**: The main application component that manages state, orchestrates API calls, and renders the UI.
-   **`components/ImageUploader.tsx`**: Handles image file selection and drag-and-drop functionality.
-   **`components/DataTable.tsx`**: Renders the extracted CSV data in an HTML table.
-   **`components/AlertMessage.tsx`**: Displays error, warning, or informational messages.
-   **`components/LoadingIcon.tsx`**: A simple animated loading spinner.
-   **`services/geminiService.ts`**: Contains the logic for interacting with the Google Gemini API to extract text from images.
-   **`utils/imageUtils.ts`**: Utility functions, currently for converting image files to base64.
-   **`constants.ts`**: Stores global constants like the Gemini model name.

## Gemini Model

The application uses the `gemini-2.5-flash-preview-04-17` model for its multimodal capabilities (processing image and text prompts).

## Troubleshooting

-   **API Key Not Configured/Invalid**: If you see errors related to the API key, ensure `process.env.API_KEY` is correctly set in your execution environment and that the key is valid and has the necessary permissions for the Gemini API.
-   **Quota Exceeded**: The Gemini API has usage quotas. If you encounter quota errors, you may need to check your Google Cloud project quotas or wait before making more requests.
-   **Failed to Extract Text**: If the API returns an error or no text, the image might be unclear, contain no discernible text, or there might have been an issue with the API request. Check the error message for more details.
-   **Excel Download Issues**: Ensure that your browser allows file downloads. If errors occur during Excel generation, check the console for details.


---

### Future Enhancements
1.  More robust CSV parsing (e.g., handling quotes within cells).
2.  Option to select different Gemini models or configure generation parameters.
3.  Support for more input file types (e.g., PDF text extraction if feasible with Gemini).

---

### License
This project is licensed under the [MIT License](LICENSE.txt).

---

### Contribution
Contributions are welcome! Feel free to open issues or submit pull requests. Please adhere to the project's coding style and provide detailed descriptions for your changes.

---

### Contact
If you have any questions or suggestions, feel free to reach out at `agungwah900@gmail.com`.
