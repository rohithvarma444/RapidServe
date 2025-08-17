import aws from "aws-sdk";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv'
dotenv.config();

const MAX_LEN = 5;

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-south-1",
});

const dynamodb = new aws.DynamoDB.DocumentClient({
  accessKeyId: process.env.AWS_DB_ACCESS_KEY,
  secretAccessKey: process.env.AWS_DB_SECRET_KEY,
  region: process.env.AWS_REGION || "ap-south-1",
});

console.log(process.env.AWS_REGION);
console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);
console.log(process.env.AWS_SQS_URL);
console.log(process.env.AWS_SQS_ACCESS_KEY);
console.log(process.env.AWS_SQS_SECRET_KEY);

export function generate() {
  const chars = "1234567890qwertyuiopasdfghjklzxcvbnm";
  let id = "";
  for (let i = 0; i < MAX_LEN; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function createDeploymentStatus(deploymentId: string, repoUrl: string) {
  const params: aws.DynamoDB.DocumentClient.PutItemInput = {
    TableName: 'deployment-status',
    Item: {
      deploymentId: deploymentId,
      repoUrl: repoUrl,
      status: 'cloning',
      message: 'Repository cloning in progress...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null,
      url: null
    }
  };

  try {
    await dynamodb.put(params).promise();
    console.log(`Created deployment status for ${deploymentId}`);
  } catch (error) {
    console.error('Error creating deployment status:', error);
    throw error;
  }
}

export async function updateDeploymentStatus(deploymentId: string, status: string, message: string, error?: string, url?: string) {
  const updateExpression: string[] = ['SET #status = :status, #message = :message, #updatedAt = :updatedAt'];
  const expressionAttributeNames: { [key: string]: string } = {
    '#status': 'status',
    '#message': 'message',
    '#updatedAt': 'updatedAt'
  };
  const expressionAttributeValues: { [key: string]: any } = {
    ':status': status,
    ':message': message,
    ':updatedAt': new Date().toISOString()
  };

  if (error) {
    updateExpression.push('#error = :error');
    expressionAttributeNames['#error'] = 'error';
    expressionAttributeValues[':error'] = error;
  }

  if (url) {
    updateExpression.push('#url = :url');
    expressionAttributeNames['#url'] = 'url';
    expressionAttributeValues[':url'] = url;
  }

  const params: aws.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: 'deployment-status',
    Key: {
      deploymentId: deploymentId
    },
    UpdateExpression: updateExpression.join(', '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };

  try {
    await dynamodb.update(params).promise();
    console.log(`Updated deployment status for ${deploymentId}: ${status}`);
  } catch (error) {
    console.error('Error updating deployment status:', error);
    throw error;
  }
}

export async function getDeploymentStatus(deploymentId: string) {
  const params: aws.DynamoDB.DocumentClient.GetItemInput = {
    TableName: 'deployment-status',
    Key: {
      deploymentId: deploymentId
    }
  };

  try {
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('Error getting deployment status:', error);
    throw error;
  }
}

export async function uploadFile(fileName: string, filePath: string) {
  aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "ap-south-1",
  });

  const s3 = new aws.S3({ apiVersion: "2006-03-01" });
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found at path: ${resolvedPath}`);
  }

  const fileStream = fs.createReadStream(resolvedPath);
  await new Promise<void>((resolve, reject) => {
    fileStream.once("error", reject);
    fileStream.once("open", () => resolve());
  });

  console.log("uploading file: ", fileName);
  const params: aws.S3.PutObjectRequest = {
    Bucket: "my-vercelapp",
    Key: fileName,
    Body: fileStream,
  };

  const result = await s3.upload(params).promise();
  return {
    bucket: result.Bucket,
    key: result.Key,
    etag: result.ETag,
    location: result.Location,
  };
}

export async function sendMessageToSQS(message: string){
    const sqs = new aws.SQS({
        accessKeyId: process.env.AWS_SQS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SQS_SECRET_KEY,
        region: process.env.AWS_REGION || "ap-south-1",
        apiVersion: "2012-11-05",
    })

    const params : aws.SQS.SendMessageRequest = {
        MessageBody: JSON.stringify(message),
        QueueUrl: process.env.AWS_SQS_URL as string,
        MessageGroupId: "1",
        MessageDeduplicationId: generate(),
    }

    return new Promise((resolve, reject) => {
        sqs.sendMessage(params, (err, data) => {
            if(err){
                console.log(err);
                reject(err);
            }else{
                console.log(data);
                resolve(data);
            }
        })
    })
}
