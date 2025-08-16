import express from 'express'
import {generate, sendMessageToSQS, uploadFile} from './utils'
import simpleGit from 'simple-git'
import { getAllFile } from './files';         

const app = express()
const port = 3000

app.use(express.urlencoded({extended: true}))
app.use(express.json());


app.post('/repoUrl', async (req,res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl, `output/${id}`);
    console.log("git clone completed");
    const files = await getAllFile(`output/${id}`);
    
    console.log(files[0]);

    try{
        await Promise.all(files.map(async (file) => {
            await uploadFile(file, file);
        }));
        console.log("all the files are uploaded");
    }catch(err){
        console.log(err);
        return res.status(500).json({
            error: err
        })
    }

    await sendMessageToSQS(id);
    return res.json({
        deployementId: id
    });
})


app.listen(port);

