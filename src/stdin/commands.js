const { StdinCommand } = require('@eartharoid/dbf');
const { inspect } = require('util');

module.exports = class Commands extends StdinCommand {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'commands',
		});
	}

	async run(args) {
		switch (args[0]) {
		case 'publish': {
			this.client.commands.publish()
				.then(async commands => {
					this.client.log.success('Published %d global commands', commands?.size);
					const commandData = this.client.commands.components.map(c => c.toJSON());
					let synced = 0;
					for (const guild of this.client.guilds.cache.values()) {
						try {
							await guild.commands.set(commandData);
							synced++;
						} catch (err) {
							this.client.log.warn(`Could not set guild commands for "${guild.name}": ${err.message}`);
						}
					}
					this.client.log.success('Synced commands directly to %d guilds', synced);
				})
				.catch(error => {
					this.client.log.warn('Failed to publish commands');
					this.client.log.error(error);
					this.client.log.error(inspect(error.rawError?.errors, { depth: Infinity }));
				});
			break;
		}
		default: {
			this.client.log.info('subcommands: \n' + [
				'> commands publish',
			].join('\n'));
		}
		}
	}
};
