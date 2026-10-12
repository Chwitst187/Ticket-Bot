const {
	cleanCodeBlockContent,
	EmbedBuilder,
} = require('discord.js');
const { diff: getDiff } = require('object-diffy');
const ShortUniqueId = require('short-unique-id');
const { pools } = require('./threads');

const { crypto } = pools;
const uid = new ShortUniqueId();

const getSUID = () => uid.stamp(10);

const uuidRegex = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g;

const exists = thing => typeof thing === 'string' ? thing.length > 0 : thing !== null && thing !== undefined;

const arrToObj = obj => {
	for (const key in obj) {
		if (obj[key] instanceof Array && obj[key][0]?.id) {
			const temp = {};
			obj[key].forEach(v => (temp[v.id] = v));
			obj[key] = temp;
		}
	}
	return obj;
};

function makeDiff({
	original, updated,
}) {
	const diff = getDiff(arrToObj(original), arrToObj(updated));
	const fields = [];
	for (const key in diff) {
		if (key === 'createdAt') continue; // object-diffy doesn't like dates
		const from = exists(diff[key].from) ? `- ${String(diff[key].from).replace(/\n/g, '\\n')}\n` : '';
		const to = exists(diff[key].to) ? `+ ${String(diff[key].to).replace(/\n/g, '\\n')}\n` : '';
		fields.push({
			inline: true,
			name: key.replace(uuidRegex, $1 => $1.split('-')[0]),
			value: `\`\`\`diff\n${cleanCodeBlockContent(from + to)}\n\`\`\``,
		});
	}
	return fields;
}

/**
 * @param {import("client")} client
 * @param {string} guildId
 * @returns {import("discord.js").TextChannel?}
*/
async function getLogChannel(client, guildId) {
	const { logChannel: channelId } = await client.prisma.guild.findUnique({
		select: { logChannel: true },
		where: { id: guildId },
	});
	return channelId && client.channels.cache.get(channelId);
}

/**
 * @param {import("client")} client
 * @param {object} details
 * @param {string} details.guildId
 * @param {string} details.userId
 * @param {string} details.action
*/
async function logAdminEvent(client, {
	guildId, userId, action, target, diff,
}) {
	const settings = await client.prisma.guild.findUnique({
		select: {
			footer: true,
			locale: true,
			logChannel: true,
		},
		where: { id: guildId },
	});
	/** @type {import("discord.js").Guild} */
	const guild = client.guilds.cache.get(guildId);
	if (!guild) return;

	let member = null;
	try {
		member = await guild.members.fetch(userId);
	} catch {
		member = null;
	}
	const user = member?.user || await client.users.fetch(userId).catch(() => null);

	client.log.info.settings(`${user?.tag || userId} ${action}d ${target.type} ${target.id}`);
	if (!settings?.logChannel) return;

	const colours = {
		create: 0x57F287,
		delete: 0xED4245,
		update: 0xFEE75C,
	};
	const colour = colours[action] || 0x5865F2;
	const getMessage = client.i18n.getLocale(settings.locale);
	const i18nOptions = {
		user: user ? `<@${user.id}>` : `<@${userId}>`,
		verb: getMessage(`log.admin.verb.${action}`),
	};
	const channel = client.channels.cache.get(settings.logChannel);
	if (!channel) return;

	const actionIcons = {
		create: '➕',
		delete: '🗑️',
		update: '✏️',
	};
	const icon = actionIcons[action] || '⚙️';

	const authorName = member
		? `${member.displayName} (@${member.user.username})`
		: (user ? `${user.username}` : 'System');
	const authorIcon = member?.displayAvatarURL({
		dynamic: true,
		size: 128,
	}) ||
		user?.displayAvatarURL({
			dynamic: true,
			size: 128,
		}) ||
		guild.iconURL({ dynamic: true });

	const mainEmbed = new EmbedBuilder()
		.setColor(colour)
		.setAuthor({
			iconURL: authorIcon,
			name: authorName,
		})
		.setTitle(`${icon} ${getMessage('log.admin.title.joined', {
			...i18nOptions,
			targetType: getMessage(`log.admin.title.target.${target.type}`),
			verb: getMessage(`log.admin.verb.${action}`),
		})}`)
		.setDescription(`> ${getMessage('log.admin.description.joined', {
			...i18nOptions,
			targetType: getMessage(`log.admin.description.target.${target.type}`),
			verb: getMessage(`log.admin.verb.${action}`),
		})}`)
		.setThumbnail(authorIcon || guild.iconURL({
			dynamic: true,
			size: 256,
		}))
		.addFields([
			{
				inline: true,
				name: `🎯 ${getMessage(`log.admin.title.target.${target.type}`)}`,
				value: target.name ? `${target.name} (\`${target.id}\`)` : `\`${target.id}\``,
			},
			{
				inline: true,
				name: '🛠️ ' + (getMessage('log.ticket.fields.action_by') || 'Ausgeführt von'),
				value: `<@${userId}>`,
			},
		])
		.setFooter({
			iconURL: guild.iconURL({ dynamic: true }) || undefined,
			text: `${guild.name} • Admin Log`,
		})
		.setTimestamp();

	if (guild.bannerURL()) {
		mainEmbed.setImage(guild.bannerURL({ size: 1024 }));
	}

	const embeds = [mainEmbed];

	if (diff?.original && Object.entries(makeDiff(diff)).length) {
		embeds.push(
			new EmbedBuilder()
				.setColor(colour)
				.setTitle(`📝 ${getMessage('log.admin.changes')}`)
				.setFields(makeDiff(diff))
				.setFooter({
					iconURL: guild.iconURL({ dynamic: true }) || undefined,
					text: `${guild.name} • Admin Log`,
				})
				.setTimestamp(),
		);
	}

	return await channel.send({ embeds });
}

/**
 * @param {import("client")} client
 * @param {object} details
 * @param {string} details.userId
 * @param {string} details.action
 * @param {object} details.target
 * @param {object} [details.diff]
 * @param {object} [details.payload]
*/
async function logTicketEvent(client, {
	userId, action, target, diff, payload,
}) {
	const ticket = await client.tickets.getTicket(target.id, true) || await client.tickets.getTicket(target.id);
	if (!ticket) return;
	/** @type {import("discord.js").Guild} */
	const guild = client.guilds.cache.get(ticket.guild.id);
	if (!guild) return;

	let member = null;
	try {
		member = await guild.members.fetch(userId);
	} catch {
		member = null;
	}
	const user = member?.user || await client.users.fetch(userId).catch(() => null);

	client.log.info.tickets(`${user?.tag || userId} ${client.i18n.getMessage('en-GB', `log.ticket.verb.${action}`)} ticket ${target.id}`);
	if (!ticket.guild.logChannel) return;
	const channel = client.channels.cache.get(ticket.guild.logChannel);
	if (!channel) return;

	const colours = {
		claim: 0x5865F2,
		close: 0xED4245,
		create: 0x57F287,
		unclaim: 0xFEE75C,
		update: 0xEB459E,
	};
	const colour = colours[action] || ticket.guild.primaryColour || 0x5865F2;

	const actionIcons = {
		claim: '🙌',
		close: '🔴',
		create: '🟢',
		unclaim: '♻️',
		update: '⚙️',
	};
	const actionIcon = actionIcons[action] || '🎫';

	const getMessage = client.i18n.getLocale(ticket.guild.locale);
	const i18nOptions = {
		user: user ? `<@${user.id}>` : `<@${userId}>`,
		verb: getMessage(`log.ticket.verb.${action}`),
	};

	const authorName = member
		? `${member.displayName} (@${member.user.username})`
		: (user ? `${user.username}` : 'System');
	const authorIcon = member?.displayAvatarURL({
		dynamic: true,
		size: 128,
	}) ||
		user?.displayAvatarURL({
			dynamic: true,
			size: 128,
		}) ||
		guild.iconURL({ dynamic: true });

	const footerIcon = guild.iconURL({ dynamic: true }) || undefined;
	const footerText = `${guild.name} • Ticket #${ticket.number}`;

	const title = `${actionIcon} Ticket #${ticket.number} • ${getMessage('log.ticket.title', i18nOptions)}`;
	const description = `> ${getMessage('log.ticket.description', i18nOptions)}`;

	let thumbnailURL = null;
	if (action === 'create') {
		const creator = ticket.createdById ? await client.users.fetch(ticket.createdById).catch(() => null) : null;
		thumbnailURL = creator?.displayAvatarURL({
			dynamic: true,
			size: 256,
		}) ||
			authorIcon ||
			guild.iconURL({
				dynamic: true,
				size: 256,
			});
	} else {
		thumbnailURL = authorIcon || guild.iconURL({
			dynamic: true,
			size: 256,
		});
	}

	const fields = [];

	let channelDisplay;
	if (action === 'close' || !client.channels.cache.has(ticket.id)) {
		channelDisplay = target.name || `${ticket.category ? `${ticket.category.name} ` : ''}#${ticket.number}`;
	} else {
		channelDisplay = `<#${ticket.id}>`;
	}

	fields.push({
		inline: true,
		name: `🎫 ${getMessage('log.ticket.ticket')}`,
		value: channelDisplay,
	});

	if (ticket.category) {
		const categoryLabel = `${ticket.category.emoji ? ticket.category.emoji + ' ' : ''}${ticket.category.name}`;
		fields.push({
			inline: true,
			name: `📁 ${getMessage('log.ticket.fields.category') || 'Kategorie'}`,
			value: categoryLabel,
		});
	}

	fields.push({
		inline: true,
		name: `👤 ${getMessage('log.ticket.fields.creator') || 'Ersteller'}`,
		value: `<@${ticket.createdById}>`,
	});

	if (action === 'claim') {
		if (ticket.claimedRoleId) {
			fields.push({
				inline: true,
				name: `🏷️ ${getMessage('log.ticket.fields.assigned_to') || 'Zugewiesen an'}`,
				value: `<@&${ticket.claimedRoleId}>`,
			});
		} else if (ticket.claimedById) {
			fields.push({
				inline: true,
				name: `👤 ${getMessage('log.ticket.fields.assigned_to') || 'Zugewiesen an'}`,
				value: `<@${ticket.claimedById}>`,
			});
		}
		fields.push({
			inline: true,
			name: `🛠️ ${getMessage('log.ticket.fields.action_by') || 'Ausgeführt von'}`,
			value: `<@${userId}>`,
		});
	} else if (action === 'unclaim') {
		fields.push({
			inline: true,
			name: `♻️ ${getMessage('log.ticket.fields.released_by') || 'Freigegeben von'}`,
			value: `<@${userId}>`,
		});
	} else if (action === 'close') {
		fields.push({
			inline: true,
			name: `🔒 ${getMessage('log.ticket.fields.closed_by') || 'Geschlossen von'}`,
			value: `<@${userId}>`,
		});
	} else if (action === 'update') {
		fields.push({
			inline: true,
			name: `🛠️ ${getMessage('log.ticket.fields.action_by') || 'Ausgeführt von'}`,
			value: `<@${userId}>`,
		});
	}

	if (action === 'create' && ticket.topic) {
		let decryptedTopic = null;
		try {
			decryptedTopic = await crypto.queue(w => w.decrypt(ticket.topic));
		} catch {
			decryptedTopic = ticket.topic;
		}
		if (decryptedTopic) {
			fields.push({
				inline: false,
				name: `📌 ${getMessage('dm.closed.fields.topic') || 'Thema'}`,
				value: `> ${decryptedTopic}`,
			});
		}
	}

	if (payload?.fields?.length) {
		for (const field of payload.fields) {
			const isDuplicate = fields.some(f => f.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === field.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
			if (!isDuplicate) {
				fields.push(field);
			}
		}
	}

	const mainEmbed = new EmbedBuilder()
		.setColor(colour)
		.setAuthor({
			iconURL: authorIcon,
			name: authorName,
		})
		.setTitle(title)
		.setDescription(description)
		.addFields(fields)
		.setFooter({
			iconURL: footerIcon,
			text: footerText,
		})
		.setTimestamp();

	if (thumbnailURL) {
		mainEmbed.setThumbnail(thumbnailURL);
	}

	if (ticket.category?.image && typeof ticket.category.image === 'string' && ticket.category.image.startsWith('http')) {
		mainEmbed.setImage(ticket.category.image);
	} else if (guild.bannerURL()) {
		mainEmbed.setImage(guild.bannerURL({ size: 1024 }));
	}

	const embeds = [mainEmbed];

	if (diff?.original && Object.entries(makeDiff(diff)).length) {
		embeds.push(
			new EmbedBuilder()
				.setColor(colour)
				.setTitle(`📝 ${getMessage('log.admin.changes')}`)
				.setFields(makeDiff(diff))
				.setFooter({
					iconURL: footerIcon,
					text: footerText,
				})
				.setTimestamp(),
		);
	}

	return await channel.send({
		components: payload?.components ?? [],
		embeds,
	});
}

/**
 * @param {import("client")} client
 * @param {object} details
 * @param {string} details.action
 * @param {import("discord.js").Message} details.target
 * @param {import("@prisma/client").Ticket & {guild: import("@prisma/client").Guild}} details.ticket
*/
async function logMessageEvent(client, {
	action, executor, target, ticket, diff,
}) {
	if (!ticket) return;
	if (executor === undefined) executor = target.member;
	client.log.info.tickets(`${executor?.user?.tag || executor?.tag || 'Unknown'} ${client.i18n.getMessage('en-GB', `log.message.verb.${action}`)} message ${target.id}`);
	if (!ticket.guild.logChannel) return;
	const colours = {
		delete: 0xED4245,
		update: 0xFEE75C,
	};
	const colour = colours[action] || 0x5865F2;
	const getMessage = client.i18n.getLocale(ticket.guild.locale);
	const i18nOptions = {
		user: executor?.user ? `<@${executor.user.id}>` : (executor?.id ? `<@${executor.id}>` : 'Unknown'),
		verb: getMessage(`log.message.verb.${action}`),
	};
	const channel = client.channels.cache.get(ticket.guild.logChannel);
	if (!channel) return;
	const guild = client.guilds.cache.get(ticket.guild.id);

	const authorName = target.member
		? `${target.member.displayName} (@${target.author?.username || target.member.user?.username})`
		: (target.author ? target.author.username : 'Unknown');
	const authorIcon = target.member?.displayAvatarURL({ dynamic: true }) ||
		target.author?.displayAvatarURL({ dynamic: true }) ||
		'https://discord.com/assets/1f0bfc0865d324c2587920a7d80c609b.png';

	const actionIcons = {
		delete: '🗑️',
		update: '✏️',
	};
	const icon = actionIcons[action] || '💬';

	const mainEmbed = new EmbedBuilder()
		.setColor(colour)
		.setAuthor({
			iconURL: authorIcon,
			name: authorName,
		})
		.setTitle(`${icon} Ticket #${ticket.number} • ${getMessage('log.message.title', i18nOptions)}`)
		.setDescription(`> ${getMessage('log.message.description', i18nOptions)}`)
		.setThumbnail(authorIcon)
		.addFields([
			{
				inline: true,
				name: `🎫 ${getMessage('log.ticket.ticket')}`,
				value: `<#${ticket.id}>`,
			},
			{
				inline: true,
				name: `💬 ${getMessage('log.message.message')}`,
				value: `[\`${target.id}\`](${target.url})`,
			},
			{
				inline: true,
				name: '👤 ' + (getMessage('log.ticket.fields.creator') || 'Autor'),
				value: target.author ? `<@${target.author.id}>` : '-',
			},
		])
		.setFooter({
			iconURL: guild?.iconURL({ dynamic: true }) || undefined,
			text: `${guild?.name || 'Server'} • Ticket #${ticket.number}`,
		})
		.setTimestamp();

	const imageAttachment = target.attachments?.find(att => {
		const contentType = att.contentType || '';
		return contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.name || att.url);
	});
	if (imageAttachment) {
		mainEmbed.setImage(imageAttachment.url);
	}

	const embeds = [mainEmbed];

	if (diff?.original && Object.entries(makeDiff(diff)).length) {
		embeds.push(
			new EmbedBuilder()
				.setColor(colour)
				.setTitle(`📝 ${getMessage('log.admin.changes')}`)
				.setFields(makeDiff(diff))
				.setFooter({
					iconURL: guild?.iconURL({ dynamic: true }) || undefined,
					text: `${guild?.name || 'Server'} • Ticket #${ticket.number}`,
				})
				.setTimestamp(),
		);
	}

	return await channel.send({ embeds });
}

module.exports = {
	getLogChannel,
	getSUID,
	logAdminEvent,
	logMessageEvent,
	logTicketEvent,
};
