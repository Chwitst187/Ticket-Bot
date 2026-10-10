const { Button } = require('@eartharoid/dbf');
const ExtendedEmbedBuilder = require('../lib/embed');
const { isStaff } = require('../lib/users');
const { MessageFlags } = require('discord.js');

module.exports = class CloseButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'close',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").ButtonInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		if (id.force) {
			const ticket = await client.tickets.getTicket(interaction.channel.id);
			const staff = await isStaff(interaction.guild, interaction.user.id);
			if (!staff) {
				const getMessage = client.i18n.getLocale(ticket.guild.locale);
				return await interaction.reply({
					embeds: [
						new ExtendedEmbedBuilder()
							.setColor(ticket.guild.errorColour)
							.setDescription(getMessage('ticket.close.forbidden.description')),
					],
					flags: MessageFlags.Ephemeral,
				});
			}
			const getMessage = client.i18n.getLocale(ticket.guild.locale);
			const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
			const modal = new ModalBuilder()
				.setCustomId(JSON.stringify({ action: 'force_close' }))
				.setTitle(getMessage('commands.slash.force-close.closed_one.title') || 'Close Ticket')
				.addComponents(
					new ActionRowBuilder().addComponents(
						new TextInputBuilder()
							.setCustomId('reason')
							.setLabel('Reason')
							.setStyle(TextInputStyle.Short)
							.setValue('N/A')
							.setPlaceholder('Type a reason or leave as N/A')
							.setRequired(true)
					)
				);
			return await interaction.showModal(modal);
		} else if (id.accepted === undefined) {
			// the close button on the opening message, the same as using /close
			await client.tickets.beforeRequestClose(interaction);
		} else {
			const ticket = await client.tickets.getTicket(interaction.channel.id, true); // true to override cache and load new feedback
			const getMessage = client.i18n.getLocale(ticket.guild.locale);
			const staff = await isStaff(interaction.guild, interaction.user.id);

			if (id.expect === 'staff' && !staff) {
				return await interaction.reply({
					embeds: [
						new ExtendedEmbedBuilder()
							.setColor(ticket.guild.errorColour)
							.setDescription(getMessage('ticket.close.wait_for_staff')),
					],
					flags: MessageFlags.Ephemeral,
				});
			} else if (id.expect === 'user' && interaction.user.id !== ticket.createdById) {
				return await interaction.reply({
					embeds: [
						new ExtendedEmbedBuilder()
							.setColor(ticket.guild.errorColour)
							.setDescription(getMessage('ticket.close.wait_for_user')),
					],
					flags: MessageFlags.Ephemeral,
				});
			} else {
				if (id.accepted) {
					if (
						ticket.createdById === interaction.user.id &&
						ticket.category.enableFeedback &&
						!ticket.feedback
					) {
						return await interaction.showModal(client.tickets.buildFeedbackModal(ticket.guild.locale, { next: 'acceptClose' }));
					} else {
						await interaction.deferReply();
						await client.tickets.acceptClose(interaction);
					}
				} else {
					try {
						await interaction.update({
							components: [],
							embeds: [
								new ExtendedEmbedBuilder({
									iconURL: interaction.guild.iconURL(),
									text: ticket.guild.footer,
								})
									.setColor(ticket.guild.errorColour)
									.setDescription(getMessage('ticket.close.rejected', { user: interaction.user.toString() }))
									.setFooter({ text: null }),
							],
						});

					} finally { // this should run regardless of whatever happens above
						client.tickets.$stale.delete(ticket.id);
					}
				}
			}
		}
	}
};
