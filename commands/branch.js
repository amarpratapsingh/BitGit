import fs from 'fs/promises'
import path from 'path'
import { getHeadRef, getCurrBranch, getBgDir } from '../util/fs.js'

export async function listBranches()
{
    const refsDir = path.join(await getBgDir(), 'refs', 'head')
    let branches
    try
    {
        branches = await fs.readdir(refsDir)
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
    const refsDir = path.join(await getBgDir(), 'refs', 'head')
    let branches
    try
    {
        branches = await fs.readdir(refsDir)
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

    await fs.writeFile(path.join(refsDir, name), parentHash + '\n')
    console.log(`Created branch '${name}'`)
}

export async function deleteBranch(name)
{
    const refsDir = path.join(await getBgDir(), 'refs', 'head')
    const current = await getCurrBranch()
    if(name === current)
    {
        console.error(`Error: Cannot delete current branch '${name}'`)
        process.exit(1)
    }

    await fs.unlink(path.join(refsDir, name))
    console.log(`Deleted branch '${name}'`)
}
