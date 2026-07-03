import fs from 'fs/promises'
import path from 'path'
import { getBgDir } from './fs.js'

export async function readConfig()
{
    const bgDir = await getBgDir()
    const configPath = path.join(bgDir, 'config.json')
    try
    {
        return JSON.parse(await fs.readFile(configPath, 'utf-8'))
    }
    catch
    {
        return {}
    }
}

export async function writeConfig(config)
{
    const bgDir = await getBgDir()
    const configPath = path.join(bgDir, 'config.json')
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
}
