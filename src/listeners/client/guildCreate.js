const { Listener } = require('@eartharoid/dbf');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'guildCreate',
		});
	}

	/**
	 * @param {import("discord.js").Guild} guild
	 */
	async run(guild) {
		/** @type {import("client")} */
		const client = this.client;

		this.client.log.success(`Added to guild "${guild.name}"`);
		const { ensureDefaultCategory } = require('../../lib/tickets/utils');
		await ensureDefaultCategory(client, guild).catch(err => {
			client.log.warn(`Could not ensure default category for new guild "${guild.name}": ${err.message}`);
		});

		try {
			const commandData = client.commands.components.map(c => c.toJSON());
			await guild.commands.set(commandData);
			client.log.info(`Synced commands to new guild "${guild.name}"`);
		} catch (err) {
			client.log.warn(`Could not set guild commands for "${guild.name}": ${err.message}`);
		}
	}
};
