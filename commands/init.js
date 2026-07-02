import fs from 'fs/promises'
import path from 'path'

export async function init(opts = {})
{
    const targetDir = opts.bare ? process.cwd() : path.join(process.cwd(), '.bg')

    try
    {
        await fs.access(targetDir)
        console.log('BigGit repository already exists.')
        return;
    }
    catch
    {}
    await fs.mkdir(path.join(targetDir, 'objects'), { recursive: true })
    await fs.mkdir(path.join(targetDir, 'refs', 'head'), { recursive: true })
    await fs.writeFile(path.join(targetDir, 'HEAD'), 'ref: refs/head/main\n')

    console.log(`Initialized empty BitGit repository in ${targetDir}`);
}
