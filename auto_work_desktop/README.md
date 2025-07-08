# Auto Work Desktop

This is a desktop application built with [Tauri](https://tauri.app/), React, and TypeScript. It is a migration of the original `soukon-auto-work` Java web application, designed to automate data extraction from files based on configurable templates. The application uses a local SQLite database to store all its data, which can be found in the app's data directory.

## Overview

The application provides a user-friendly interface to manage templates, upload source files (like Excel or HTML), and define specific data cells to be extracted. It then parses these files and returns the desired data. This is particularly useful for repetitive data entry tasks where data needs to be pulled from structured documents.

## Core Features

- **Template Management**: 
  - Create, edit, and delete templates. Templates act as a blueprint for data extraction from a specific type of file.
- **File Handling**: 
  - Upload source files (e.g., Excel, HTML) and associate them with a template.
- **Data Cell Configuration**: 
  - For each template, define "Data Cells" which specify the exact location of the data to be extracted. This can be a specific cell, a range of cells, or a column/row.
- **Data Parsing**: 
  - With a single click, parse the associated files based on the data cell configurations and see the extracted values.
- **Data Import/Export**: 
  - A full backup and restore functionality is available. Export all application data (templates, files, and data cells) to a single JSON file, and import it back to restore the application's state.

## Development

To run the application in development mode, you'll need [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/) installed.

1.  **Navigate to the project directory**:
    ```bash
    cd auto_work_desktop
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    The application will launch in a new window.
    ```bash
    npm run tauri dev
    ```

## Building the Application

To build the application for your platform (e.g., as a `.exe` on Windows or a `.dmg` on macOS), run the following command:

```bash
npm run tauri build
```

The output executable will be located in `auto_work_desktop/src-tauri/target/release/bundle/`. For example, on Windows, you will find an `.exe` installer inside a `msi` sub-folder.
