require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('spice')
    .setDescription('🪱 Record a spice deposit'),

  new SlashCommandBuilder()
    .setName('spicegive')
    .setDescription('💸 View the list of spice to distribute to members'),

  new SlashCommandBuilder()
    .setName('spicedone')
    .setDescription('✅ Mark one or more members as paid'),

  new SlashCommandBuilder()
    .setName('past')
    .setDescription('📜 View the last 5 spice deposits'),

  new SlashCommandBuilder()
    .setName('total')
    .setDescription('🏆 Top 20 ladder — visible to everyone'),

  new SlashCommandBuilder()
    .setName('export')
    .setDescription('📊 Generate the full traceability Excel file'),

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Commands registered successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
})();