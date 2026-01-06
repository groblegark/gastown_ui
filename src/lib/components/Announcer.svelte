<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		/** Current message to announce */
		message?: string;
		/** Politeness level: polite for status updates, assertive for errors */
		politeness?: 'polite' | 'assertive';
		/** Clear message after announcement (ms), 0 to keep */
		clearAfter?: number;
		/** Additional classes */
		class?: string;
	}

	let {
		message = '',
		politeness = 'polite',
		clearAfter = 0,
		class: className = ''
	}: Props = $props();

	// Track displayed message for clearing (effect updates it when message changes)
	let displayedMessage = $state('');

	// Update displayed message when message changes
	$effect(() => {
		if (message) {
			displayedMessage = message;

			if (clearAfter > 0) {
				const timeout = setTimeout(() => {
					displayedMessage = '';
				}, clearAfter);

				return () => clearTimeout(timeout);
			}
		}
	});
</script>

<!--
	Screen reader announcer component.
	Use for dynamic status updates that should be announced to assistive technology.

	Examples:
	- Status changes: "Agent started", "Task complete"
	- Errors: "Failed to load data"
	- Progress: "Loading, 50% complete"
-->
<div
	class={cn('sr-only', className)}
	role={politeness === 'assertive' ? 'alert' : 'status'}
	aria-live={politeness}
	aria-atomic="true"
>
	{displayedMessage}
</div>
