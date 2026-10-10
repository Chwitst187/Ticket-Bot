<script>
	import { I18nLite } from '@eartharoid/i18n';
	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const { client, guilds, translations } = data;
	const i18n = new I18nLite();
	const t = i18n.loadParsed(...translations).createTranslator();
	const formatter = new Intl.NumberFormat();
</script>

<svelte:head>
	<title>{t('select_server_title', { username: client.username })}</title>
	<link rel="icon" href={`${client.avatar}?size=32`} />
</svelte:head>

<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
	<!-- Server List -->
	<div>
		<div class="mb-4">
			<h3 class="text-xl font-semibold">{t('select_server')}</h3>
		</div>
		{#if guilds.length === 0}
			<div class="my-4">
				<p>No servers available.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each guilds as guild}
					{@const slug = BigInt(guild.id).toString(36)}
					<a href={`/${slug}`}>
						<div
							class="h-full w-full rounded-md bg-white p-4 shadow-md border-l-4 border-l-cyan-500 transition-colors duration-250 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
						>
							<div class="flex flex-row items-center gap-4">
								<img
									src={guild.logo}
									alt=""
									class="h-12 w-12 rounded-full"
								/>
								<p class="font-semibold truncate">{guild.name}</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Stats Section -->
	<div>
		<div class="mb-4 rounded-md bg-white p-0 shadow-md overflow-hidden dark:bg-gray-700">
			<div
				class="flex items-center justify-center gap-4 bg-gray-50 p-4 font-semibold border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600"
			>
				<img src={client.avatar} alt="" class="h-12 rounded-full" />
				<span class="text-2xl font-bold">
					{client.username}<span class="text-gray-500 dark:text-gray-400"
						>#{client.discriminator}</span
					>
				</span>
			</div>
			<div class="m-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div>
					<h6 class="font-semibold">Activated users</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.activatedUsers)}</p>
				</div>
				<div>
					<h6 class="font-semibold">Archived messages</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.archivedMessages)}</p>
				</div>
				<div>
					<h6 class="font-semibold">Resolution time</h6>
					<p class="text-gray-500 dark:text-gray-400">{client.stats.avgResolutionTime}</p>
				</div>
				<div>
					<h6 class="font-semibold">Response time</h6>
					<p class="text-gray-500 dark:text-gray-400">{client.stats.avgResponseTime}</p>
				</div>
				<div>
					<h6 class="font-semibold">Categories</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.categories)}</p>
				</div>
				<div>
					<h6 class="font-semibold">Guilds</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.guilds)}</p>
				</div>
				<div>
					<h6 class="font-semibold">Members (avg)</h6>
					<p class="text-gray-500 dark:text-gray-400">
						{formatter.format(client.stats.members)}
						({formatter.format(Math.floor(client.stats.members / client.stats.guilds))})
					</p>
				</div>
				<div>
					<h6 class="font-semibold">Tags</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.tags)}</p>
				</div>
				<div>
					<h6 class="font-semibold">Tickets</h6>
					<p class="text-gray-500 dark:text-gray-400">{formatter.format(client.stats.tickets)}</p>
				</div>
			</div>
		</div>
	</div>
</div>
