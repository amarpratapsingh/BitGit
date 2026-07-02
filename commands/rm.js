import path from 'path'
import { readIndex, writeIndex, verifyRepo, verifyTrack, dropFile } from '../util/fs.js';

export async function rm(fileName)
{
    const BG_DIR = path.join(process.cwd(), '.bg');
    try
    {
        await verifyRepo(BG_DIR)
        const index = await readIndex();
        verifyTrack(index, fileName);

        await dropFile(fileName);
        delete index[fileName];
        await writeIndex(index);
    }
    catch(err)
    {
        if(err.message === 'NOT_A_REPO')
        {
            console.error(`Error Encountered: ${process.cwd()} is not a BitGit Repository.`)
        }
        else if(err.message === 'NOT_BEING_TRACKED')
        {
            console.error(`Error Encountered: ${fileName} is not being tracked.`)
        }
        else
        {
            console.error(`Error Encountered: ${err.message}`)
        }
        process.exit(1);
    }
}
