require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('spice')
    .setDescription('🪱 Enregistrer un dépôt de spice'),

  new SlashCommandBuilder()
    .setName('spicegive')
    .setDescription('💸 Voir la liste des spices à distribuer aux membres'),

  new SlashCommandBuilder()
    .setName('spicedone')
    .setDescription('✅ Marquer un ou plusieurs membres comme payés'),

  new SlashCommandBuilder()
    .setName('past')
    .setDescription('📜 Voir les 5 derniers dépôts de spice'),

  new SlashCommandBuilder()
    .setName('total')
    .setDescription('🏆 Ladder Top 20 — visible par tous'),

  new SlashCommandBuilder()
    .setName('export')
    .setDescription('📊 Générer le fichier Excel de traçabilité complète'),

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('⏳ Enregistrement des commandes slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Commandes enregistrées !');
  } catch (error) {
    console.error('❌ Erreur :', error);
  }
})();
