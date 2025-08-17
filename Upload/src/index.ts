import express from 'express'
import {generate, sendMessageToSQS, uploadFile, createDeploymentStatus, updateDeploymentStatus, getDeploymentStatus} from './utils'
import simpleGit from 'simple-git'
import { getAllFile } from './files';
import fs from 'fs';
import path from 'path';         

const app = express()
const port = 3000

app.use(express.urlencoded({extended: true}))
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/repoUrl', async (req,res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();

    
    try {
        await createDeploymentStatus(id, repoUrl);
        await updateDeploymentStatus(id, 'cloning', 'Cloning repository...');
        const outputPath = path.join(__dirname, '..', 'output', id);
        
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }
        
        const git = simpleGit();
        await git.clone(repoUrl, outputPath);
        console.log("git clone completed");
        
        await updateDeploymentStatus(id, 'uploading', 'Uploading files to S3...');
        
        const files = await getAllFile(outputPath);
        console.log(files[0]);

        await Promise.all(files.map(async (file) => {
            const relativePath = path.relative(outputPath, file);
            await uploadFile(`output/${id}/${relativePath}`, file);
        }));
        console.log("all the files are uploaded");
        
        await updateDeploymentStatus(id, 'queued', 'Files uploaded, queued for deployment...');
        await sendMessageToSQS(id);
        
        return res.json({
            deploymentId: id
        });
        
    } catch (error) {
        console.error('Deployment error:', error);
        
        await updateDeploymentStatus(id, 'failed', 'Deployment failed', error instanceof Error ? error.message : 'Unknown error');
        
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            deploymentId: id
        });
    }
});

app.get('/status', async (req, res) => {
    const deploymentId = req.query.id as string;  
    if (!deploymentId) {
        return res.status(400).json({
            error: 'Deployment ID is required'
        });
    }
    
    try {
        const status = await getDeploymentStatus(deploymentId);
        
        if (!status) {
            return res.status(404).json({
                error: 'Deployment not found'
            });
        }
        
        const response = {
            status: status.status,
            message: status.message,
            url: status.url,
            error: status.error
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({
            error: 'Failed to get deployment status'
        });
    }
});

app.listen(port, () => {
    console.log(`Upload service running on port ${port}`);
});

