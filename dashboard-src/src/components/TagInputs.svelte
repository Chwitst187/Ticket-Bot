<script>
	import { getContext } from 'svelte';
	import { marked } from 'marked';
	import Required from './Required.svelte';
	/** @type {{tag: any}} */
	let { tag = $bindable() } = $props();
</script>

<div>
	<label>
		<span class="font-semibold">Name</span>
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The tag name - can contain UNICODE emoji (not emoji names)"
		></i>
		<input type="text" class="input form-input" required bind:value={tag.name} />
	</label>
</div>
<div>
	<label>
		<span class="font-semibold">Auto tag regular expression</span>
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="Optional - regex to trigger this tag"
		></i>
		<input type="text" class="input form-input" bind:value={tag.regex} />
	</label>
</div>
<div>
	<label class="font-semibold">
		<span class="font-semibold">Content</span>
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The tag content"
		></i>
		<textarea class="input form-input h-24" maxlength="4096" required bind:value={tag.content}
		></textarea>
	</label>
	{#if tag.content}
		<p class="text-sm font-semibold">Preview</p>
		<div
			class="block w-full break-words prose prose-slate dark:prose-invert prose-a:text-cyan-600 rounded-md bg-gray-100 p-3 font-mono text-sm shadow-sm dark:bg-gray-900"
		>
			{@html marked.parse(
				tag.content
					.replace(/\n/g, '\n\n')
					.replace(/{+\s?(user)?name\s?}+/gi, '@' + getContext('user').username)
			)}
		</div>
	{/if}
</div>

