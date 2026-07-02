import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { commit } from "./commands/commit.js";
import { rm } from "./commands/rm.js";
import { listBranches, createBranch, deleteBranch } from "./commands/branch.js";
import { switchBranch, createAndSwitch } from "./commands/checkout.js";
import { diff, diffCached } from "./commands/diff.js";
import { status } from "./commands/status.js";
import { config } from "./commands/config.js";
import { log } from "./commands/log.js";
import { reset, resetHard } from "./commands/reset.js";

const command = process.argv[2];
const args = process.argv.slice(3);

async function main()
{
    switch(command)
    {
        case "init":
            const isBare = args.includes("--bare");
            await init({ bare: isBare });
            break;
        case "add":
            if(args.length === 0)
            {
                console.log("Error: Please specify the number of file(s) to add.");
                process.exit(1);
            }
            for(const file of args)
            {
                await add(file);
            }
            break;
        case "commit":
            const msg = args[args.indexOf("-m") + 1];
            if(!msg)
            {
                console.log("Error: Please provide a commit message with -m");
                process.exit(1);
            }
            await commit(msg);
            break;
        case "rm":
            if(args.length === 0)
            {
                console.log("Error: Please specify the file(s) to remove.");
                process.exit(1);
            }
            for(const file of args)
            {
                await rm(file);
            }
            break;
        case "branch":
            if(args[0] === "-d")
            {
                await deleteBranch(args[1]);
            }
            else if(args.length === 0)
            {
                await listBranches();
            }
            else
            {
                await createBranch(args[0]);
            }
            break;
        case "checkout":
            if(args[0] === "-b")
            {
                if(!args[1])
                {
                    console.log("Error: please specify a branch name");
                    process.exit(1);
                }
                await createAndSwitch(args[1]);
            }
            else if(args[0])
            {
                await switchBranch(args[0]);
            }
            else
            {
                console.log("Error: please specify a branch");
                process.exit(1);
            }
            break;
        case "diff":
            if(args.includes("--cached") || args.includes("--staged"))
            {
                await diffCached();
            }
            else
            {
                await diff();
            }
            break;
        case "status":
            await status();
            break;
        case "config":
            await config(args[0], args[1]);
            break;
        case "log":
            await log();
            break;
        case "reset":
            if(args[0] === "--hard")
            {
                await resetHard();
            }
            else
            {
                await reset(args[0] || null);
            }
            break;
    }
}
main().catch((err) =>
{
    console.error(`Error encountered: ${err}`);
    process.exit(1);
});
