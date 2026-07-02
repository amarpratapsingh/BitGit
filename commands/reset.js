import fs from 'fs/promises'
import path from 'path'
import { readIndex, writeIndex, readObject, getCommitTree } from '../util/fs.js'

export async function reset(file)
{
    if(file)
    {
        const index = await readIndex()
        delete index[file]
        await writeIndex(index)
        console.log(`Unstaged: ${file}`)
        return
    }

    const tree = await getCommitTree()
    await writeIndex(tree)
    console.log('Unstaged all changes')
}

export async function resetHard()
{
    const tree = await getCommitTree()

    if(Object.keys(tree).length === 0)
    {
        const index = await readIndex()
        for(const file of Object.keys(index))
        {
            await fs.unlink(path.join(process.cwd(), file)).catch(() => {})
        }
        await writeIndex({})
        console.log('Hard reset — no commits, working tree cleared')
        return
    }

    await writeIndex(tree)

    for(const [file, hash] of Object.entries(tree))
    {
        const content = await readObject(hash)
        await fs.writeFile(path.join(process.cwd(), file), content)
    }

    console.log('Hard reset — working tree matches HEAD')
}
