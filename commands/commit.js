import fs from 'fs/promises'
import { createTreeObject, getHeadRef, hashAndStore, readObject } from '../util/fs.js'
import { readConfig } from '../util/config.js'

export async function commit(msg)
{
    const treeHash = await createTreeObject();
    const { branchPath, parentHash } = await getHeadRef();

    if(parentHash)
    {
        const parentCommit = await readObject(parentHash)
        const parentTree = parentCommit.match(/^tree: (.+)/m)?.[1]
        if(parentTree === treeHash)
        {
            console.log('nothing to commit, working tree clean')
            return
        }
    }

    const cfg = await readConfig()
    const name = cfg.user?.name || 'User'
    const email = cfg.user?.email || 'user@example.com'

    const commitContent = `tree: ${treeHash}\n` +
        (parentHash ? `parent: ${parentHash}\n` : '') +
        `author: ${name} <${email}>\n\n${msg}`

    const commitHash = await hashAndStore(commitContent)
    await fs.writeFile(branchPath, commitHash + '\n')

    console.log(`Committed: ${commitHash}`)
}
