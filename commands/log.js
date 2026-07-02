import { readObject, getHeadRef } from '../util/fs.js'

export async function log()
{
    const { parentHash } = await getHeadRef()
    if(!parentHash)
    {
        console.log('(no commits)')
        return
    }

    let hash = parentHash
    while(hash)
    {
        const content = await readObject(hash)
        const lines = content.split('\n')
        const tree = lines[0]
        const parent = lines.find(l => l.startsWith('parent:'))?.replace('parent:', '').trim()
        const author = lines.find(l => l.startsWith('author:'))?.replace('author:', '').trim()
        const msg = lines.slice(lines.findIndex(l => l === '') + 1).join('\n').trim()

        console.log(`commit ${hash}`)
        if(author)
        {
            console.log(`Author: ${author}`)
        }
        console.log(`\n    ${msg}\n`)

        hash = parent || null
    }
}
