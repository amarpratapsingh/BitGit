import fs from 'fs/promises'
import { hashAndStore, readIndex, writeIndex} from '../util/fs.js'

export async function add(fileName)
{
    let content
    try
    {
        content = await fs.readFile(fileName, `utf-8`)
    }
    catch
    {
        console.error(`Error: '${fileName}' does not exist or is not a file`)
        process.exit(1)
    }
    const fileHash = await hashAndStore(content)
    const fileIndex = await readIndex()

    fileIndex[fileName] = fileHash;

    await writeIndex(fileIndex);
    console.log(`Staged: ${fileName}`)
}
