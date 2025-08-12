# SQL Template Generator

A modern React web application for generating SQL code for Data Vault 2.0 objects (Hub, Satellite, Link, PIT) using customizable templates with variable placeholders.

## Features

- **Template Selection**: Choose from predefined Data Vault 2.0 templates (Hub, Satellite, Link, PIT)
- **Dynamic Input Forms**: Automatically generated forms based on selected template variables
- **Live SQL Preview**: Real-time SQL generation with syntax highlighting using Monaco Editor
- **Copy to Clipboard**: One-click copying of generated SQL code
- **Extensible Template System**: Easy to add new templates via JSON configuration
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with Material Design principles

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sql-template-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Basic Workflow

1. **Select a Template**: Choose from Hub, Satellite, Link, or PIT templates in the dropdown
2. **Configure Variables**: Fill in the required fields that appear dynamically based on your template selection
3. **View Generated SQL**: The SQL code is generated in real-time in the right panel with syntax highlighting
4. **Copy SQL**: Click the "Copy SQL" button to copy the generated code to your clipboard

### Template Types

#### Hub Template
Creates a Hub table that represents a unique business concept:
- **Required Fields**: Table name, Business keys, Hash key name, Source table
- **Optional Fields**: Load date column, Record source

#### Satellite Template  
Creates a Satellite table for descriptive attributes:
- **Required Fields**: Table name, Parent hash key, Descriptive fields, Source table
- **Optional Fields**: Load date column, Record source

#### Link Template
Creates a Link table for relationships between entities:
- **Required Fields**: Table name, Link hash key, Hub hash keys, Source table
- **Optional Fields**: Load date column, Record source

#### Point-in-Time (PIT) Template
Creates a PIT table for snapshot views:
- **Required Fields**: Table name, Hub hash key, Satellite tables
- **Optional Fields**: Snapshot date column

#### Stage View Template
Creates a comprehensive staging view with Data Vault calculations:
- **Required Fields**: View name, Source table, Source columns, Hash keys configuration
- **Optional Fields**: Schema name, Hash diffs configuration, Load date settings, Record source settings
- **Features**: Automatic hash key/diff calculation, Ghost records (unknown/error), Flexible load date and record source options

### Multi-Value Fields

Some fields support multiple values (like business keys or descriptive fields):
- Click the "+" button to add additional fields
- Click the "×" button to remove fields (minimum of one required)
- All non-empty values will be included in the generated SQL

## Project Structure

```
src/
├── components/
│   ├── FormField.jsx      # Dynamic form field component
│   ├── SqlPreview.jsx     # SQL preview with Monaco Editor
│   ├── HashKeyConfigField.jsx    # Hash key configuration component
│   └── HashDiffConfigField.jsx   # Hash diff configuration component
├── utils/
│   └── templateEngine.js  # Template processing logic
├── templates.json         # Template definitions
├── App.jsx               # Main application component
├── main.jsx              # React entry point
└── index.css             # Global styles
public/
└── templates/
    └── stage_view.sql     # External SQL template file
```

## Extending the Application

### Adding New Templates

Templates can be defined inline or as external files for better maintainability.

#### Inline Templates
1. Open `src/templates.json`
2. Add a new template object with the following structure:

```json
"template_key": {
  "name": "Template Display Name",
  "description": "Brief description of what this template does",
  "fields": [...],
  "template": "SQL template with {{variable}} placeholders"
}
```

#### External Template Files (Recommended for complex templates)
1. Create a new `.sql` file in `public/templates/`
2. In `src/templates.json`, reference the external file:

```json
"template_key": {
  "name": "Template Display Name", 
  "description": "Brief description of what this template does",
  "fields": [...],
  "template": "file:your_template.sql"
}
```

#### Field Types

- **text**: Single text input field
- **multi-text**: Multiple text input fields (for arrays)
- **checkbox**: Boolean checkbox input
- **hashkey-config**: Complex hash key configuration with business keys
- **hashdiff-config**: Complex hash diff configuration with columns

### Template Variables

Templates support the following variable syntax:
- `{{variable_name}}` - Simple variable substitution
- `{{#array_name}}...{{/array_name}}` - Loop over array values
- `{{.}}` - Current array item within a loop
- `{{@index}}` - Array index within a loop
- `{{current_date}}` - Automatically added current date

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server  
- **Monaco Editor**: VS Code editor for syntax highlighting
- **Lucide React**: Modern icon library
- **CSS Grid & Flexbox**: Responsive layout

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions, issues, or feature requests, please open an issue on the GitHub repository.