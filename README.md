# Automatic ArchiMate Diagram Generator

This project is a research prototype that generates **ArchiMate diagrams automatically** using [PlantUML](https://plantuml.com/) as the rendering engine.  
The input comes from an **Excel file containing SPBE architecture metadata**, which is processed by the system to produce ArchiMate models in diagram form.

The system is fully built with **Node.js** and uses **EJS (Embedded JavaScript)** as its templating engine for the web interface.  
Uploaded Excel files are stored **temporarily in the `/uploads` folder**, and once the conversion process is completed and the diagram is generated, the input file will be automatically deleted.  
This ensures that no input data is permanently stored in the system.

---

## Reference of Metadata Relationship Rules

The diagram generation logic is based on the **official rules of relationships between SPBE metadata**, as defined by the Ministry of Administrative and Bureaucratic Reform of the Republic of Indonesia in:  

📄 **Circular Letter of the Minister of PAN-RB No. 18 of 2022**  

Below are the visual references used in this project:

- Official metadata relationship rules from the regulation:  
  <img src="storage/Aturan Relasi antar Metadata SPBE.png" alt="Aturan Relasi Metadata SPBE" width="600"/>

- Mapping of the metadata rules into ArchiMate notation:  
  <img src="storage/Aturan Relasi Metadata ArchiMate.webp" alt="Aturan Relasi Metadata ArchiMate" width="600"/>


👉 The mapping into ArchiMate notation has also been **verified by two experts** in the fields of **Information Systems** and **Enterprise Architecture**, ensuring its academic validity.

A sample input file is also provided here:  
📊 `storage/Template Metadata SPBE.xlsx`

---

## Installation Guide

Follow these steps to install and run this project:

### Prerequisites

- [Git](https://git-scm.com/) must be installed.
- [Node.js](https://nodejs.org/) must be installed.

### Installation Steps

1. **Clone the repository**
    ```bash
    git clone https://github.com/AirlanggaDS/spbe-archimate.git
    cd spbe-archimate
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Run the application**
    - To start normally:
      ```bash
      npm run start
      ```
    - To run with nodemon (auto-restart on changes):
      ```bash
      npm run dev
      ```

   By default, the application will run on `http://localhost:3000`.

---

## License

This project is licensed under the [MIT License](https://mit-license.org/).  

Developed as part of an undergraduate thesis at **Universitas Airlangga, Bachelor of Information Systems Program**.  
Copyright © 2025 [@AirlanggaDS](https://github.com/AirlanggaDS).

