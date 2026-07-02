import fs from 'fs/promises'
import path from 'path'
import { getHeadRef, getCurrBranch } from '../util/fs.js'

const BG_DIR = path.join(process.cwd(), '.bg')
const REFS_DIR = path.join(BG_DIR, 'refs', 'head')

export async function listBranches()
{
    let branches
    try
    {
        branches = await fs.readdir(REFS_DIR)
    }
    catch
    {
        console.log('(no branches)')
        return
    }
    const current = await getCurrBranch()

    for(const branch of branches)
    {
        const prefix = branch === current ? '* ' : '  '
        console.log(`${prefix}${branch}`)
    }
}

export async function createBranch(name)
{
    let branches
    try
    {
        branches = await fs.readdir(REFS_DIR)
    }
    catch
    {
        branches = []
    }
    if(branches.includes(name))
    {
        console.error(`Error: Branch '${name}' already exists`)
        process.exit(1)
    }

    const { parentHash } = await getHeadRef()
    if(!parentHash)
    {
        console.error('Error: No commits to branch from')
        process.exit(1)
    }

    await fs.writeFile(path.join(REFS_DIR, name), parentHash + '\n')
    console.log(`Created branch '${name}'`)
}

export async function deleteBranch(name)
{
    const current = await getCurrBranch()
    if(name === current)
    {
        console.error(`Error: Cannot delete current branch '${name}'`)
        process.exit(1)
    }

    await fs.unlink(path.join(REFS_DIR, name))
    console.log(`Deleted branch '${name}'`)
}
