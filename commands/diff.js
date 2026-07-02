import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { readIndex, readObject, getCommitTree } from '../util/fs.js'

function lineDiff(oldLines, newLines)
{
    const output = []
    const maxLen = Math.max(oldLines.length, newLines.length)

    for(let i=0; i<maxLen; i++)
    {
        if(i >= oldLines.length)
        {
            output.push(`+ ${newLines[i]}`)
        }
        else if(i >= newLines.length)
        {
            output.push(`- ${oldLines[i]}`)
        }
        else if(oldLines[i] !== newLines[i])
        {
            output.push(`- ${oldLines[i]}`)
            output.push(`+ ${newLines[i]}`)
        }
    }
    return output
}

export async function diffCached()
{
    const index = await readIndex()
    const tree = await getCommitTree()
    const allFiles = new Set([...Object.keys(index), ...Object.keys(tree)])
    let hasChanges = false

    for(const file of allFiles)
    {
        const oldHash = tree[file] || null
        const newHash = index[file] || null
        if(oldHash === newHash)
        {
            continue
        }

        hasChanges = true
        console.log(`--- ${file}`)
        const oldContent = oldHash ? await readObject(oldHash) : ''
        const newContent = newHash ? await readObject(newHash) : ''
        lineDiff(oldContent.split('\n'), newContent.split('\n')).forEach(l => console.log(l))
    }

    if(!hasChanges)
    {
        console.log('(no staged changes)')
    }
}

export async function diff()
{
    const index = await readIndex()
    let hasChanges = false

    for(const [file, hash] of Object.entries(index))
    {
        let currentContent
        try
        {
            currentContent = await fs.readFile(path.join(process.cwd(), file), 'utf-8')
        }
        catch
        {
            hasChanges = true
            console.log(`--- ${file} (deleted)`)
            continue
        }

        const newHash = crypto.hash('sha1', currentContent, 'hex')
        if(newHash === hash)
        {
            continue
        }

        hasChanges = true
        console.log(`--- ${file}`)
        const oldContent = await readObject(hash)
        lineDiff(oldContent.split('\n'), currentContent.split('\n')).forEach(l => console.log(l))
    }

    if(!hasChanges)
    {
        console.log('(no unstaged changes)')
    }
}
