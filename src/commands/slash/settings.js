const { SlashCommand } = require('@eartharoid/dbf');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require('discord.js');
const { isStaff } = require('../../lib/users');
const ExtendedEmbedBuilder = require('../../lib/embed');

module.exports = class SettingsSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'settings';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Open the bot settings dashboard',
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
		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
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

		const settingsUrl = `${process.env.HTTP_EXTERNAL}/settings/${interaction.guild.id}`;
		const dashboardUrl = `${process.env.HTTP_EXTERNAL}/settings`;

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.server_settings') || 'Server Settings')
				.setStyle(ButtonStyle.Link)
				.setURL(settingsUrl),
			new ButtonBuilder()
				.setLabel(getMessage('commands.slash.settings.dashboard') || 'Dashboard')
				.setStyle(ButtonStyle.Link)
				.setURL(dashboardUrl),
		);

		const embed = new ExtendedEmbedBuilder({
			iconURL: interaction.guild.iconURL(),
			text: settings?.footer,
		})
			.setColor(settings?.primaryColour || 0x009999)
			.setTitle(getMessage('commands.slash.settings.title') || '⚙️ Bot Settings')
			.setDescription(
				getMessage('commands.slash.settings.description_text', {
					dashboardUrl,
					guild: interaction.guild.name,
					settingsUrl,
				}) || `Configure settings for **${interaction.guild.name}** in the web dashboard:\n\n> 🔗 **Server Settings:** [${settingsUrl}](${settingsUrl})\n> 🌐 **Dashboard:** [${dashboardUrl}](${dashboardUrl})`,
			);

		return await interaction.editReply({
			components: [row],
			embeds: [embed],
		});
	}
};
