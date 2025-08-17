import { S3 } from "aws-sdk";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import path, { dirname, join } from "path";
import dotenv from "dotenv"
import fs from "fs"
dotenv.config();

const s3 = new S3({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new (require('aws-sdk')).DynamoDB.DocumentClient({
        accessKeyId: process.env.AWS_DB_ACCESS_KEY,
        secretAccessKey: process.env.AWS_DB_SECRET_KEY,
        region: process.env.AWS_REGION || "ap-south-1",
});

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

  // Add error if provided
  if (error) {
    updateExpression.push('#error = :error');
    expressionAttributeNames['#error'] = 'error';
    expressionAttributeValues[':error'] = error;
  }

  // Add URL if provided
  if (url) {
    updateExpression.push('#url = :url');
    expressionAttributeNames['#url'] = 'url';
    expressionAttributeValues[':url'] = url;
  }

  const params = {
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

export async function getFilesS3(prefix: string) {

    const bucketName = process.env.AWS_S3_BUCKET || "";
    try {
        const allFiles = await s3.listObjectsV2({
            Bucket: 'my-vercelapp',
            Prefix: prefix,
        }).promise();
        if (!allFiles.Contents) {
            console.log("No files found with prefix:", prefix);
            return;
        }
        const allPromises = allFiles.Contents.map(async (object) => {
            return new Promise<void>(async (resolve) => {
                if (!object.Key) {
                    resolve();
                    return;
                }
                
                const finalOutputPath = join(process.cwd(), object.Key);
                const outputFile = createWriteStream(finalOutputPath);
                const dirName = dirname(finalOutputPath);
                
                if (!existsSync(dirName)) {
                    mkdirSync(dirName, { recursive: true });
                }
                
                s3.getObject({
                    Bucket: 'my-vercelapp',
                    Key: object.Key
                }).createReadStream().pipe(outputFile).on("finish", () => {
                    console.log("Downloaded:", object.Key);
                    resolve();
                });
            });
        });

        console.log("Downloading files...");
        await Promise.all(allPromises);
        console.log("All files downloaded successfully!");
        
    } catch (error) {
        console.error("Error downloading files:", error);
        throw error;
    }
}

function getAllFiles(dirPath: string): string[]  {
    const response: string[] = []
    const files = fs.readdirSync(dirPath);
    for(const file of files){
        const filePath = path.join(dirPath, file);
        if(fs.statSync(filePath).isDirectory()){
            response.push(...getAllFiles(filePath));
        }else{
            response.push(filePath);
        }
    }

    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "my-vercelapp",
        Key: fileName,
    }).promise();
    console.log(response);
}

export async function uploadBuildFiles(id: string){
    
    const folderPath = path.join(__dirname,`../output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);

    await Promise.all(allFiles.map(async (file) => {
        const relativePath = file.slice(folderPath.length + 1);
        await uploadFile(`dist/${id}/${relativePath}`, file);
    }))
    
    console.log("All files uploaded successfully!");
}




