const { SlashCommand } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { isStaff } = require('../../lib/users');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { renderSettingsInterface } = require('../../lib/settingsEmbed');

module.exports = class SettingsSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'settings';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, 'commands.slash.' + name + '.description') || 'View and configure bot settings for this server',
			descriptionLocalizations: client.i18n.getAllMessages('commands.slash.' + name + '.description'),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages('commands.slash.' + name + '.name'),
			options: [],
		});
		this.options = [];
	}

	toJSON() {
		return {
			...super.toJSON(),
			options: [],
		};
	}

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import('client')} */
		const client = this.client;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			const settings = await client.prisma.guild.findUnique({
				where: { id: interaction.guild.id },
			});
			const getMessage = client.i18n.getLocale(settings?.locale);
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings?.footer,
					})
						.setColor(settings?.errorColour || 0xff0000)
						.setTitle(getMessage('commands.slash.settings.not_staff.title') || '❌ Error')
						.setDescription(getMessage('commands.slash.settings.not_staff.description') || 'Only staff members and administrators can access settings.'),
				],
			});
		}

		const { embeds, components } = await renderSettingsInterface(client, interaction.guild, 'overview');

		return await interaction.editReply({
			components,
			embeds,
		});
	}
};