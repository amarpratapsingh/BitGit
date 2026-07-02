import fs from 'fs/promises'
import path from 'path'

const BG_DIR = path.join(process.cwd(), '.bg')
const CONFIG_PATH = path.join(BG_DIR, 'config.json')

export async function readConfig()
{
    try
    {
        return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'))
    }
    catch
    {
        return {}
    }
}

export async function writeConfig(config)
{
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
}
