import fs from "fs"
import path from "path"

export function getAllFile(dirPath: string): string[]  {
    const response: string[] = []
    const files = fs.readdirSync(dirPath);
    for(const file of files){
        const filePath = path.join(dirPath, file);
        if(fs.statSync(filePath).isDirectory()){
            response.push(...getAllFile(filePath));
        }else{
            response.push(filePath);
        }
    }

    return response;
}