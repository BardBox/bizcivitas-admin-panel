## Bizcivitas Admin Panel

A modern React-based admin panel for Bizcivitas event management, built with TypeScript and Tailwind CSS.

# 🏗️ Architecture

This project features a **recently refactored modular architecture** that transforms a monolithic codebase into maintainable, reusable components and hooks.


## **Key Features**

- ✅ **Event Management**: Create, edit, delete, and manage events
- ✅ **Advanced Filtering**: Multi-level filtering by location, type, date, and payment
- ✅ **Real-time Updates**: Instant UI updates after CRUD operations
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- ✅ **Modular Hooks**: Separation of concerns with custom React hooks

## 📁 Project Structure

```
src/
├── hooks/                      # Custom React hooks
│   ├── useEventManagement.ts   # Event CRUD operations
│   ├── useEventFilters.ts      # Filtering logic
│   └── useEventForm.ts         # Form handling
├── components/
│   ├── events/                 # Event-specific components
│   │   ├── EventFilters.tsx    # Advanced filtering UI
│   │   └── EventFormModal.tsx  # Event creation/editing
│   └── ...                     # Other shared components
├── pages/
│   └── AllEvents/              # Main event management page
├── api/                        # API integration
├── constants/                  # App constants
├── utils/                      # Utility functions
└── EventInterface/             # TypeScript interfaces
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Stellarmind-AI/Bizcivitas-Admin-panel.git

# Navigate to project directory
cd Bizcivitas-Admin-panel

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Hooks + Context
- **HTTP Client**: Axios
- **Form Handling**: Custom hooks with validation
- **Icons**: Lucide React
- **Modal**: React Modal
- **Select Components**: React Select

## 📚 Documentation

### **Refactoring Guide**

See [REFACTORING.md](./REFACTORING.md) for detailed documentation about the recent architectural refactoring, including:

- Before/after comparison
- File structure breakdown
- Hook architecture
- Integration patterns
- Development workflow

### **Development Guidelines**

- Follow the modular hook pattern established in the refactoring
- Use TypeScript for all new code
- Maintain separation of concerns between filtering, CRUD operations, and forms
- Test components and hooks independently

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build test
npm run build
```

## 🔄 Recent Refactoring (2025)

This project underwent a major refactoring that:

- **Reduced main page complexity by 55%** (3,384 → 1,517 lines)
- **Created 8+ modular files** from a single monolithic component
- **Implemented proper separation of concerns**
- **Added comprehensive TypeScript support**
- **Established reusable hook patterns**

For complete details, see [REFACTORING.md](./REFACTORING.md).

## 🎯 Key Hooks

### `useEventManagement`

Handles all event CRUD operations, form submissions, and modal management.

### `useEventFilters`

Manages event filtering, search functionality, and filtered data display.

### `useEventForm`

Provides form validation, input handling, and form state management.

## 🔗 API Integration

The admin panel integrates with the Bizcivitas backend API for:

- Event management (CRUD operations)
- Community data fetching
- Location-based filtering
- Image upload handling
- User authentication

## 📱 Features

### Event Management

- Create new events with rich form validation
- Edit existing events with pre-populated data
- Delete events with confirmation dialogs
- Support for multiple event types (online, trip, one-day)

### Advanced Filtering

- Filter by country, state, and community
- Date range filtering
- Event type filtering
- Payment type filtering (free/paid)
- Real-time filter application

### User Experience

- Responsive design for all screen sizes
- Loading states and error handling
- Toast notifications for user feedback
- Intuitive navigation and UI patterns

## 🤝 Contributing

1. Follow the established modular architecture patterns
2. Use the existing hook patterns for new features
3. Maintain TypeScript strict mode compliance
4. Test both individual components and integration scenarios
5. Update documentation for significant changes

## 📄 License

This project is part of the Bizcivitas platform ecosystem.

## 🆘 Support

For technical questions about the refactored architecture, refer to:

1. [REFACTORING.md](./REFACTORING.md) - Comprehensive refactoring guide
2. TypeScript interfaces in `src/EventInterface/`
3. Hook documentation and examples
4. Component prop interfaces
