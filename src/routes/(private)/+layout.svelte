<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user: string | null = null;

	onMount(() => {
		// Allow the login page itself!
		if (window.location.pathname === "/login") return;

		user = localStorage.getItem("user");
		if (!user) goto("/landing-page");
	});

	function logout() {
		localStorage.removeItem('user');
		goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>



<!-- This renders your page's content -->
<slot />
