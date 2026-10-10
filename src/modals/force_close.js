const { Modal } = require('@eartharoid/dbf');
const ExtendedEmbedBuilder = require('../lib/embed');
const { isStaff } = require('../lib/users');
const { MessageFlags } = require('discord.js');

module.exports = class ForceCloseModal extends Modal {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'force_close',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;
		
		const ticket = await client.tickets.getTicket(interaction.channel.id);
		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		const staff = await isStaff(interaction.guild, interaction.user.id);
		if (!staff) {
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder()
						.setColor(ticket.guild.errorColour)
						.setDescription(getMessage('ticket.close.forbidden.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.reply({
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(ticket.guild.successColour)
					.setTitle(getMessage('commands.slash.force-close.closed_one.title') || 'Closed')
					.setDescription(getMessage('commands.slash.force-close.closed_one.description', { ticket: ticket.id }) || 'The ticket will be closed shortly.'),
			],
		});

		let reason = null;
		try {
			reason = interaction.fields.getTextInputValue('reason');
			if (reason === 'N/A') reason = null;
		} catch (e) {
			// fallback
		}

		setTimeout(async () => {
			await client.tickets.finallyClose(interaction.channel.id, {
				closedBy: interaction.user.id,
				reason: reason || null,
			});
		}, 3000);
	}
};
