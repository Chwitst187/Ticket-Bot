const { SlashCommand } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { isStaff } = require('../../lib/users');
const ExtendedEmbedBuilder = require('../../lib/embed');

module.exports = class StaffStatsSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'staff-stats';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, 'commands.slash.staff-stats.description') || 'View staff ticket performance statistics',
			dmPermission: false,
			name,
		});
	}

	async run(interaction) {
		const client = this.client;
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings?.footer,
					})
						.setColor(settings?.errorColour || 0xff0000)
						.setTitle('❌ Error')
						.setDescription('Only staff members can view staff statistics.'),
				],
			});
		}
		const tickets = await client.prisma.ticket.findMany({
			select: { claimedById: true, closedById: true },
			where: { guildId: interaction.guild.id },
		});
		const statsMap = {};
		for (const t of tickets) {
			if (t.claimedById) {
				if (!statsMap[t.claimedById]) statsMap[t.claimedById] = { userId: t.claimedById, claimed: 0, closed: 0 };
				statsMap[t.claimedById].claimed++;
			}
			if (t.closedById) {
				if (!statsMap[t.closedById]) statsMap[t.closedById] = { userId: t.closedById, claimed: 0, closed: 0 };
				statsMap[t.closedById].closed++;
			}
		}
		const entries = Object.values(statsMap);
		let description = entries.length === 0 ? 'No staff activity recorded yet.' : entries.map(e => '<@' + e.userId + '> — **Claimed:** ' + e.claimed + ', **Closed:** ' + e.closed).join('\n');
		const embed = new ExtendedEmbedBuilder({
			iconURL: interaction.guild.iconURL(),
			text: settings?.footer,
		})
			.setColor(settings?.primaryColour || 0x009999)
			.setTitle('📊 Staff Statistics')
			.setDescription(description);
		return await interaction.editReply({ embeds: [embed] });
	}
};
