import { readConfig, writeConfig } from '../util/config.js'

export async function config(key, value)
{
    const cfg = await readConfig()

    if(!key)
    {
        for(const [k, v] of Object.entries(cfg))
        {
            if(typeof v === 'object' && v !== null)
            {
                console.log(`${k}:`)
                for(const [sk, sv] of Object.entries(v))
                {
                    console.log(`  ${sk}=${sv}`)
                }
            }
            else
            {
                console.log(`${k}=${v}`)
            }
        }
        return
    }

    if(!value)
    {
        const parts = key.split('.')
        let cur = cfg
        for(const p of parts)
        {
            cur = cur?.[p]
        }
        if(cur === undefined)
        {
            console.error(`Error: key '${key}' not found`)
            process.exit(1)
        }
        console.log(cur)
        return
    }

    const parts = key.split('.')
    let cur = cfg
    for(let i = 0; i < parts.length - 1; i++)
    {
        if(!cur[parts[i]])
        {
            cur[parts[i]] = {}
        }
        cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = value
    await writeConfig(cfg)
}
