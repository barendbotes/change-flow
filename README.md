# ABOUT ME

I am a complete novice "coder" who used Cursor for a lot of the code in this project. Please do not judge my coding style and if there are any bugs, I might be able to fix them, hopefully someone from the community can help.

That said, I guess thank you for either your insult or your contribution. Real men commit to main!

# Change Flow

Change Flow is a modern web application built with Next.js that manages and streamlines IT change requests and asset requests within an organization. It provides a robust approval workflow system, file management, and integration capabilities.

## Overview

The application allows organizations to:

- Submit and manage IT change requests
- Handle asset requests
- Implement multi-level approval workflows
- Manage files and attachments securely
- Control access through role-based permissions
- Integrate with external systems

## Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/barendbotes/change-flow.git
cd change-flow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/change_flow"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# File Storage
STORAGE_PATH="/path/to/storage"
UPLOADS_PATH="/path/to/public/uploads"
```

5. Run database migrations:

```bash
npm run db:migrate
```

6. Start the development server:

```bash
npm run dev
```

## Initial Setup Scripts

### Create Default Groups

```bash
npm run setup:db
```

This will create the following default groups:

- IT
- Corporate

### Create Admin User

```bash
npm run setup:admin -- --email="admin@example.com" --password="securepassword"
```

## File Storage System

The application uses a two-tier file storage system:

### Storage Directories

- **Permanent Storage**: `/storage/files/` - Secure, permanent file storage
- **Temporary Access**: `/public/uploads/` - Temporary file access with token-based security

### Security Features

- Token-based file access
- 15-minute token expiration
- Secure file paths
- Automatic cleanup of temporary files

## API Endpoints

### Authentication

- `POST /api/auth/[...nextauth]` - Authentication endpoints

### Requests

- `POST /api/requests/change` - Submit change request
- `POST /api/requests/asset` - Submit asset request
- `GET /api/requests/{id}` - Get request details
- `PATCH /api/requests/{id}` - Update request

### Approvals

- `PATCH /api/approvals/{id}` - Update approval status
- `GET /api/approvals` - List approvals

### Files

- `POST /api/files/token` - Generate file access token
- `GET /api/files/download` - Download file with token
- `POST /api/upload` - Upload file
- `GET /api/cron/cleanup` - Cleanup temporary files

## Current Progress

### Completed Features

- ✅ Database setup with Drizzle ORM and PostgreSQL
- ✅ Authentication with NextAuth.js
- ✅ Server/Client separation
- ✅ Authentication middleware
- ✅ Protected API endpoints
- ✅ IT Change Request workflow
- ✅ Admin dashboard
- ✅ Approval system
- ✅ File management system
- ✅ Role-based access control
- ✅ Basic dashboard

## Roadmap

### Clean UP

- [ ] Clean up and Standardize
  - Move all zod schema's to `/schema/index.ts`
  - Separate server actions into clear actions in `/actions/`
  - Separate server data retrievals clearly in `/data/`
  - Ensure data retrieval done via component props
  - Go through all API endpoints to ensure correct RBAC
  - Go through all dashboard, requests, admin and reports pages and implement correct RBAC
  - Maybe look at better RBAC management
  - Convert more pages and functions into reusable components

### Integration Plugins

- [ ] N8N Integration
  - Custom workflow automation
  - Event triggers
  - Action handlers
- [ ] SMTP Configuration
  - Email notifications
  - Custom templates
- [ ] Resend Integration
  - Modern email delivery
  - Email analytics

### Notification System

- [ ] Webhook notifications for:
  - Request submissions
  - Approval updates
  - Status changes
  - File uploads

### Administration

- [ ] Group Management UI
  - Create/Edit groups
  - Assign members
  - Set permissions
- [ ] Request Type Configuration
  - Custom form builder
  - Workflow designer
  - Field validation rules

### Authentication Providers

- [ ] Azure AD Integration
  - Group synchronization
  - User import
  - Manager attributes
- [ ] Google Workspace Integration
  - Directory sync
  - Group mapping
  - Automatic approver assignment

### Additional Features

- [ ] Asset Request Implementation
  - Custom form fields
  - Asset tracking
  - Inventory integration
- [ ] Export Functionality
  - CSV export
  - Branded PDF reports
  - Custom templates

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
