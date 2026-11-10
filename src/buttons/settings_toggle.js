const { Button } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { isStaff } = require('../lib/users');
const { renderSettingsInterface } = require('../lib/settingsEmbed');

module.exports = class SettingsToggleButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'settings_toggle',
		});
	}

	async run(id, interaction) {
		const client = this.client;
		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.reply({
				content: '❌ Only staff members can toggle settings.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const setting = id.setting;
		const currentView = id.view || 'overview';

		if (setting === 'closeButton' || setting === 'claimButton' || setting === 'archive') {
			const currentGuild = await client.prisma.guild.findUnique({
				where: { id: interaction.guild.id },
			});
			if (currentGuild) {
				await client.prisma.guild.update({
					data: { [setting]: !currentGuild[setting] },
					where: { id: interaction.guild.id },
				});
			}
		}

		const { embeds, components } = await renderSettingsInterface(client, interaction.guild, currentView);
		await interaction.update({
			components,
			embeds,
		});
	}
};