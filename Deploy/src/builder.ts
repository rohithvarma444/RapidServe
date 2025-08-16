import path from "path";
import fs from "fs";
import { exec, spawn } from 'child_process'

export function buildProject(id: string){
    return new Promise((resolve, reject) => {  
        const child = exec(`cd ${path.join(__dirname,`output/${id}`)} && npm install && npm run build`)

        child.stdout?.on('data', function(data){
            console.log('stdout: ' + data);
        })
        child.stderr?.on('data', function(data){
            console.log('stderr: ' + data);
        })

        child.on('close', function(code){
            if(code === 0){
                resolve("");
            }
            else{
                reject("Build failed");
            }
        }) 
    })
}  

