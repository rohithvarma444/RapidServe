import express from "express";
import { S3 } from "aws-sdk";
import dotenv from "dotenv"

dotenv.config();

const s3 = new S3({
        region: 'ap-south-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;

    console.log(id);
    console.log(filePath);

    const contents = await s3.getObject({
        Bucket: 'my-vercelapp',
        Key: `dist/${id}${filePath}`
    }).promise();
    
    const type = filePath.endsWith("html") ? "text/html" : 
                 filePath.endsWith("css") ? "text/css" : 
                 filePath.endsWith("svg") ? "image/svg+xml" :
                 filePath.endsWith("js") ? "application/javascript" :
                 filePath.endsWith("json") ? "application/json" :
                 filePath.endsWith("png") ? "image/png" :
                 filePath.endsWith("jpg") ? "image/jpeg" :
                 filePath.endsWith("gif") ? "image/gif" :
                 filePath.endsWith("woff") ? "font/woff" :
                 filePath.endsWith("woff2") ? "font/woff2" :
                 filePath.endsWith("ttf") ? "font/ttf" :
                 "text/plain";
    
    res.set("Content-Type", type);
    res.send(contents.Body);
})

app.listen(3001);
