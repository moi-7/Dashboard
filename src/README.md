# Customer Dashboard

A modern, responsive customer dashboard built with React, Tailwind CSS, and Vite.

## Features

- **Data Grid**: Advanced table with sorting, filtering, and bulk actions using Grid.js.
- **Data Visualization**: Interactive charts (Line, Bar, Pie) using Recharts.
- **Customization**:
  - Drag-and-drop widget layout.
  - Widget resizing (full/half width).
  - Customizable chart themes and colors.
  - Column visibility and complex filtering.
- **Data Management**:
  - CSV Import/Export.
  - Add/Edit customer forms with validation.
  - Bulk delete and export capabilities.
- **Dark Mode**: Fully supported system-wide dark mode with a modern aesthetic.
- **Persistence**: Local storage persistence for all user preferences (layout, theme, filters).

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository (if applicable) or download the source code.
2. Navigate to the project directory.
3. Install dependencies:

```bash
npm install
```

### Running Locally

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- **/components**: Reusable UI components (Sidebar, TopBar, Charts, Table, Modals).
- **/styles**: Global styles and Tailwind configuration.
- **App.tsx**: Main application entry point and layout shell.

## Technologies Used

- **React**: UI Library
- **Tailwind CSS**: Utility-first CSS framework
- **Grid.js**: Advanced table plugin
- **Recharts**: Composable charting library
- **React Hook Form**: Form state management and validation
- **React DnD**: Drag and drop primitives
- **Lucide React**: Icon set
- **Faker.js**: Mock data generation
- **Papa Parse**: CSV parsing and export