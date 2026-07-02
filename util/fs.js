import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const BG_DIR = path.join(process.cwd(), '.bg')

export const verifyRepo = async(dir) =>
{
    return fs.access(dir).catch(() =>
    {
        throw new Error('NOT_A_REPO');
    });
}
export const verifyTrack = (index, file) =>
{
    if(!index[file])
    {
        throw new Error('NOT_BEING_TRACKED');
    }
}
export const dropFile = async(file) =>
{
    await fs.unlink(path.join(process.cwd(), file)).catch(() =>
    {
        return null;
    });
}

export async function hashAndStore(content)
{
    const hash = crypto.hash('sha1', content, 'hex');

    const dirName = hash.substring(0,2);
    const fileName = hash.substring(2)

    const objectDir = path.join(BG_DIR, 'objects', dirName)
    const objectPath = path.join(objectDir, fileName)

    await fs.mkdir(objectDir, { recursive: true })
    await fs.writeFile(objectPath, content)

    return hash
}

export async function readObject(hash)
{
    const dirName = hash.substring(0,2)
    const fileName = hash.substring(2)
    const objectPath = path.join(BG_DIR, 'objects', dirName, fileName)

    return await fs.readFile(objectPath, 'utf-8')
}

export async function readIndex()
{
    const indexPath = path.join(BG_DIR, 'index.json')
    try
    {
        const data = await fs.readFile(indexPath, 'utf-8')
        return JSON.parse(data);
    }
    catch(err)
    {
        if(err.code === 'ENOENT')
        {
            return {};
        }
        console.error(`Error Encountered: ${err}`)
    }
}

export async function writeIndex(indexData)
{
    const indexPath = path.join(BG_DIR, 'index.json')
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
}

export async function getHeadRef()
{
    try
    {
        const headContent = await fs.readFile(path.join(BG_DIR, 'HEAD'), 'utf-8')

        const refPath = headContent.replace('ref:', '').trim();
        const branchPath = path.join(BG_DIR, refPath);

        let parentHash = null
        try
        {
            parentHash = (await fs.readFile(branchPath, 'utf-8')).trim();
        }
        catch {}
        return { branchPath, parentHash };
    }
    catch
    {
        throw new Error('Could not read HEAD reference')
    }
}

export async function createTreeObject()
{
    const index = await readIndex()
    if(Object.keys(index).length === 0)
    {
        throw new Error('Nothing to commit')
    }
    const format = JSON.stringify(index)
    const treeHash = await hashAndStore(format)
    return treeHash;
}

export async function getCurrBranch()
{
    const headContent = await fs.readFile(path.join(BG_DIR, 'HEAD'), 'utf-8')
    const match = headContent.match(/^ref:\s*refs\/head\/(\S+)/)
    if(!match)
    {
        throw new Error('HEAD is in detached state or malformed')
    }
    return match[1]
}

export async function readRef(branchName)
{
    const refPath = path.join(BG_DIR, 'refs', 'head', branchName)
    return (await fs.readFile(refPath, 'utf-8')).trim()
}

export async function getCommitTree()
{
    const { parentHash } = await getHeadRef()
    if(!parentHash)
    {
        return {}
    }
    const commit = await readObject(parentHash)
    const treeHash = commit.match(/^tree: (.+)/m)?.[1]
    if(!treeHash)
    {
        return {}
    }
    return JSON.parse(await readObject(treeHash))
}
