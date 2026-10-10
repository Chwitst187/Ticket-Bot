<script>
	import TopBar from '$components/TopBar.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { navigating } from '$app/stores';
	// import { Modals } from 'svelte-modals';
	import Spinner from '$components/Spinner.svelte';
	/** @type {{data: any, children?: import('svelte').Snippet}} */
	let { data, children } = $props();
	const { client, user, theme } = data;

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
		return () => (mounted = false);
	});
</script>

<div class="absolute h-max min-h-screen w-full bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
	<!-- <Modals>
		{#snippet backdrop({ close })}
			<div class="backdrop" transition:fade onclick={close} onkeypress={close}></div>
		{/snippet}
		{#snippet loading()}
			<div><Spinner /></div>
		{/snippet}
	</Modals> -->
	{#if $navigating || !mounted}
		<div class="h-dvh flex items-center justify-center">
			<Spinner />
		</div>
	{:else}
		<TopBar {user} {theme} />
		<div class="m-2 sm:m-6 lg:m-12">
			<div class="mx-auto max-w-7xl">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>
