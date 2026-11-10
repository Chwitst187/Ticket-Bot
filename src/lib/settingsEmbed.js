const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
} = require('discord.js');
const ExtendedEmbedBuilder = require('./embed');
const { ensureDefaultCategory } = require('./tickets/utils');
const ms = require('ms');

function resolveColour(colour, fallback = 0x009999) {
	if (!colour) return fallback;
	try {
		if (typeof colour === 'number') return colour;
		if (typeof colour === 'string') {
			if (/^#?[0-9a-fA-F]{6}$/.test(colour)) {
				return colour.startsWith('#') ? colour : `#${colour}`;
			}
			return colour;
		}
	} catch {
		return fallback;
	}
	return fallback;
}

async function renderSettingsInterface(client, guild, activeView = 'overview') {
	let settings = await client.prisma.guild.findUnique({
		include: {
			categories: true,
			tags: true,
		},
		where: { id: guild.id },
	});

	if (!settings || settings.categories.length === 0) {
		await ensureDefaultCategory(client, guild);
		settings = await client.prisma.guild.findUnique({
			include: {
				categories: true,
				tags: true,
			},
			where: { id: guild.id },
		});
	}

	const isGerman = (settings?.locale || '').startsWith('de');
	const baseUrl = process.env.HTTP_EXTERNAL || 'http://localhost:1337';
	const dashboardUrl = `${baseUrl}/settings/${guild.id}`;

	const totalTickets = await client.prisma.ticket.count({ where: { guildId: guild.id } });
	const openTickets = await client.prisma.ticket.count({
		where: {
			guildId: guild.id,
			open: true,
		},
	});
	const closedTickets = totalTickets - openTickets;

	const staffRoleIds = [
		...new Set(
			settings.categories.flatMap(c => {
				if (Array.isArray(c.staffRoles)) return c.staffRoles;
				try {
					return JSON.parse(c.staffRoles);
				} catch {
					return [];
				}
			}),
		),
	];

	const staffRolesText = staffRoleIds.length > 0
		? staffRoleIds.map(id => `<@&${id}>`).join(' ')
		: (isGerman ? '*Keine konfiguriert (Nur Server-Verwalter)*' : '*None configured (Manage Server only)*');

	const embed = new ExtendedEmbedBuilder({
		iconURL: guild.iconURL(),
		text: settings?.footer,
	});

	try {
		embed.setColor(resolveColour(settings?.primaryColour, 0x009999));
	} catch {
		embed.setColor(0x009999);
	}

	switch (activeView) {
	case 'general': {
		embed
			.setTitle(isGerman ? (`⚙️ Allgemeine Einstellungen • ${guild.name}`) : (`⚙️ General Settings • ${guild.name}`))
			.setDescription(isGerman
				? (`Allgemeine Konfiguration für den Ticket-Bot auf **${guild.name}**:`)
				: (`General bot and server configuration for **${guild.name}**:`))
			.addFields([
				{
					inline: true,
					name: isGerman ? '🌐 Sprache' : '🌐 Language',
					value: `\`${settings.locale}\``,
				},
				{
					inline: true,
					name: isGerman ? '📁 Transkripte / Archiv' : '📁 Transcripts / Archive',
					value: settings.archive ? (isGerman ? '✅ Aktiviert' : '✅ Enabled') : (isGerman ? '❌ Deaktiviert' : '❌ Disabled'),
				},
				{
					inline: true,
					name: isGerman ? '🎨 Farben' : '🎨 Colors',
					value: `**${isGerman ? 'Primär' : 'Primary'}:** \`${settings.primaryColour}\`\n**${isGerman ? 'Erfolg' : 'Success'}:** \`${settings.successColour}\`\n**${isGerman ? 'Fehler' : 'Error'}:** \`${settings.errorColour}\``,
				},
				{
					inline: false,
					name: isGerman ? '📄 Fußzeile (Footer)' : '📄 Footer',
					value: settings.footer ? `\`${settings.footer}\`` : (isGerman ? '*Standard (leer)*' : '*Default (empty)*'),
				},
			]);
		break;
	}

	case 'logging': {
		embed
			.setTitle(isGerman ? (`📢 Protokollierung & Kanäle • ${guild.name}`) : (`📢 Logging & Channels • ${guild.name}`))
			.setDescription(isGerman
				? (`Protokoll- und Fehlerkanäle für **${guild.name}**:`)
				: (`Logging and channel configuration for **${guild.name}**:`))
			.addFields([
				{
					inline: true,
					name: isGerman ? '📋 Ticket-Protokoll' : '📋 Ticket Log',
					value: settings.logChannel ? (`<#${settings.logChannel}>`) : (isGerman ? '*Nicht konfiguriert*' : '*Not configured*'),
				},
				{
					inline: true,
					name: isGerman ? '⚠️ Fehler-Protokoll' : '⚠️ Error Log',
					value: settings.errorLogChannel ? (`<#${settings.errorLogChannel}>`) : (isGerman ? '*Nicht konfiguriert*' : '*Not configured*'),
				},
				{
					inline: false,
					name: isGerman ? '📄 Footer' : '📄 Footer',
					value: settings.footer ? `\`${settings.footer}\`` : (isGerman ? '*Standard*' : '*Default*'),
				},
			]);
		break;
	}

	case 'controls': {
		embed
			.setTitle(isGerman ? (`🔘 Ticket-Steuerung • ${guild.name}`) : (`🔘 Ticket Controls • ${guild.name}`))
			.setDescription(isGerman
				? (`Steuerungselemente und automatische Aktionen für **${guild.name}**:`)
				: (`Controls and automated actions for **${guild.name}**:`))
			.addFields([
				{
					inline: true,
					name: isGerman ? '🔒 Schließen-Button' : '🔒 Close Button',
					value: settings.closeButton ? (isGerman ? '✅ Aktiviert' : '✅ Enabled') : (isGerman ? '❌ Deaktiviert' : '❌ Disabled'),
				},
				{
					inline: true,
					name: isGerman ? '⚡ Sofortiges Schließen' : '⚡ Instant Close',
					value: settings.closeButton ? (isGerman ? '✅ Aktiviert' : '✅ Enabled') : (isGerman ? '❌ Deaktiviert' : '❌ Disabled'),
				},
				{
					inline: true,
					name: isGerman ? '🙋 Beanspruchen (Claim)' : '🙋 Claim Button',
					value: settings.claimButton ? (isGerman ? '✅ Aktiviert' : '✅ Enabled') : (isGerman ? '❌ Deaktiviert' : '❌ Disabled'),
				},
				{
					inline: true,
					name: isGerman ? '⏱️ Auto-Schließen' : '⏱️ Auto-Close',
					value: settings.autoClose ? ms(settings.autoClose) : (isGerman ? 'Deaktiviert' : 'Disabled'),
				},
				{
					inline: true,
					name: isGerman ? '⚠️ Inaktivitäts-Warnung' : '⚠️ Inactivity Warning',
					value: settings.staleAfter ? ms(settings.staleAfter) : (isGerman ? 'Deaktiviert' : 'Disabled'),
				},
			]);
		break;
	}

	case 'categories': {
		const categoryEntries = settings.categories.map(c => {
			const channelCategory = c.discordCategory ? (`<#${c.discordCategory}>`) : (isGerman ? '*Keine*' : '*None*');
			let roles = [];
			if (Array.isArray(c.staffRoles)) roles = c.staffRoles;
			else {
				try { roles = JSON.parse(c.staffRoles); } catch { roles = []; }
			}
			const rolesStr = roles.length > 0 ? roles.map(r => `<@&${r}>`).join(' ') : (isGerman ? '*Server-Verwalter*' : '*Manage Server*');
			return `• ${c.emoji || '🎫'} **${c.name}** (\`#${c.id}\`)\n` +
				`  └ **Format:** \`${c.channelName}\` • **Kategorie:** ${channelCategory}\n` +
				`  └ **Limits:** \`${c.memberLimit}\`/User, \`${c.totalLimit}\` Max • **Claiming:** ${c.claiming ? '✅' : '❌'}\n` +
				`  └ **Team-Rollen:** ${rolesStr}`;
		});

		let formattedCategories = categoryEntries.join('\n\n');
		if (formattedCategories.length > 1000) {
			formattedCategories = formattedCategories.substring(0, 990) + '\n*...und mehr*';
		}

		embed
			.setTitle(isGerman ? (`📂 Kategorien (${settings.categories.length}) • ${guild.name}`) : (`📂 Categories (${settings.categories.length}) • ${guild.name}`))
			.setDescription(isGerman
				? (`Konfigurierte Ticket-Kategorien auf **${guild.name}**:\n\n` + (formattedCategories || '*Keine*'))
				: (`Configured ticket categories on **${guild.name}**:\n\n` + (formattedCategories || '*None*')));
		break;
	}

	case 'staff_roles': {
		embed
			.setTitle(isGerman ? (`👥 Team-Rollen (${staffRoleIds.length}) • ${guild.name}`) : (`👥 Staff Roles (${staffRoleIds.length}) • ${guild.name}`))
			.setDescription(isGerman
				? (`Rollen mit Zugriff auf Tickets und Verwaltung auf **${guild.name}**:`)
				: (`Roles with ticket and management access on **${guild.name}**:`))
			.addFields([
				{
					inline: false,
					name: isGerman ? '🛡️ Konfigurierte Team-Rollen' : '🛡️ Configured Staff Roles',
					value: staffRolesText,
				},
				{
					inline: false,
					name: isGerman ? 'ℹ️ Administrator-Rechte' : 'ℹ️ Administrator Access',
					value: isGerman
						? 'Mitglieder mit der Discord-Berechtigung **Server verwalten** oder **Administrator** haben immer vollen Zugriff auf alle Tickets und Einstellungen.'
						: 'Members with Discord **Manage Server** or **Administrator** permissions always have full staff access to all tickets and settings.',
				},
			]);
		break;
	}

	case 'tags_stats': {
		const tagEntries = settings.tags.map(t => `• **${t.name}**: ${t.content.length > 60 ? t.content.substring(0, 57) + '...' : t.content}`);
		let tagsText = tagEntries.join('\n');
		if (!tagsText) tagsText = isGerman ? '*Keine Schnellantwort-Tags konfiguriert*' : '*No quick-response tags configured*';
		if (tagsText.length > 1000) tagsText = tagsText.substring(0, 990) + '\n*...*';

		embed
			.setTitle(isGerman ? (`🏷️ Tags & Statistiken • ${guild.name}`) : (`🏷️ Tags & Statistics • ${guild.name}`))
			.setDescription(isGerman ? (`Statistiken und Schnellantworten für **${guild.name}**:`) : (`Statistics and quick responses for **${guild.name}**:`))
			.addFields([
				{
					inline: true,
					name: isGerman ? '📊 Gesamte Tickets' : '📊 Total Tickets',
					value: `${totalTickets}`,
				},
				{
					inline: true,
					name: isGerman ? '🔓 Offene Tickets' : '🔓 Open Tickets',
					value: `${openTickets}`,
				},
				{
					inline: true,
					name: isGerman ? '🔒 Geschlossene Tickets' : '🔒 Closed Tickets',
					value: `${closedTickets}`,
				},
				{
					inline: false,
					name: isGerman ? (`🏷️ Schnellantwort-Tags (${settings.tags.length})`) : (`🏷️ Quick Response Tags (${settings.tags.length})`),
					value: tagsText,
				},
			]);
		break;
	}

	default: {
		embed
			.setTitle(isGerman ? (`⚙️ Einstellungen • ${guild.name}`) : (`⚙️ Settings • ${guild.name}`))
			.setDescription(isGerman
				? (`Übersicht aller Einstellungen für **${guild.name}**.\nWähle unten im Menü einen Bereich aus oder schalte Optionen direkt mit den Buttons um.`)
				: (`Overview of all settings for **${guild.name}**.\nUse the menu below to view details or toggle options directly with the buttons.`))
			.addFields([
				{
					inline: true,
					name: isGerman ? '🌐 Allgemein' : '🌐 General',
					value: `**${isGerman ? 'Sprache' : 'Locale'}:** \`${settings.locale}\`\n**${isGerman ? 'Transkripte' : 'Transcripts'}:** ${settings.archive ? '✅ Aktiviert' : '❌ Deaktiviert'}\n**${isGerman ? 'Primär' : 'Primary'}:** \`${settings.primaryColour}\``,
				},
				{
					inline: true,
					name: isGerman ? '📢 Protokollierung' : '📢 Logging',
					value: `**${isGerman ? 'Ticket-Log' : 'Ticket Log'}:** ${settings.logChannel ? (`<#${settings.logChannel}>`) : (isGerman ? '*Nicht konfiguriert*' : '*Not configured*')}\n**${isGerman ? 'Fehler-Log' : 'Error Log'}:** ${settings.errorLogChannel ? (`<#${settings.errorLogChannel}>`) : (isGerman ? '*Nicht konfiguriert*' : '*Not configured*')}`,
				},
				{
					inline: true,
					name: isGerman ? '🔘 Ticket-Steuerung' : '🔘 Ticket Controls',
					value: `**${isGerman ? 'Schließen' : 'Close'}:** ${settings.closeButton ? '✅ Aktiviert' : '❌ Deaktiviert'}\n**${isGerman ? 'Claim' : 'Claim'}:** ${settings.claimButton ? '✅ Aktiviert' : '❌ Deaktiviert'}\n**${isGerman ? 'Auto-Schließen' : 'Auto-Close'}:** ${settings.autoClose ? ms(settings.autoClose) : (isGerman ? 'Deaktiviert' : 'Disabled')}`,
				},
				{
					inline: false,
					name: isGerman ? (`👥 Team-Rollen (${staffRoleIds.length})`) : (`👥 Staff Roles (${staffRoleIds.length})`),
					value: staffRolesText,
				},
				{
					inline: false,
					name: isGerman ? (`📂 Kategorien (${settings.categories.length})`) : (`📂 Categories (${settings.categories.length})`),
					value: settings.categories.map(c => `• ${c.emoji || '🎫'} **${c.name}** (\`#${c.id}\`)`).join(', ') || (isGerman ? '*Keine*' : '*None*'),
				},
				{
					inline: false,
					name: isGerman ? '📊 Statistiken' : '📊 Statistics',
					value: `**Tags:** \`${settings.tags.length}\` • **Tickets Gesamt:** \`${totalTickets}\` • **Offen:** \`${openTickets}\` • **Geschlossen:** \`${closedTickets}\``,
				},
			]);
		break;
	}
	}

	const menuRow = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(JSON.stringify({ action: 'settings_view' }))
			.setPlaceholder(isGerman ? 'Bereich auswählen...' : 'Select settings view...')
			.addOptions([
				{
					default: activeView === 'overview',
					description: isGerman ? 'Komplette Übersicht aller Einstellungen' : 'Complete overview of all settings',
					emoji: '🌐',
					label: isGerman ? 'Übersicht' : 'Overview',
					value: 'overview',
				},
				{
					default: activeView === 'general',
					description: isGerman ? 'Sprache, Transkripte, Farbdesign & Fußzeile' : 'Locale, transcripts, colors & footer',
					emoji: '⚙️',
					label: isGerman ? 'Allgemein' : 'General',
					value: 'general',
				},
				{
					default: activeView === 'logging',
					description: isGerman ? 'Kanäle für Ticket- und Fehler-Protokolle' : 'Channels for ticket and error logs',
					emoji: '📢',
					label: isGerman ? 'Protokollierung & Kanäle' : 'Logging & Channels',
					value: 'logging',
				},
				{
					default: activeView === 'controls',
					description: isGerman ? 'Schließen, Beanspruchen, Auto-Schließen' : 'Close, Claim, and Auto-Close controls',
					emoji: '🔘',
					label: isGerman ? 'Ticket-Steuerung' : 'Ticket Controls',
					value: 'controls',
				},
				{
					default: activeView === 'categories',
					description: isGerman ? 'Alle Ticket-Kategorien im Detail' : 'All ticket categories in detail',
					emoji: '📂',
					label: isGerman ? 'Kategorien' : 'Categories',
					value: 'categories',
				},
				{
					default: activeView === 'staff_roles',
					description: isGerman ? 'Rollen mit Zugriff auf Tickets' : 'Roles with ticket access',
					emoji: '👥',
					label: isGerman ? 'Team-Rollen' : 'Staff Roles',
					value: 'staff_roles',
				},
				{
					default: activeView === 'tags_stats',
					description: isGerman ? 'Tags, Schnellantworten & Statistiken' : 'Tags, quick responses & statistics',
					emoji: '🏷️',
					label: isGerman ? 'Tags & Statistiken' : 'Tags & Statistics',
					value: 'tags_stats',
				},
			])
	);

	const buttonRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				action: 'settings_toggle',
				setting: 'closeButton',
				view: activeView,
			}))
			.setLabel(isGerman ? (`Schließen: ${settings.closeButton ? 'EIN' : 'AUS'}`) : (`Close: ${settings.closeButton ? 'ON' : 'OFF'}`))
			.setEmoji('🔒')
			.setStyle(settings.closeButton ? ButtonStyle.Success : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				action: 'settings_toggle',
				setting: 'claimButton',
				view: activeView,
			}))
			.setLabel(isGerman ? (`Claim: ${settings.claimButton ? 'EIN' : 'AUS'}`) : (`Claim: ${settings.claimButton ? 'ON' : 'OFF'}`))
			.setEmoji('🙋')
			.setStyle(settings.claimButton ? ButtonStyle.Success : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				action: 'settings_toggle',
				setting: 'archive',
				view: activeView,
			}))
			.setLabel(isGerman ? (`Archiv: ${settings.archive ? 'EIN' : 'AUS'}`) : (`Transcripts: ${settings.archive ? 'ON' : 'OFF'}`))
			.setEmoji('📁')
			.setStyle(settings.archive ? ButtonStyle.Success : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				action: 'settings_toggle',
				setting: 'refresh',
				view: activeView,
			}))
			.setLabel(isGerman ? 'Aktualisieren' : 'Refresh')
			.setEmoji('🔄')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setLabel('Dashboard')
			.setEmoji('🌐')
			.setStyle(ButtonStyle.Link)
			.setURL(dashboardUrl),
	);

	return {
		components: [menuRow, buttonRow],
		embeds: [embed],
	};
}

module.exports = {
	renderSettingsInterface,
	resolveColour,
};
