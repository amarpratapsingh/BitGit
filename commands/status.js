import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { readIndex, readObject, getCurrBranch, getCommitTree, getBgDir } from '../util/fs.js'

export async function status()
{
    let branch
    try
    {
        branch = await getCurrBranch()
    }
    catch
    {
        try
        {
            const headContent = await fs.readFile(path.join(await getBgDir(), 'HEAD'), 'utf-8')
            const trimmed = headContent.trim()
            if(/^[0-9a-f]{40}$/.test(trimmed))
            {
                branch = `HEAD detached at ${trimmed.substring(0, 7)}`
            }
            else
            {
                branch = 'HEAD (unknown)'
            }
        }
        catch
        {
            branch = 'main'
        }
    }
    console.log(`On branch ${branch}\n`)

    const tree = await getCommitTree()
    const index = await readIndex()

    //Staged changes between Index and HEAD
    const staged = { added: [], modified: [], deleted: [] }
    const allKeys = new Set([...Object.keys(index), ...Object.keys(tree)])
    for(const file of allKeys)
    {
        const oldHash = tree[file] || null
        const newHash = index[file] || null
        if(oldHash === newHash)
        {
            continue
        }
        if(!oldHash)
        {
            staged.added.push(file)
        }
        else if(!newHash)
        {
            staged.deleted.push(file)
        }
        else
        {
            staged.modified.push(file)
        }
    }

    if(staged.added.length || staged.modified.length || staged.deleted.length)
    {
        console.log('Changes staged for commit:')
        for(const f of staged.added)
        {
            console.log(`  new file:   ${f}`)
        }
        for(const f of staged.modified)
        {
            console.log(`  modified:   ${f}`)
        }
        for(const f of staged.deleted)
        {
            console.log(`  deleted:    ${f}`)
        }
        console.log()
    }

    //Unstaged changes between Working Tree and Index
    const unstaged = { modified: [], deleted: [] }
    for(const [file, hash] of Object.entries(index))
    {
        let content
        try
        {
            content = await fs.readFile(path.join(process.cwd(), file), 'utf-8')
        }
        catch
        {
            unstaged.deleted.push(file)
            continue
        }
        if(crypto.createHash('sha1').update(content).digest('hex') !== hash)
        {
            unstaged.modified.push(file)
        }
    }

    if(unstaged.modified.length || unstaged.deleted.length)
    {
        console.log('Changes not staged for commit:')
        for(const f of unstaged.modified)
        {
            console.log(`  modified:   ${f}`)
        }
        for(const f of unstaged.deleted)
        {
            console.log(`  deleted:    ${f}`)
        }
        console.log()
    }

    //UNtracked files
    const tracked = new Set(Object.keys(index))
    const untracked = []
    const dir = await fs.readdir(process.cwd())
    const bareRoot = await getBgDir()
    const isBare = bareRoot === process.cwd()
    for(const entry of dir)
    {
        if(entry.startsWith('.bg') || entry.startsWith('.'))
        {
            continue
        }
        if(isBare && (entry === 'HEAD' || entry === 'objects' || entry === 'refs' || entry === 'index.json' || entry === 'config.json'))
        {
            continue
        }
        const stat = await fs.stat(path.join(process.cwd(), entry))
        if(stat.isFile() && !tracked.has(entry))
        {
            untracked.push(entry)
        }
    }

    if(untracked.length)
    {
        console.log('Untracked files:')
        for(const f of untracked)
        {
            console.log(`  ${f}`)
        }
        console.log()
    }

    if(!staged.added.length && !staged.modified.length && !staged.deleted.length &&
        !unstaged.modified.length && !unstaged.deleted.length && !untracked.length)
    {
        console.log('nothing to commit, working tree clean')
    }
}
