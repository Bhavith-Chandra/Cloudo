# Cloudo - Cloud Optimization Platform

A comprehensive cloud cost management and optimization platform that supports AWS, Azure, and GCP accounts.

## Features

- Multi-cloud account connection (AWS, Azure, GCP)
- Secure credential storage
- Interactive cost visualization
- Cost breakdown by service, region, and project
- Custom tagging and filtering
- Role-based access control
- Export options (PDF/CSV)
- Responsive design for web and mobile

## Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- Cloud provider accounts (AWS, Azure, GCP)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Bhavith-Chandra/cloudo.git
   cd cloudo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/             # Utility functions and configurations
├── prisma/          # Database schema and migrations
└── types/           # TypeScript type definitions
```

## Security

- Credentials are encrypted before storage
- HTTPS for all data in transit
- GDPR and SOC 2 compliant
- Role-based access control
- Secure session management

## API Documentation

### Connect Cloud Account

```http
POST /api/cloud/connect
Content-Type: application/json

{
  "provider": "aws" | "azure" | "gcp",
  "credentials": {
    // Provider-specific credentials
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
