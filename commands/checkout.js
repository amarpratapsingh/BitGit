import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { readObject, readIndex, getHeadRef, getCurrBranch } from '../util/fs.js'

const BG_DIR = path.join(process.cwd(), '.bg')
const REFS_DIR = path.join(BG_DIR, 'refs', 'head')

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

    const indexPath = path.join(BG_DIR, 'index.json')
    await fs.writeFile(indexPath, JSON.stringify(tree, null, 2))
}

async function updateHead(branchName)
{
    await fs.writeFile(path.join(BG_DIR, 'HEAD'), `ref: refs/head/${branchName}\n`)
}

export async function switchBranch(name)
{
    const branchPath = path.join(REFS_DIR, name)
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
    const branchPath = path.join(REFS_DIR, name)
    try
    {
        await fs.access(branchPath)
        console.error(`Error: branch '${name}' already exists`)
        process.exit(1);
    }
    catch
    {}

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
