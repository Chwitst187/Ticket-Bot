import { redirect } from '@sveltejs/kit';
import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ parent, fetch }) {
	const { locale } = await parent();
	const guilds = await (await fetch(`/api/guilds`)).json();

	return {
		translations: importJSON(
			await import(`../../lib/locales/${locale}/_common.json`),
			await import(`../../lib/locales/${locale}/misc.json`)
		),
		guilds
	};
}
