# RapidServe

A modern deployment platform for instant GitHub repository deployment with real-time monitoring and AWS integration.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?style=flat&logo=amazon-aws&logoColor=white)

## Features

- Instant GitHub repository deployment
- Real-time deployment status monitoring
- Modern, responsive web interface
- AWS S3 and SQS integration
- Microservices architecture
- TypeScript implementation

## Architecture

RapidServe consists of four core services:

### Frontend (`/frontend`)
React + TypeScript + Vite application with real-time status polling and form validation.

### Upload Service (`/Upload`)
Express.js server handling repository uploads, GitHub cloning, S3 file uploads, and SQS message queuing.
**Port**: 3000

### Deploy Service (`/Deploy`)
AWS Lambda-like deployment service processing SQS messages and managing application builds.

### Request Handler (`/Request-Handler`)
Static file serving service with S3 integration and dynamic routing.
**Port**: 3001

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS Account with S3 and SQS access
- Git

## Environment Setup

### AWS Configuration

Create `.env` files in each service directory:

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1
AWS_DB_ACCESS_KEY=your_dynamodb_access_key_here
AWS_DB_SECRET_KEY=your_dynamodb_secret_key_here
AWS_SQS_URL=your_sqs_queue_url
AWS_SQS_ACCESS_KEY=your_sqs_access_key
AWS_SQS_SECRET_KEY=your_sqs_secret_key
AWS_SQS_REGION=ap-south-1
```

### Required AWS Resources

- S3 Bucket: `my-vercelapp`
- SQS Queue for deployment orchestration
- IAM User with S3 and SQS permissions

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd RapidServe

# Install dependencies for all services
cd frontend && npm install
cd ../Upload && npm install
cd ../Deploy && npm install
cd ../Request-Handler && npm install
```

### 2. Set Up DynamoDB

```bash
cd Upload
node setup-dynamodb.js create
```

### 3. Start Services

```bash
# Upload Service (Backend API)
cd Upload && npm run dev

# Request Handler (File Server)
cd Request-Handler && npm run dev

# Frontend
cd frontend && npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- Upload API: http://localhost:3000
- Request Handler: http://localhost:3001

## Usage

1. Navigate to http://localhost:5173
2. Enter a GitHub repository URL
3. Click "Deploy Now"
4. Monitor real-time deployment progress
5. Access your deployed application via the generated URL

### Supported Applications

- Static websites (HTML, CSS, JS)
- React applications
- Vue.js applications
- Any frontend framework with static build output

## API Reference

### Upload Service (`:3000`)

**POST /repoUrl**
Deploy a GitHub repository
```json
{
  "repoUrl": "https://github.com/username/repo"
}
```

**GET /status?id={deploymentId}**
Get deployment status
```json
{
  "status": "completed|failed|deploying",
  "message": "Status message",
  "url": "deployment-url",
  "error": "error-message"
}
```

### Request Handler (`:3001`)

**GET /***
Serve deployed applications at `{deployment-id}.localhost:3001/*`

## Project Structure

```
RapidServe/
├── frontend/                 # React frontend application
├── Upload/                   # Repository upload service
├── Deploy/                   # Deployment service
├── Request-Handler/          # File serving service
└── README.md
```

## Development

### Building for Production

```bash
cd frontend && npm run build
cd ../Upload && npm run build
cd ../Deploy && npm run build
cd ../Request-Handler && npm run build
```

## Troubleshooting

### Common Issues

**AWS Credentials Error**
- Verify `.env` files contain valid AWS credentials
- Check IAM permissions for S3 and SQS

**Port Conflicts**
- Ensure ports 3000, 3001, and 5173 are available
- Kill existing processes or modify port configuration

**Repository Access**
- Ensure GitHub repository is public
- Verify repository URL format
- Check network connectivity

**Deployment Failures**
- Monitor SQS queue configuration
- Verify Deploy service is running
- Check AWS CloudWatch logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Review the troubleshooting section
- Check AWS documentation for service-specific issues