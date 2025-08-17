const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_DB_ACCESS_KEY,
  secretAccessKey: process.env.AWS_DB_SECRET_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const dynamodb = new AWS.DynamoDB();

async function createDeploymentStatusTable() {
  const params = {
    TableName: 'deployment-status',
    KeySchema: [
      {
        AttributeName: 'deploymentId',
        KeyType: 'HASH' 
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'deploymentId',
        AttributeType: 'S'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ DynamoDB table "deployment-status" created successfully!');
    console.log('Table ARN:', result.TableDescription.TableArn);
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Table "deployment-status" already exists');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function deleteDeploymentStatusTable() {
  const params = {
    TableName: 'deployment-status'
  };

  try {
    await dynamodb.deleteTable(params).promise();
    console.log('✅ DynamoDB table "deployment-status" deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting table:', error);
    throw error;
  }
}

const command = process.argv[2];

if (command === 'create') {
  createDeploymentStatusTable()
    .then(() => {
      console.log('🎉 Setup complete! You can now run RapidServe.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
} else if (command === 'delete') {
  deleteDeploymentStatusTable()
    .then(() => {
      console.log('🗑️  Table deleted successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deletion failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node setup-dynamodb.js create  - Create the deployment status table');
  console.log('  node setup-dynamodb.js delete  - Delete the deployment status table');
  console.log('');
  console.log('Make sure to set your AWS credentials in environment variables:');
  console.log('  AWS_DB_ACCESS_KEY=your_access_key');
  console.log('  AWS_DB_SECRET_KEY=your_secret_key');
  console.log('  AWS_REGION=ap-south-1');
}
