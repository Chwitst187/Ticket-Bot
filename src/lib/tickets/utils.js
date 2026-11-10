const {
	ActionRowBuilder,
	ChannelType,
	EmbedBuilder,
	MessageFlags,
	PermissionFlagsBits,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const emoji = require('node-emoji');

module.exports = {
	/**
	 * Ensures a guild has at least one default category configured.
	 * If none exists, creates a "Support" category and corresponding Discord channel category.
	 * @param {import("client")} client
	 * @param {import("discord.js").Guild} guild
	 * @returns {Promise<import("@prisma/client").Category>}
	 */
	async ensureDefaultCategory(client, guild) {
		if (!guild) return null;

		let dbGuild = await client.prisma.guild.findUnique({
			include: { categories: true },
			where: { id: guild.id },
		});

		if (!dbGuild) {
			dbGuild = await client.prisma.guild.create({
				data: {
					id: guild.id,
					locale: client.i18n.locales.includes(guild.preferredLocale) ? guild.preferredLocale : 'en-GB',
				},
				include: { categories: true },
			});
		}

		if (dbGuild.categories && dbGuild.categories.length > 0) {
			return dbGuild.categories[0];
		}

		if (guild.channels?.cache?.size === 0 && guild.channels?.fetch) {
			await guild.channels.fetch().catch(() => null);
		}

		let discordCategory = guild.channels?.cache?.find(
			c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket'),
		);

		if (!discordCategory && guild.channels?.create) {
			try {
				discordCategory = await guild.channels.create({
					name: '🎫 Tickets',
					permissionOverwrites: [
						{
							deny: [PermissionFlagsBits.ViewChannel],
							id: guild.roles.everyone.id,
						},
						{
							allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
							id: client.user.id,
						},
					],
					type: ChannelType.GuildCategory,
				});
			} catch (err) {
				client.log.warn(`Could not create category channel for guild "${guild.name}": ${err.message}`);
			}
		}

		const category = await client.prisma.category.create({
			data: {
				channelName: 'ticket-{num}',
				claiming: false,
				description: 'General support and inquiries',
				discordCategory: discordCategory?.id || '',
				emoji: '🎫',
				enableFeedback: false,
				guild: { connect: { id: guild.id } },
				memberLimit: 2,
				name: 'Support',
				openingMessage: 'Thank you for contacting support! Please describe your inquiry and a staff member will assist you shortly.',
				pingRoles: '[]',
				requireTopic: false,
				requiredRoles: '[]',
				staffRoles: '[]',
				totalLimit: 50,
			},
		});

		await client.tickets.getCategory(category.id, true);
		if (client.tickets?.$count?.categories) {
			client.tickets.$count.categories[category.id] = { total: 0 };
		}
		client.log.info(`Created default "Support" category for guild "${guild.name}" (${guild.id})`);
		return category;
	},

	/**
	 * @param {import("client")} client
	 * @param {import("discord.js").ButtonInteraction|import("discord.js").SelectMenuInteraction} interaction
	 */
	async useGuild(client, interaction, {
		referencesMessageId,
		referencesTicketId,
		topic,
	}) {
		const settings = await client.prisma.guild.findUnique({
			select: {
				categories: true,
				errorColour: true,
				locale: true,
				primaryColour: true,
			},
			where: { id: interaction.guild.id },
		});
		const getMessage = client.i18n.getLocale(settings.locale);
		if (settings.categories.length === 0) {
			const defaultCat = await module.exports.ensureDefaultCategory(client, interaction.guild);
			if (defaultCat) {
				settings.categories = [defaultCat];
			}
		}
		if (settings.categories.length === 0) {
			interaction.reply({
				components: [],
				embeds: [
					new EmbedBuilder()
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.no_categories.title'))
						.setDescription(getMessage('misc.no_categories.description', { url: `${process.env.HTTP_EXTERNAL}/settings/${interaction.guildId}` })),
				],
				flags: MessageFlags.Ephemeral,
			});
		} else if (settings.categories.length === 1) {
			await client.tickets.create({
				categoryId: settings.categories[0].id,
				interaction,
				referencesMessageId,
				referencesTicketId,
				topic,
			});
		} else {
			await interaction.reply({
				components: [
					new ActionRowBuilder()
						.setComponents(
							new StringSelectMenuBuilder()
								.setCustomId(JSON.stringify({
									action: 'create',
									referencesMessageId,
									referencesTicketId,
									topic,
								}))
								.setPlaceholder(getMessage('menus.category.placeholder'))
								.setOptions(
									settings.categories.map(category =>
										new StringSelectMenuOptionBuilder()
											.setValue(String(category.id))
											.setLabel(category.name)
											.setDescription(category.description)
											.setEmoji(emoji.hasEmoji(category.emoji) ? emoji.get(category.emoji) : { id: category.emoji }),
									),
								),
						),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
