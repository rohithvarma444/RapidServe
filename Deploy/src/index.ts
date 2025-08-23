import aws from 'aws-sdk'
import { uploadBuildFiles, getFilesS3, updateDeploymentStatus } from './utils'
import { buildProject } from './builder'


const sqs = new aws.SQS({
    region: process.env.AWS_SQS_REGION,
    accessKeyId: process.env.AWS_SQS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SQS_SECRET_KEY,
})

const queueUrl = process.env.AWS_SQS_URL
const params : aws.SQS.ReceiveMessageRequest = {
    QueueUrl: queueUrl as string,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    MessageAttributeNames: [
        "All"
    ],
    VisibilityTimeout: 60,
}

async function main(){
    while(1){
        const res = await sqs.receiveMessage(params).promise();
        console.log("here's the response form sqs", res);
        if(res.Messages?.length == 0){
            console.log("Nothing found on the queue");
            continue;            
        }
        const rawId = res.Messages?.[0].Body as string;
        const id = JSON.parse(rawId) as string;
        if(id){
            try{
                await updateDeploymentStatus(id, 'downloading', 'Downloading files from S3...');
                await getFilesS3(`output/${id}/`);
                
                await updateDeploymentStatus(id, 'building', 'Building project...');
                
                await buildProject(id);
                console.log("successfully installed all the file of deployement: ",id);
                
                try{
                    await sqs.deleteMessage({
                    QueueUrl: queueUrl as string,
                    ReceiptHandle: res?.Messages?.[0].ReceiptHandle as string,
                }).promise();
                console.log("successfully deleted the message from queue: ",id);
                }catch(err){
                    console.log("error in deleting the message from queue: ",id);
                    await updateDeploymentStatus(id, 'failed', 'Failed to delete SQS message', err instanceof Error ? err.message : 'Unknown error');
                }
                
                await updateDeploymentStatus(id, 'uploading_build', 'Uploading build files...');
                
                try{
                    await uploadBuildFiles(id);
                    await updateDeploymentStatus(id, 'completed', 'Deployment completed successfully!');
                }catch(err){
                    console.log("error in uploading the files: ",id);
                    await updateDeploymentStatus(id, 'failed', 'Failed to upload build files', err instanceof Error ? err.message : 'Unknown error');
                }
                
            }catch(err){
                console.log("error in installing files: ",id);
                await updateDeploymentStatus(id, 'failed', 'Failed to process deployment', err instanceof Error ? err.message : 'Unknown error');
            }
        }
    }
}

main();

