import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { readIndex, readObject, getCurrBranch, getCommitTree } from '../util/fs.js'

export async function status()
{
    const branch = await getCurrBranch().catch(() => 'main')
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
        if(crypto.hash('sha1', content, 'hex') !== hash)
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
    for(const entry of dir)
    {
        if(entry.startsWith('.bg') || entry.startsWith('.'))
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
