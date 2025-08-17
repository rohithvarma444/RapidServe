# ⚡ RapidServe

A modern, Vercel-like deployment platform that allows you to deploy GitHub repositories instantly with a beautiful web interface.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?style=flat&logo=amazon-aws&logoColor=white)

## 🚀 Features

- **Instant Deployment**: Deploy GitHub repositories with a single click
- **Real-time Status Updates**: Monitor deployment progress in real-time
- **Beautiful UI**: Modern, responsive web interface with gradient designs
- **AWS Integration**: Leverages AWS S3 for file storage and SQS for deployment orchestration
- **Multi-service Architecture**: Scalable microservices architecture
- **TypeScript Support**: Full TypeScript implementation for type safety

## 🏗️ Architecture

RapidServe consists of four main services:

### 1. **Frontend** (`/frontend`)
- React + TypeScript + Vite application
- Beautiful, responsive UI for repository deployment
- Real-time status polling and progress tracking
- Form validation and error handling

### 2. **Upload Service** (`/Upload`)
- Express.js server handling repository uploads
- Clones GitHub repositories
- Uploads files to AWS S3
- Sends deployment messages to SQS queue
- **Port**: 3000

### 3. **Deploy Service** (`/Deploy`)
- AWS Lambda-like deployment service
- Processes SQS messages
- Builds and deploys applications
- Manages deployment lifecycle

### 4. **Request Handler** (`/Request-Handler`)
- Serves deployed applications
- AWS S3 integration for static file serving
- Dynamic routing based on deployment IDs
- **Port**: 3001

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS Account with S3 and SQS access
- Git

## 🔧 Environment Setup

### AWS Configuration

Create a `.env` file in each service directory with the following variables:

```env
# General AWS credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1

# DynamoDB specific credentials
AWS_DB_ACCESS_KEY=your_dynamodb_access_key_here
AWS_DB_SECRET_KEY=your_dynamodb_secret_key_here

# SQS configuration
AWS_SQS_URL=your_sqs_queue_url
AWS_SQS_ACCESS_KEY=your_sqs_access_key
AWS_SQS_SECRET_KEY=your_sqs_secret_key
AWS_SQS_REGION=ap-south-1
```

### Required AWS Resources

1. **S3 Bucket**: `my-vercelapp` (for storing deployed files)
2. **SQS Queue**: For deployment orchestration
3. **IAM User**: With S3 and SQS permissions

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RapidServe
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install Upload service dependencies
cd ../Upload
npm install

# Install Deploy service dependencies
cd ../Deploy
npm install

# Install Request Handler dependencies
cd ../Request-Handler
npm install
```

### 3. Set Up DynamoDB Table

```bash
# Create the deployment status table
node setup-dynamodb.js create
```

### 4. Start the Services

#### Start the Upload Service (Backend API)
```bash
cd Upload
npm run dev  # or node src/index.ts
```

#### Start the Request Handler (File Server)
```bash
cd Request-Handler
npm run dev  # or node src/index.ts
```

#### Start the Frontend
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Upload API**: http://localhost:3000
- **Request Handler**: http://localhost:3001

## 📖 Usage

### Deploying a Repository

1. **Open the Frontend**: Navigate to http://localhost:5173
2. **Enter GitHub URL**: Paste a valid GitHub repository URL (e.g., `https://github.com/username/repository`)
3. **Click Deploy**: The system will:
   - Clone the repository
   - Upload files to S3
   - Trigger deployment process
   - Provide real-time status updates
4. **Access Your App**: Once deployed, you'll receive a unique URL for your application

### Supported Repository Types

- Static websites (HTML, CSS, JS)
- React applications
- Vue.js applications
- Any frontend framework that builds to static files

## 🔄 API Endpoints

### Upload Service (`:3000`)

- `POST /repoUrl` - Deploy a GitHub repository
  - Body: `{ "repoUrl": "https://github.com/username/repo" }`
  - Response: `{ "deploymentId": "unique-id" }`

- `GET /status` - Get deployment status
  - Response: `{ "status": "completed|failed|deploying", "url": "deployment-url" }`

### Request Handler (`:3001`)

- `GET /*` - Serve deployed applications
  - Routes: `{deployment-id}.localhost:3001/*`

## 🛠️ Development

### Project Structure

```
RapidServe/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   └── package.json
├── Upload/                   # Repository upload service
│   ├── src/
│   │   ├── index.ts         # Express server
│   │   ├── utils.ts         # Utility functions
│   │   └── files.ts         # File handling
│   └── package.json
├── Deploy/                   # Deployment service
│   ├── src/
│   │   ├── index.ts         # Deployment logic
│   │   ├── builder.ts       # Build process
│   │   └── utils.ts         # Utilities
│   └── package.json
├── Request-Handler/          # File serving service
│   ├── src/
│   │   └── index.ts         # Express file server
│   └── package.json
└── README.md
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build all services
cd ../Upload && npm run build
cd ../Deploy && npm run build
cd ../Request-Handler && npm run build
```

## 🔍 Troubleshooting

### Common Issues

1. **AWS Credentials Error**
   - Ensure your `.env` files contain valid AWS credentials
   - Verify IAM permissions for S3 and SQS

2. **Port Already in Use**
   - Check if ports 3000, 3001, or 5173 are available
   - Kill existing processes or change ports in configuration

3. **Repository Clone Failures**
   - Ensure the GitHub repository is public
   - Check network connectivity
   - Verify repository URL format

4. **Deployment Timeout**
   - Check SQS queue configuration
   - Verify Deploy service is running
   - Monitor AWS CloudWatch logs

### Logs and Debugging

- **Upload Service**: Check console output for clone and upload status
- **Deploy Service**: Monitor SQS message processing
- **Request Handler**: Check S3 object retrieval logs
- **Frontend**: Use browser developer tools for network requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Vercel's deployment platform
- Built with modern web technologies
- AWS services for scalability and reliability

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review AWS documentation for service-specific issues

---

**Made with ❤️ for the developer community**