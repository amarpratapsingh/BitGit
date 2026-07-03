import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { readObject, readIndex, getHeadRef, getCurrBranch, getBgDir } from '../util/fs.js'

async function hasUnstagedChanges()
{
    const index = await readIndex()
    for(const [file, hash] of Object.entries(index))
    {
        let content
        try
        {
            content = await fs.readFile(path.join(process.cwd(), file), 'utf-8')
        }
        catch
        {
            return true
        }
        if(crypto.createHash('sha1').update(content).digest('hex') !== hash)
        {
            return true
        }
    }
    return false
}

async function restoreWorkingTree(commitHash)
{
    const bgDir = await getBgDir()
    const commit = await readObject(commitHash)
    const treeHash = commit.match(/^tree: (.+)/m)?.[1]
    if(!treeHash)
    {
        throw new Error('Invalid commit: no Tree')
    }

    const tree = JSON.parse(await readObject(treeHash))

    for(const [file, fileHash] of Object.entries(tree))
    {
        const content = await readObject(fileHash)
        await fs.writeFile(path.join(process.cwd(), file), content)
    }

    const indexPath = path.join(bgDir, 'index.json')
    await fs.writeFile(indexPath, JSON.stringify(tree, null, 2))
}

async function updateHead(branchName)
{
    const bgDir = await getBgDir()
    await fs.writeFile(path.join(bgDir, 'HEAD'), `ref: refs/head/${branchName}\n`)
}

export async function switchBranch(name)
{
    const refsDir = path.join(await getBgDir(), 'refs', 'head')
    const branchPath = path.join(refsDir, name)
    try
    {
        await fs.access(branchPath)
    }
    catch
    {
        console.error(`Error: branch '${name}' not found`)
        process.exit(1);
    }

    const currentBranch = await getCurrBranch()
    if(name === currentBranch)
    {
        console.log(`Already on branch '${name}'`)
        return;
    }

    if(await hasUnstagedChanges())
    {
        console.error('Error: you have unstaged changes. Commit or stash them before switching branches')
        process.exit(1)
    }

    const commitHash = (await fs.readFile(branchPath, 'utf-8')).trim();
    await restoreWorkingTree(commitHash);
    await updateHead(name)
    console.log(`Switched to branch '${name}'`)
}

export async function createAndSwitch(name)
{
    const refsDir = path.join(await getBgDir(), 'refs', 'head')
    const branchPath = path.join(refsDir, name)
    try
    {
        await fs.access(branchPath)
        console.error(`Error: branch '${name}' already exists`)
        process.exit(1);
    }
    catch
    {}

    if(await hasUnstagedChanges())
    {
        console.error('Error: you have unstaged changes. Commit or stash them before switching branches')
        process.exit(1)
    }

    const { parentHash } = await getHeadRef();
    if(!parentHash)
    {
        console.error('Error: no commits to branch from')
        process.exit(1)
    }

    await fs.writeFile(branchPath, parentHash + '\n')
    await updateHead(name)
    console.log(`Switched to new branch '${name}'`)
}
