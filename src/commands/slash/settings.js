const { SlashCommand } = require('@eartharoid/dbf');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require('discord.js');
const { isStaff } = require('../../lib/users');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { ensureDefaultCategory } = require('../../lib/tickets/utils');
const ms = require('ms');

module.exports = class SettingsSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'settings';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'View and configure bot settings for this server',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		let settings = await client.prisma.guild.findUnique({
			include: {
				categories: true,
				tags: true,
			},
			where: { id: interaction.guild.id },
		});

		if (!settings || settings.categories.length === 0) {
			await ensureDefaultCategory(client, interaction.guild);
			settings = await client.prisma.guild.findUnique({
				include: {
					categories: true,
					tags: true,
				},
				where: { id: interaction.guild.id },
			});
		}

		const getMessage = client.i18n.getLocale(settings?.locale);

		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings?.footer,
					})
						.setColor(settings?.errorColour || 0xff0000)
						.setTitle(getMessage('commands.slash.settings.not_staff.title') || '❌ Error')
						.setDescription(getMessage('commands.slash.settings.not_staff.description') || 'Only staff members and administrators can access the settings dashboard.'),
				],
			});
		}

		const baseUrl = process.env.HTTP_EXTERNAL || 'http://localhost:1337';
		const settingsUrl = `${baseUrl}/settings/${interaction.guild.id}`;
		const categoriesUrl = `${baseUrl}/settings/${interaction.guild.id}/categories`;
		const panelsUrl = `${baseUrl}/settings/${interaction.guild.id}/panels`;
		const tagsUrl = `${baseUrl}/settings/${interaction.guild.id}/tags`;
		const dashboardUrl = `${baseUrl}/settings`;

		const totalTickets = await client.prisma.ticket.count({ where: { guildId: interaction.guild.id } });
		const openTickets = await client.prisma.ticket.count({
			where: {
				guildId: interaction.guild.id,
				open: true,
			},
		});

		const staffRoleIds = [
			...new Set(
				settings.categories.flatMap(c => {
					if (Array.isArray(c.staffRoles)) return c.staffRoles;
					try {
						return JSON.parse(c.staffRoles);
					} catch {
						return [];
					}
				}),
			),
		];
		const staffRolesText = staffRoleIds.length > 0
			? staffRoleIds.map(id => `<@&${id}>`).join(' ')
			: (getMessage('commands.slash.settings.fields.none_configured') || '*None configured (Manage Server only)*');

		const categoryEntries = settings.categories.map(c => {
			const channelCategory = c.discordCategory ? `<#${c.discordCategory}>` : (getMessage('commands.slash.settings.fields.none') || '*None*');
			return `• ${c.emoji || '🎫'} **${c.name}** (\`#${c.id}\`)\n` +
				`  └ **Format:** \`${c.channelName}\` • **Category:** ${channelCategory}\n` +
				`  └ **Limits:** \`${c.memberLimit}\`/user, \`${c.totalLimit}\` max • **Claiming:** ${c.claiming ? '✅' : '❌'}`;
		});

		let formattedCategories = categoryEntries.join('\n');
		if (formattedCategories.length > 1000) {
			formattedCategories = formattedCategories.substring(0, 990) + '\n*...and more*';
		}

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.buttons.server_settings') || 'Server Settings')
				.setEmoji('⚙️')
				.setStyle(ButtonStyle.Link)
				.setURL(settingsUrl),
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.buttons.categories') || 'Categories')
				.setEmoji('📂')
				.setStyle(ButtonStyle.Link)
				.setURL(categoriesUrl),
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.buttons.panels') || 'Panels')
				.setEmoji('📋')
				.setStyle(ButtonStyle.Link)
				.setURL(panelsUrl),
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.buttons.tags') || 'Tags')
				.setEmoji('🏷️')
				.setStyle(ButtonStyle.Link)
				.setURL(tagsUrl),
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.buttons.dashboard') || 'Dashboard')
				.setEmoji('🌐')
				.setStyle(ButtonStyle.Link)
				.setURL(dashboardUrl),
		);

		const embed = new ExtendedEmbedBuilder({
			iconURL: interaction.guild.iconURL(),
			text: settings?.footer,
		})
			.setColor(settings?.primaryColour || 0x009999)
			.setTitle(getMessage('commands.slash.settings.title', { guild: interaction.guild.name }) || `⚙️ Settings • ${interaction.guild.name}`)
			.setDescription(
				getMessage('commands.slash.settings.description_text', {
					categoriesUrl,
					dashboardUrl,
					guild: interaction.guild.name,
					panelsUrl,
					settingsUrl,
					tagsUrl,
				}) || `Overview of all ticket and bot settings for **${interaction.guild.name}**.\nClick the buttons below or links to configure in the web dashboard:\n\n> ⚙️ [Server Settings](${settingsUrl}) • 📂 [Categories](${categoriesUrl}) • 📋 [Panels](${panelsUrl}) • 🏷️ [Tags](${tagsUrl}) • 🌐 [Dashboard](${dashboardUrl})`,
			)
			.addFields([
				{
					inline: true,
					name: getMessage('commands.slash.settings.fields.general') || '🌐 General',
					value: `**Locale:** \`${settings.locale}\`\n**Transcripts:** ${settings.archive ? '✅ Enabled' : '❌ Disabled'}\n**Primary:** \`${settings.primaryColour}\`\n**Success:** \`${settings.successColour}\`\n**Error:** \`${settings.errorColour}\``,
				},
				{
					inline: true,
					name: getMessage('commands.slash.settings.fields.logging') || '📢 Logging & Channels',
					value: `**Ticket Log:** ${settings.logChannel ? `<#${settings.logChannel}>` : '`Not configured`'}\n**Error Log:** ${settings.errorLogChannel ? `<#${settings.errorLogChannel}>` : '`Not configured`'}\n**Footer:** ${settings.footer ? `\`${settings.footer}\`` : '`Default`'}`,
				},
				{
					inline: true,
					name: getMessage('commands.slash.settings.fields.controls') || '🔘 Ticket Controls',
					value: `**Close Button:** ${settings.closeButton ? '✅ Enabled' : '❌ Disabled'}\n**Instant Close (⚡):** ${settings.closeButton ? '✅ Enabled' : '❌ Disabled'}\n**Claim Button:** ${settings.claimButton ? '✅ Enabled' : '❌ Disabled'}\n**Auto-Close:** ${settings.autoClose ? ms(settings.autoClose) : '`Disabled`'}\n**Stale Warning:** ${settings.staleAfter ? ms(settings.staleAfter) : '`Disabled`'}`,
				},
				{
					inline: false,
					name: getMessage('commands.slash.settings.fields.staff_roles') || `👥 Staff Roles (${staffRoleIds.length})`,
					value: staffRolesText,
				},
				{
					inline: false,
					name: getMessage('commands.slash.settings.fields.categories') || `📂 Categories (${settings.categories.length})`,
					value: formattedCategories || '*None*',
				},
				{
					inline: false,
					name: getMessage('commands.slash.settings.fields.tags_stats') || '🏷️ Tags & Statistics',
					value: `**Tags Configured:** \`${settings.tags.length}\` • **Total Tickets:** \`${totalTickets}\` • **Open Tickets:** \`${openTickets}\``,
				},
			]);

		return await interaction.editReply({
			components: [row],
			embeds: [embed],
		});
	}
};
