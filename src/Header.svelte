<script lang="ts">
	export let page;

	let showNavMobile = false;

	const ToggleNav = () => {
		showNavMobile = !showNavMobile;
	};
</script>

<header>
	<h1>Animated Pages</h1>
	<nav class:show={showNavMobile}>
		<a
			on:click={() => {
				page = 'home';
				showNavMobile = false;
			}}
			class:active={page === 'home'}
			href="#home">HOME</a>
		<a
			on:click={() => {
				page = 'about';
				showNavMobile = false;
			}}
			class:active={page === 'about'}
			href="#about">ABOUT</a>
		<a
			on:click={() => {
				page = 'products';
				showNavMobile = false;
			}}
			class:active={page === 'products'}
			href="#products">PRODUCTS</a>
		<a
			on:click={() => {
				page = 'contact';
				showNavMobile = false;
			}}
			class:active={page === 'contact'}
			href="#contact">CONTACT</a>
	</nav>
	<img
		on:click={ToggleNav}
		src="img/hamburger.svg"
		alt="MENU"
		id="hamburger" />
</header>

<style lang="scss">
	header {
		width: 100vw;
		height: 100px;
		margin-bottom: 75px;
		background-color: black;
		display: flex;
		align-items: center;
		justify-content: space-around;
		z-index: 2;

		position: sticky;
		top: 0;

		h1 {
			color: white;

			@media (max-width: 550px) {
				font-size: 1.6em;
			}
			@media (max-width: 400px) {
				font-size: 1.4em;
			}
		}

		#hamburger {
			display: none;
			cursor: pointer;

			@media (max-width: 800px) {
				display: block;
			}
		}

		nav {
			display: flex;

			@media (max-width: 800px) {
				position: absolute;
				top: 100px;
				width: 100vw;
				padding: 10px 0;
				background-color: black;
				opacity: 0;
				display: flex;
				justify-content: space-evenly;

				&.show {
					opacity: 1;
				}
			}
			@media (max-width: 450px) {
				flex-direction: column;
				text-align: right;
				padding-right: 25px;
			}

			a {
				padding: 8px;
				margin: 8px 12px;
				color: #aaa;
				transform: translateY(2px);
				font-size: 1.3em;
				letter-spacing: 2px;

				&::after {
					content: "";
					display: block;
					width: 0;
					height: 2px;
					background-color: #aaa;
					margin-top: 10px;
					position: relative;
					left: 50%;
					transform: translateX(-50%);
					transition: all 0.3s ease;
					opacity: 0;
				}

				&:hover,
				&.active {
					color: #fff;

					&::after {
						opacity: 1;

						@media (min-width: 801px) {
							width: calc(100% + 10px);
							background-color: #fff;
						}
					}
				}

				&.active {
					cursor: default;
				}
			}
		}
	}
</style>
