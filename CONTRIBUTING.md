# Contributing to Image Text Extractor

First off, thank you for considering contributing\! Your help is greatly appreciated. This project is a tool to help users easily extract text from images and organize it, and every contribution helps make it better.

## How Can I Contribute?

There are many ways to contribute, from reporting bugs to suggesting new features or writing code.

### Reporting Bugs

If you find a bug, please make sure it hasn't already been reported by checking the [Issues](https://github.com/AkiroKazuki/ocr-accounting-tools/issues) page.

If it's a new bug, please open a new issue and include as much detail as possible:

  * A clear and descriptive title.
  * A step-by-step description of how to reproduce the bug.
  * What you expected to happen vs. what actually happened.
  * Screenshots or error messages from the console, if applicable.
  * The browser and operating system you are using.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, feel free to open an issue to discuss it. We value all ideas\!

### Pull Requests

If you want to write code, that's fantastic\! Here’s how to get started:

1.  **Fork the repository:** Click the "Fork" button at the top right of the repository page.

2.  **Clone your fork:** Clone your forked repository to your local machine.

    ```bash
    git clone [https://github.com/YourUsername/ocr-accounting-tools.git](https://github.com/YourUsername/ocr-accounting-tools.git)
    ```

3.  **Create a new branch:** Create a descriptive branch name for your feature or bug fix.

    ```bash
    git checkout -b feature/add-new-export-format
    ```

4.  **Set up the project locally:**

      * Make sure you have Node.js installed.
      * Install all the necessary packages:
        ```bash
        npm install
        ```
      * Create a `.env` file in the root of the project and add your Gemini API key:
        ```
        VITE_GEMINI_API_KEY=your_api_key_here
        ```
      * Start the development server:
        ```bash
        npm run dev
        ```

5.  **Make your changes:** Write your code and make your improvements.

6.  **Commit your changes:** Use a clear and descriptive commit message.

    ```bash
    git add .
    git commit -m "Feat: Add support for PDF export"
    ```

7.  **Push to your branch:**

    ```bash
    git push origin feature/add-new-export-format
    ```

8.  **Open a Pull Request:** Go to the original repository on GitHub and open a new Pull Request from your forked branch. Please provide a clear description of the changes you made.

## Code Style

  * This project uses Prettier and ESLint to maintain code consistency. Please make sure to format your code before committing. Most code editors can be configured to do this automatically on save.
  * We use TypeScript, so please include types where appropriate.
  * Comments are encouraged for complex logic.

Thank you again for your interest in contributing\!
