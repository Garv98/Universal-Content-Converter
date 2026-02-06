# Universal Content Converter

A comprehensive accessibility platform built with **Next.js** and **Flask** that implements Universal Design for Learning (UDL) principles to make digital content more accessible to everyone.

## Overview

Universal Content Converter is a full-stack web application designed to enhance content accessibility through AI-powered features including text extraction, simplification, translation, bias detection, WCAG compliance checking, and video accessibility processing.

## Features

- **Text Extraction**: Extract text from PDFs and images using OCR
- **Text Simplification**: Automatically simplify complex text for better readability
- **Translation**: Multi-language translation support
- **Bias Detection**: Identify and flag biased language in content
- **WCAG Compliance Checker**: Validate content against Web Content Accessibility Guidelines
- **Sign Language Generation**: Generate text-to-sign-language gloss for deaf accessibility
- **Image Captioning**: Generate alternative text descriptions for images
- **Speech-to-Text**: Transcribe audio content to text
- **Video Processing**: Process videos for accessibility with transcriptions and descriptions
- **Similarity Analysis**: Compare text similarity between documents

## Project Structure

### Root Level Files
```
components.json          # UI component configuration
eslint.config.mjs       # ESLint configuration for code quality
next.config.ts          # Next.js configuration
package.json            # Frontend dependencies and scripts
package-lock.json       # Locked versions of frontend dependencies
postcss.config.mjs      # PostCSS configuration for styling
tsconfig.json           # TypeScript configuration
README.md               # Project documentation
field_img.webp          # Project image asset
```

### `/app` - Next.js Frontend Application
Main application directory containing pages and layouts:

- **`layout.tsx`**: Root layout component with global styling (globals.css)
- **`page.tsx`**: Landing page with navigation, hero section, UDL principles, and features
- **`processing/`**: Content processing page
  - `page.tsx`: Processing interface
- **`results/`**: Results display page
  - `page.tsx`: Results visualization
- **`sign-in/`**: Authentication
  - `page.tsx`: Sign-in form page
- **`sign-up/`**: User registration
  - `page.tsx`: Sign-up form page
- **`upload/`**: Content upload
  - `page.tsx`: File upload interface
- **`video/`**: Video processing
  - `page.tsx`: Video upload and processing page
- **`globals.css`**: Global stylesheet with Tailwind CSS

### `/backend` - Flask Backend API
Python-based backend server handling all AI/ML operations:

- **`app.py`**: Main Flask application with API endpoints for all accessibility features
- **`requirements.txt`**: Python package dependencies

#### `/backend/models` - AI/ML Model Implementations
Core functionality modules:

- **`text_extraction.py`**: PDF and image text extraction using pytesseract and PyPDF2
- **`simplification.py`**: Text simplification using transformers
- **`translation.py`**: Multi-language translation support using deep-translator and Groq API
- **`bias_detection.py`**: AI-powered bias detection in text
- **`wcag_checker.py`**: WCAG 2.1 compliance validation
- **`sign_language.py`**: Generate ASL/BSL gloss for sign language interpretation
- **`image_captioning.py`**: Generate alternative text using vision models
- **`speech_to_text.py`**: Audio transcription using Assembly AI
- **`video_processing.py`**: Video accessibility processing with transcription
- **`similarity.py`**: Text similarity computation using sentence transformers
- **`__init__.py`**: Module initialization

### `/components` - React/TypeScript Components
Reusable UI components built with Radix UI and Tailwind CSS:

**Layout Components:**
- **`navbar.tsx`**: Navigation bar with links and authentication
- **`footer.tsx`**: Footer with links and information
- **`landing-hero.tsx`**: Hero section on landing page
- **`features-section.tsx`**: Features showcase section
- **`udl-principles.tsx`**: Universal Design for Learning principles display

**Feature Components:**
- **`accessibility-panel.tsx`**: Main accessibility tools interface
- **`upload-form.tsx`**: File upload form component
- **`processing-pipeline.tsx`**: Shows processing status and workflow
- **`results-dashboard.tsx`**: Displays results from processed content

**Authentication Components:**
- **`sign-in-form.tsx`**: Sign-in form with validation
- **`sign-up-form.tsx`**: User registration form
- **`auth-provider.tsx`**: Authentication context and provider

#### `/components/ui` - UI Component Library
Radix UI-based component primitives:
- **`button.tsx`**: Reusable button component
- **`card.tsx`**: Card container component
- **`input.tsx`**: Text input component
- **`label.tsx`**: Form label component
- **`badge.tsx`**: Badge/tag component
- **`textarea.tsx`**: Multi-line text input
- **`tabs.tsx`**: Tab interface component
- **`dropdown-menu.tsx`**: Dropdown menu component
- **`progress.tsx`**: Progress bar component

### `/data` - Datasets
Training and evaluation datasets:

- **`bias_eval_dataset.csv`**: Dataset for evaluating bias detection model
- **`text_simplification_test.csv`**: Test data for text simplification evaluation
- **`wcag_eval_dataset.csv`**: WCAG compliance test dataset

### `/evaluation` - Model Evaluation Scripts
Scripts for testing and evaluating model performance:

- **`eval_bias.py`**: Bias detection model evaluation
- **`eval_bias2.py`**: Alternative bias evaluation script
- **`eval_wcag.py`**: WCAG compliance checker evaluation
- **`eval_wcag2.py`**: Alternative WCAG evaluation
- **`simplify.py`**: Text simplification evaluation
- **`conf1.py`**: Configuration file 1
- **`conf2.py`**: Configuration file 2
- **`btSNE.py`**: Barnes-Hut t-SNE visualization
- **`tSNE.py`**: t-SNE dimensionality reduction

### `/outputs` - Evaluation Results
Generated evaluation reports and metrics:

- **`bias/`**
  - `bias_summary.csv`: Summary of bias detection results
  - `bias_detailed_results.csv`: Detailed bias analysis
- **`wcag/`**
  - `wcag_summary.csv`: WCAG compliance summary
  - `wcag_detailed_results.csv`: Detailed WCAG results
  - `figures/`: Visualization outputs
- **`results/`**
  - `text_simplification_summary.csv`: Summary of simplification results
  - `text_simplification_detailed_results.csv`: Detailed simplification analysis
- **`figures/`**: Generated visualization images

### `/output` - Additional Outputs
- **`wcag_evaluation_results.csv`**: WCAG evaluation results
- **`wcag_metrics.json`**: WCAG metrics in JSON format

### `/public` - Static Assets
Public files served by the Next.js application (images, icons, etc.)

## Tech Stack

### Frontend
- **Next.js 16.0**: React framework with SSR
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **React Hook Form**: Form state management
- **next-themes**: Dark mode support
- **Lucide React**: Icon library

### Backend
- **Flask**: Python web framework
- **Flask-CORS**: Cross-Origin Resource Sharing
- **PyTorch & Transformers**: Deep learning models
- **HuggingFace**: Pre-trained models
- **pytesseract & pillow**: OCR and image processing
- **pdfplumber & PyPDF2**: PDF text extraction
- **Sentence Transformers**: Text similarity
- **deep-translator & Groq**: Translation services
- **spaCy**: NLP utilities
- **Assembly AI**: Speech-to-text
- **moviepy**: Video processing
- **textstat**: Text readability metrics

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## Installation

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The frontend runs on `http://localhost:3000` and the backend API runs on `http://localhost:5000`

## Scripts

### Frontend (`package.json`)
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## API Endpoints

The Flask backend provides various endpoints for:
- Document processing and text extraction
- Text simplification and readability enhancement
- Multi-language translation
- Bias detection in content
- WCAG compliance validation
- Accessibility feature generation
- Video and audio processing

## Universal Design for Learning (UDL)

This project implements UDL principles to ensure content is:
- **Perceivable**: Multiple ways to access information
- **Operable**: Navigable with various input methods
- **Understandable**: Clear, simplified language options
- **Robust**: Compatible with assistive technologies

