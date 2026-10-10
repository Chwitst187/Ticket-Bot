<script>
	let { question = $bindable() } = $props();
	import Required from '../Required.svelte';
</script>

<div>
	<label class="font-semibold">
		Label
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The title of the question"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			required
			maxlength="45"
			bind:value={question.label}
		/>
	</label>
</div>
<div>
	<label class="font-semibold">
		Maximum length
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The maximum input length"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min="1"
			max="1000"
			bind:value={question.maxLength}
		/>
	</label>
</div>
<div>
	<label class="font-semibold">
		Minimum length
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The minimum input length"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min="0"
			max="1000"
			bind:value={question.minLength}
		/>
	</label>
</div>
<div>
	<label class="font-semibold">
		Placeholder
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="The placeholder value, such as a hint"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			maxlength="100"
			bind:value={question.placeholder}
		/>
	</label>
</div>
<div>
	<label for="required" class="font-semibold">
		Required
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="Require input?"
		></i>
		<input
			type="checkbox"
			id="required"
			name="required"
			class="form-checkbox"
			bind:checked={question.required}
		/>
	</label>
</div>
<div>
	<label class="font-semibold">
		Style
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="How big should the input box be?"
		></i>
		<select class="input form-multiselect" required bind:value={question.style}>
			<option value={1} class="p-1">
				<!-- <i class="fa-solid fa-hashtag text-gray-500 dark:text-gray-400" /> -->
				Short (single-line)
			</option>
			<option value={2} class="p-1">
				<!-- <i class="fa-solid fa-hashtag text-gray-500 dark:text-gray-400" /> -->
				Long (multi-line)
			</option>
		</select>
	</label>
</div>
<div>
	<label class="font-semibold">
		Value
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-gray-400"
			title="A pre-filled value"
		></i>
		<textarea class="input form-input text-sm" maxlength="1000" bind:value={question.value}
		></textarea>
	</label>
</div>

