<script>
	import { I18nLite } from "@eartharoid/i18n";
	import { getContext } from "svelte";
	/** @type {{data: import("./$types").PageData}} */
	let { data } = $props();
	const { client, translations, query } = data;
	const i18n = new I18nLite();
	const t = i18n.loadParsed(...translations).createTranslator();

	let theme = getContext("theme");
</script>

<svelte:head>
	<title>{t("login_title", { username: client.username })}</title>
	<link rel="icon" href={`${client.avatar}?size=32`} />
</svelte:head>

<div class="min-h-screen bg-gray-200 dark:bg-gray-900 flex flex-col justify-center items-center text-gray-800 dark:text-gray-300">
	<div class="mb-8 flex justify-center">
		<!-- Pterodactyl typically shows its logo above the box -->
		<img src="/assets/wordmark-{theme}.png" class="h-10" alt="Discord Tickets" />
	</div>
	
	<div class="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-md shadow-md border-t-4 border-cyan-500">
		<div class="flex flex-col items-center gap-6 p-4">
			<img src={`${client.avatar}?size=256`} alt="" class="h-20 w-20 rounded-full" />
			<h2 class="text-xl font-semibold text-center">{t("please_login")}</h2>
			<a
				href={"/auth/login" + query}
				class="w-full text-center rounded-md bg-cyan-600 p-3 font-semibold text-white transition-colors duration-250 hover:bg-cyan-500 focus:outline-none"
			>
				<span class="flex flex-row items-center justify-center gap-2">
					<i class="fa-brands fa-discord text-lg"></i>
					{t("continue_with_discord")}
				</span>
			</a>
		</div>
	</div>

	<div class="mt-8 flex gap-6 text-sm text-gray-500 dark:text-gray-500">
		<div class="flex items-center gap-2">
			<i class="fa-solid fa-globe"></i>
			{t("common:language")}
		</div>
		<div class="flex items-center gap-2">
			<i class="fa-solid {theme === "dark" ? "fa-moon" : "fa-sun"}"></i>
			{t("common:theme")}
		</div>
	</div>
</div>