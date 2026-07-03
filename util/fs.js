import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function getBgDir()
{
    const dotBg = path.join(process.cwd(), '.bg')
    try
    {
        await fs.access(dotBg)
        return dotBg
    }
    catch
    {
        try
        {
            await fs.access(path.join(process.cwd(), 'HEAD'))
            await fs.access(path.join(process.cwd(), 'objects'))
            return process.cwd()
        }
        catch
        {
            return dotBg
        }
    }
}

export const verifyRepo = async() =>
{
    const dir = await getBgDir()
    try
    {
        await fs.access(dir)
    }
    catch
    {
        throw new Error('NOT_A_REPO');
    }
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
    const bgDir = await getBgDir()
    const hash = crypto.createHash('sha1').update(content).digest('hex');

    const dirName = hash.substring(0,2);
    const fileName = hash.substring(2)

    const objectDir = path.join(bgDir, 'objects', dirName)
    const objectPath = path.join(objectDir, fileName)

    await fs.mkdir(objectDir, { recursive: true })
    await fs.writeFile(objectPath, content)

    return hash
}

export async function readObject(hash)
{
    const bgDir = await getBgDir()
    const dirName = hash.substring(0,2)
    const fileName = hash.substring(2)
    const objectPath = path.join(bgDir, 'objects', dirName, fileName)

    return await fs.readFile(objectPath, 'utf-8')
}

export async function readIndex()
{
    const bgDir = await getBgDir()
    const indexPath = path.join(bgDir, 'index.json')
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
    const bgDir = await getBgDir()
    const indexPath = path.join(bgDir, 'index.json')
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
}

export async function getHeadRef()
{
    const bgDir = await getBgDir()
    try
    {
        const headContent = await fs.readFile(path.join(bgDir, 'HEAD'), 'utf-8')

        const refPath = headContent.replace('ref:', '').trim();
        const branchPath = path.join(bgDir, refPath);

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
    const bgDir = await getBgDir()
    const headContent = await fs.readFile(path.join(bgDir, 'HEAD'), 'utf-8')
    const match = headContent.match(/^ref:\s*refs\/head\/(\S+)/)
    if(!match)
    {
        throw new Error('HEAD is in detached state or malformed')
    }
    return match[1]
}

export async function readRef(branchName)
{
    const bgDir = await getBgDir()
    const refPath = path.join(bgDir, 'refs', 'head', branchName)
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
