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

export async function getFilesS3(prefix: string) {

    const bucketName = process.env.AWS_S3_BUCKET || "";
    try {
        const allFiles = await s3.listObjectsV2({
            Bucket: 'my-vercelapp',
            Prefix: prefix
        }).promise();
        console.log("these are the total files: ",allFiles.Contents?.length);
        
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
    
    const folderPath = path.join(__dirname,`output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);

    await Promise.all(allFiles.map(async (file) => {
        await uploadFile(`dist/${id}/`+file.slice(folderPath.length+1),file);
    }))
    
    console.log("All files uploaded successfully!");
}





