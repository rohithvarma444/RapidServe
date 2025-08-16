import aws from 'aws-sdk'
import dotenv from "dotenv"
dotenv.config()

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
        const id = res?.Messages?.[0].Body
        console.log(id);
    }
}

