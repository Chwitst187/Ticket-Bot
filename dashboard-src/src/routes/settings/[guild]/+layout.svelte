<script>
	/** @type {{data: any, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	const { guild } = data;
</script>

<div class="text-center">
	<a
		href="./"
		class="link mb-4 inline-block rounded-md bg-gray-50/75 p-2 px-4 font-semibold text-gray-500 shadow-sm dark:bg-gray-800/75 dark:text-gray-400"
	>
		<i class="fa-solid fa-arrow-left"></i>
		{guild.name}
	</a>
</div>

{@render children?.()}
