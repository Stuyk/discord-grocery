import Discord from 'discord.js';
import env, { parse } from 'dotenv';

env.config();

if (!process.env.GROCERY_CHANNEL) {
    throw new Error(`No GROCERY_CHANNEL was specified in .env`);
}

if (!process.env.DISCORD_SERVER) {
    throw new Error(`No DISCORD_SERVER was specified in .env`);
}

if (!process.env.DISCORD_TOKEN) {
    throw new Error(`No DISCORD_TOKEN was specified in .env`);
}

const client = new Discord.Client();
const cmdRoutes = {
    "add": handleAddItem,
    "remove": handleRemoveItem,
    "generate": handleGenerate,
    "preview": handlePreview
}

let groceryList: Array<{ name: string, amount: number }> = [];
let server: Discord.Guild;

async function handleReadyEvent() {
    server = await client.guilds.cache.get(process.env.DISCORD_SERVER)
    console.log(`Looks like it's ready...`);
}

async function handleMessage(msg: Discord.Message) {
    if (msg.content.charAt(0) !== '!') {
        return;
    }

    const args = msg.content.slice(1).trim().split(' ');
    const command = args.shift().toLowerCase();

    if (!cmdRoutes[command]) {
        return;
    }

    cmdRoutes[command](msg, args);
}

async function handleAddItem(message: Discord.Message, args: Array<any>) {
    if (message.channel.id !== process.env.GROCERY_CHANNEL) {
        return;
    }

    if (args.length <= 0) {
        message.reply("You must specify at least one item to add.");
        return;
    }

    if (typeof args[0] != "string") {
        message.reply(`!add <item> <amount>`);
        return;
    } else {
        args[0] = args[0].toLowerCase();
    }

    if (!args[1]) {
        args[1] = 1;
    }

    const index = groceryList.findIndex(i => i.name === args[0]);
    if (index >= 0) {
        groceryList[index].amount += parseInt(args[1]);
        message.reply(`Added ${args[1]}x to item ${args[0]}. Total: ${groceryList[index].amount}`);
        return;
    }

    groceryList.push({ name: args[0], amount: parseInt(args[1])});
    message.reply(`Added ${args[1]}x ${args[0]}.`);
}

async function handleGenerate(message: Discord.Message) {
    if (message.channel.id !== process.env.GROCERY_CHANNEL) {
        return;
    }

    if (groceryList.length <= 0) {
        message.reply(`There is nothing in your grocery list.`);
        return;
    }

    const listPreview = groceryList.map(item => `${item.amount}x ${item.name}`);
    listPreview.unshift(`Grocery List (${new Date(Date.now()).toDateString()})`);
    message.reply(listPreview.join("\n"));
    groceryList = [];
    message.reply(`Grocery list has been cleared.`);
}

async function handlePreview(message: Discord.Message) {
    if (message.channel.id !== process.env.GROCERY_CHANNEL) {
        return;
    }

    if (groceryList.length <= 0) {
        message.reply(`There is nothing in your grocery list.`);
        return;
    }

    const listPreview = groceryList.map(item => `${item.amount}x ${item.name}`);
    listPreview.unshift(`Grocery List (${new Date(Date.now()).toDateString()})`);
    message.reply(listPreview.join("\n"));
}

async function handleRemoveItem(message: Discord.Message, args: Array<any>) {
    if (message.channel.id !== process.env.GROCERY_CHANNEL) {
        return;
    }

    if (args.length <= 0) {
        message.reply("You must specify at least one item to add.");
        return;
    }

    if (typeof args[0] != "string") {
        message.reply(`!remove <item>`);
        return;
    } else {
        args[0] = args[0].toLowerCase();
    }

    if (!args[1]) {
        args[1] = 1;
    }

    const index = groceryList.findIndex(i => i.name === args[0]);
    if (index <= -1) {
        message.reply(`That item does not exist.`);
        return;
    }

    groceryList[index].amount -= parseInt(args[1]);

    if (groceryList[index].amount <= 0) {
        groceryList.splice(index, 1);
        message.reply(`Removed Item ${args[0]}.`);
        return;
    }

    groceryList[index].amount -= parseInt(args[1]);
    message.reply(`Removed ${args[1]}x from ${args[0]}.`);
}

client.on('ready', handleReadyEvent);
client.on('message', handleMessage);
client.login(process.env.DISCORD_TOKEN)

