const { Menu } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { isStaff } = require('../lib/users');
const { renderSettingsInterface } = require('../lib/settingsEmbed');

module.exports = class SettingsViewMenu extends Menu {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'settings_view',
		});
	}

	async run(id, interaction) {
		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.reply({
				content: '❌ Only staff members can view settings.',
				flags: MessageFlags.Ephemeral,
			});
		}
		const selectedView = interaction.values?.[0] || 'overview';
		const { embeds, components } = await renderSettingsInterface(this.client, interaction.guild, selectedView);
		await interaction.update({
			components,
			embeds,
		});
	}
};