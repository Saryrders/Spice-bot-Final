require('dotenv').config();
const {
  Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const TOKEN            = process.env.DISCORD_TOKEN;
const GUILD_CUT_PERCENT = 10;
const DATA_FILE        = './spice_data.json';

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 AUTHORIZED USERS — can use /spice, /spicegive, /spicedone,
//    /past, /export  (right-click on Discord member → Copy username)
// ─────────────────────────────────────────────────────────────────────────────
const AUTHORIZED_USERS = [
  'saryrder',           // Saryrders — update if wrong
  'ssyith',             // Rayne
  'opiuz',              // Opiuz
  'mainrex_',           // Main Rex — update if wrong
  'menace2x4b523pb.s',  // Amenace
  'dandmike',           // Smeg
  '_devrandom_',        // Gnomie
];

// Officer IDs — used to skip confirmation button for officers
const OFFICER_IDS = [
  '355651297049051141', // Saryrders
  '359654655766036480', // Amenace
  '380472949058174976', // Rayne
  '685453416750776363', // Smeg
  '628650904706613249', // Opiuz
  '1019403846897913866', // Main Rex
  '832705769060827216', // Gnomie
];

// 👥 FARMING MEMBERS — fixed list of members that appear in /spice
const FARMING_MEMBERS = [
  { name: 'Saryrders',   id: '355651297049051141' },
  { name: 'Amenace',     id: '359654655766036480' },
  { name: 'Rayne',       id: '380472949058174976' },
  { name: 'Smeg',        id: '685453416750776363' },
  { name: 'Opiuz',       id: '628650904706613249' },
  { name: 'Main Rex',    id: '1019403846897913866' },
  { name: 'Gnomie',      id: '832705769060827216' },
  { name: 'Nightborn',   id: '446930839205445632' },
  { name: 'Shadoweye',   id: '283630077588013057' },
  { name: 'Bossk',       id: '681945013717827594' },
  { name: 'Sally',       id: '1462193931021324463' },
  { name: 'Shaania',     id: '277037580627738626' },
  { name: 'Soma',        id: '217694880485474304' },
  { name: 'Aria Caster', id: '400354505503408129' },
  { name: 'POK3R',       id: '722868005746507848' },
  // Add or remove members here
];
// ─────────────────────────────────────────────────────────────────────────────

function isAuthorized(interaction) {
  return AUTHORIZED_USERS.includes(interaction.user.username);
}

function loadData() {
  if (!fs.existsSync(DATA_FILE))
    return { history: [], totals: {}, pendingPayments: {} };
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  // Make sure all keys exist even if the file was reset to a partial state
  if (!d.history) d.history = [];
  if (!d.totals) d.totals = {};
  if (!d.pendingPayments) d.pendingPayments = {};
  return d;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function calculateSplit(totalSpice, memberCount) {
  const guildCut = Math.floor(totalSpice * (GUILD_CUT_PERCENT / 100));
  const remaining = totalSpice - guildCut;
  const perMember = memberCount > 0 ? Math.floor(remaining / memberCount) : 0;
  return { guildCut, remaining, perMember };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // ══════════════════════════════════════════════════════════════════════════
  // /spice
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'spice') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 You are not authorized to use this command.', ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('spice_50k').setLabel('50,000 spices').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('spice_75k').setLabel('75,000 spices').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('spice_custom').setLabel('✏️ Custom').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: '🪱 **Spice Deposit — Muppet\'s of Rodin**\nHow much spice was farmed?',
      components: [row],
    });
  }

  // Amount buttons
  if (interaction.isButton() && interaction.customId === 'spice_50k') {
    if (!isAuthorized(interaction)) return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });
    await showMemberSelect(interaction, 50000);
  }
  if (interaction.isButton() && interaction.customId === 'spice_75k') {
    if (!isAuthorized(interaction)) return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });
    await showMemberSelect(interaction, 75000);
  }

  // Custom button → modal
  if (interaction.isButton() && interaction.customId === 'spice_custom') {
    if (!isAuthorized(interaction)) return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });
    const modal = new ModalBuilder().setCustomId('modal_spice_amount').setTitle('Amount of spice farmed');
    const input = new TextInputBuilder()
      .setCustomId('amount_input').setLabel('Amount of spice')
      .setStyle(TextInputStyle.Short).setPlaceholder('E.g.: 60000').setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  // Modal submitted
  if (interaction.isModalSubmit() && interaction.customId === 'modal_spice_amount') {
    const raw = interaction.fields.getTextInputValue('amount_input').replace(/\s/g, '');
    const amount = parseInt(raw);
    if (isNaN(amount) || amount <= 0)
      return interaction.reply({ content: '❌ Invalid amount.', ephemeral: true });
    await showMemberSelect(interaction, amount);
  }

  // Member select
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_members_')) {
    const amount = parseInt(interaction.customId.split('_')[2]);
    await postSplitResult(interaction, amount, interaction.values);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // /spicegive — list of pending debts (authorized only)
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'spicegive') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });

    const data = loadData();
    const pending = data.pendingPayments;
    const entries = Object.entries(pending).filter(([, obj]) => {
      if (typeof obj === 'number') return obj > 0;
      return obj?.amount > 0;
    });

    if (entries.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('✅ No pending debts')
          .setColor(0x23a559)
          .setDescription('Everyone has been paid! 🎉')],
        ephemeral: true
      });
    }

    const sorted = entries.sort((a, b) => {
      const aAmt = typeof a[1] === 'number' ? a[1] : a[1].amount;
      const bAmt = typeof b[1] === 'number' ? b[1] : b[1].amount;
      return bAmt - aAmt;
    });
    const embed = new EmbedBuilder()
      .setTitle('💸 Spice to distribute')
      .setColor(0xC8A535)
      .setDescription(
        sorted.map(([id, obj]) => {
          const isLegacy = typeof obj === 'number';
          const memberObj = FARMING_MEMBERS.find(m => m.id === id || m.name === id);
          const name = isLegacy ? (memberObj ? memberObj.name : id) : obj.name;
          const amount = isLegacy ? obj : obj.amount;
          const status = !isLegacy && obj.status === 'awaiting_confirmation'
            ? ' ⏳ *awaiting confirmation*'
            : '';
          return `• **${name}** — ${amount.toLocaleString()} spices to give${status}`;
        }).join('\n')
      )
      .setFooter({ text: 'Use /spicedone to mark members as paid' });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // /spicedone — mark a member as paid
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'spicedone') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });

    const data = loadData();
    const pending = data.pendingPayments;
    // Only show debts that are still pending (not awaiting confirmation, not paid)
    const entries = Object.entries(pending).filter(([, obj]) => {
      if (typeof obj === 'number') return obj > 0;
      if (!(obj?.amount > 0)) return false;
      return obj.status !== 'awaiting_confirmation';
    });

    if (entries.length === 0) {
      return interaction.reply({ content: '✅ No debts to mark as paid (everything is paid or awaiting confirmation).', ephemeral: true });
    }

    // Show a select menu to choose who has been paid
    const options = entries.map(([id, obj]) => {
      const isLegacy = typeof obj === 'number';
      const memberObj = FARMING_MEMBERS.find(m => m.id === id || m.name === id);
      const label = isLegacy ? (memberObj ? memberObj.name : id) : obj.name;
      const amount = isLegacy ? obj : obj.amount;
      return { label, description: `${amount.toLocaleString()} spices`, value: id };
    }).slice(0, 25);

    const select = new StringSelectMenuBuilder()
      .setCustomId('select_spicedone')
      .setPlaceholder('Who received their spice?')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    await interaction.reply({
      content: '✅ Select the members who received their spice:',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: false
    });
  }

  // Spicedone select
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_spicedone') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });

    const data = loadData();
    const paid = interaction.values; // these are now IDs
    const paidDetails = [];

    for (const id of paid) {
      const obj = data.pendingPayments[id];
      const isLegacy = typeof obj === 'number';
      const memberObj = FARMING_MEMBERS.find(m => m.id === id || m.name === id);
      const memberName = isLegacy ? (memberObj ? memberObj.name : id) : obj.name;
      const amt = isLegacy ? obj : obj?.amount || 0;
      if (amt > 0) {
        const isOfficer = OFFICER_IDS.includes(id);
        paidDetails.push({ name: memberName, id, amt, isOfficer });

        if (isOfficer) {
          // Officers: confirmation skipped, mark as paid right away
          if (!data.paymentHistory) data.paymentHistory = [];
          data.paymentHistory.unshift({
            date: new Date().toLocaleString('en-GB'),
            member: memberName,
            amount: amt,
            paidBy: interaction.user.username
          });
          data.pendingPayments[id] = { name: memberName, amount: 0 };
        } else {
          // Non-officers: keep the debt active until they click "Received!"
          data.pendingPayments[id] = {
            name: memberName,
            amount: amt,
            status: 'awaiting_confirmation',
            sentAt: new Date().toLocaleString('en-GB'),
            sentBy: interaction.user.username
          };
        }
      }
    }
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle('✅ Payments marked as sent')
      .setColor(0x23a559)
      .setDescription(
        paidDetails.map(({ name, amt, isOfficer }) =>
          isOfficer
            ? `• **${name}** — ${amt.toLocaleString()} spices paid ✓ (officer)`
            : `• **${name}** — ${amt.toLocaleString()} spices ⏳ awaiting confirmation`
        ).join('\n')
      )
      .setFooter({ text: `Marked by ${interaction.user.username} • ${new Date().toLocaleString('en-GB')}` });

    await interaction.update({ content: '✅', components: [] });
    await interaction.followUp({ embeds: [embed] });

    // Post a confirmation button for each paid member
    for (const { name, id, amt, isOfficer } of paidDetails) {
      if (isOfficer) {
        // Officers don't need to confirm — skip button
        await interaction.followUp({
          content: `✅ <@${id}> — **${amt.toLocaleString()} spices** marked as received automatically (officer).`
        });
      } else {
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_received_${id}_${amt}`)
            .setLabel('✅ Received!')
            .setStyle(ButtonStyle.Success)
        );
        await interaction.followUp({
          content: `💰 <@${id}> — you have been sent **${amt.toLocaleString()} spices**. Please confirm reception (the debt stays open until you confirm):`,
          components: [confirmRow]
        });
      }
    }
  }

  // ── Confirm received button ───────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('confirm_received_')) {
    const parts = interaction.customId.split('_');
    const amt = parseInt(parts[parts.length - 1]);
    const memberId = parts[2];

    // Only the concerned member (by Discord ID) can confirm
    if (interaction.user.id !== memberId) {
      return interaction.reply({ content: '🚫 Only the concerned member can confirm reception.', ephemeral: true });
    }

    const memberObj = FARMING_MEMBERS.find(m => m.id === memberId);
    const memberName = memberObj ? memberObj.name : interaction.user.username;

    const data = loadData();
    if (!data.confirmations) data.confirmations = [];
    data.confirmations.push({
      date: new Date().toLocaleString('en-GB'),
      member: memberName,
      amount: amt,
      confirmed: true
    });

    // Clear the debt now that the member has confirmed reception
    if (data.pendingPayments?.[memberId]) {
      data.pendingPayments[memberId] = { name: memberName, amount: 0 };
    }

    // Add to payment history
    if (!data.paymentHistory) data.paymentHistory = [];
    data.paymentHistory.unshift({
      date: new Date().toLocaleString('en-GB'),
      member: memberName,
      amount: amt,
      paidBy: 'self-confirmed'
    });

    saveData(data);

    await interaction.update({
      content: `✅ <@${memberId}> confirmed reception of **${amt.toLocaleString()} spices**! 🪱`,
      components: []
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // /past — last 5 deposits (authorized only)
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'past') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });

    const data = loadData();
    const last5 = data.history.slice(0, 5);

    if (last5.length === 0)
      return interaction.reply({ content: '📭 No deposits recorded.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('📜 Spice Deposit History')
      .setColor(0xC8A535)
      .setDescription(
        last5.map((e, i) =>
          `**#${i + 1}** — ${e.date}\n` +
          `💰 ${e.total.toLocaleString()} spices | 🏰 ${e.guildCut.toLocaleString()} guild | 👤 ${e.perMember.toLocaleString()}/member\n` +
          `👥 ${e.members.join(', ')}`
        ).join('\n\n')
      );

    await interaction.reply({ embeds: [embed] });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // /total — Top 20 visible to EVERYONE
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'total') {
    const data = loadData();
    const sorted = Object.entries(data.totals).sort((a, b) => b[1] - a[1]).slice(0, 20);

    if (sorted.length === 0)
      return interaction.reply({ content: '📭 No spice recorded yet.', ephemeral: false });

    const medals = ['🥇', '🥈', '🥉'];
    const embed = new EmbedBuilder()
      .setTitle('🏆 Spice Ladder — Top 20 · Muppet\'s of Rodin')
      .setColor(0xC8A535)
      .setDescription(
        sorted.map(([name, total], i) => {
          const icon = medals[i] || `**${i + 1}.**`;
          return `${icon} **${name}** — ${total.toLocaleString()} spices`;
        }).join('\n')
      )
      .setFooter({ text: 'Total spice received since the beginning • /spice to deposit' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // /export — Full Excel file (authorized only)
  // ══════════════════════════════════════════════════════════════════════════
  if (interaction.isChatInputCommand() && interaction.commandName === 'export') {
    if (!isAuthorized(interaction))
      return interaction.reply({ content: '🚫 Not authorized.', ephemeral: true });

    await interaction.deferReply();
    try {
      const { generateExcel } = require('./excel_export');
      const filePath = await generateExcel();
      await interaction.editReply({
        content: '📊 Traceability Excel file — Muppet\'s of Rodin 🪱',
        files: [{ attachment: filePath, name: 'spice_muppets.xlsx' }]
      });
      setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 5000);
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error generating the Excel file.' });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
async function showMemberSelect(interaction, amount) {
  if (FARMING_MEMBERS.length === 0)
    return interaction.reply({ content: '❌ No members in FARMING_MEMBERS.', ephemeral: true });

  const options = FARMING_MEMBERS.map(m => ({ label: m.name, value: m.id })).slice(0, 25);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select_members_${amount}`)
    .setPlaceholder('Select the participating members...')
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);

  const fn = interaction.replied || interaction.deferred
    ? interaction.followUp.bind(interaction)
    : interaction.reply.bind(interaction);

  await fn({
    content: `🪱 **${amount.toLocaleString()} spices** — Who participated in the farm?`,
    components: [new ActionRowBuilder().addComponents(select)],
  });
}

async function postSplitResult(interaction, amount, members) {
  const { guildCut, perMember } = calculateSplit(amount, members.length);

  const data = loadData();

  // History
  // Resolve member names from IDs
  const memberObjects = members.map(id => FARMING_MEMBERS.find(m => m.id === id) || { name: id, id });
  const memberNames = memberObjects.map(m => m.name);

  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString('en-GB'),
    total: amount,
    guildCut,
    perMember,
    members: memberNames,
    submittedBy: interaction.user.username
  };
  data.history.unshift(entry);

  // Cumulative totals + pending debts (keyed by ID)
  for (const m of memberObjects) {
    data.totals[m.name] = (data.totals[m.name] || 0) + perMember;
    const previousAmount = data.pendingPayments[m.id]?.amount || 0;
    // Reset status to 'pending' since there's a new amount to send
    data.pendingPayments[m.id] = {
      name: m.name,
      amount: previousAmount + perMember,
      status: 'pending'
    };
  }
  saveData(data);

  const embed = new EmbedBuilder()
    .setTitle('🪱 Spice Deposit — Muppet\'s of Rodin')
    .setColor(0xC8A535)
    .addFields(
      { name: '🍆 Total farmed',       value: `**${amount.toLocaleString()}** spices`,    inline: true },
      { name: '🏛️ Guild share (10%)', value: `**${guildCut.toLocaleString()}** spices`,  inline: true },
      { name: '👤 Share / member',     value: `**${perMember.toLocaleString()}** spices`, inline: true },
      {
        name: '👥 Participants',
        value: memberNames.map(n => `• **${n}** — ${perMember.toLocaleString()} spices`).join('\n')
      },
    )
    .setFooter({ text: `Submitted by ${entry.submittedBy} • ${entry.date}` })
    .setTimestamp();

  await interaction.update({ content: '✅', components: [] });
  await interaction.followUp({
    content: '✅ Deposit recorded! Use `/spicegive` to see pending debts.',
    embeds: [embed]
  });
}

client.once('ready', () => console.log(`✅ Bot connecté : ${client.user.tag}`));
client.login(TOKEN);