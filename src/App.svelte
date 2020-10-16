<script lang="ts">
	import Header from "./Header.svelte";

	let page = "home";

	// For example if the url is "xyz.com/#about",
	// page variable will be "about"
	if (location.href.includes("#")) {
		page = location.href.split("#").slice(-1)[0];
	}
</script>

<Header bind:page />

<!-- ANIMATE HERE -->
<div id="pages">
	<div class="page" class:show={page === 'home'}>
		<h1>HOME</h1>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit.
			Pellentesque nec tortor sit amet est finibus tincidunt. Cras non
			ornare justo. Curabitur suscipit sodales libero, aliquet accumsan
			lorem mollis sed. Vestibulum sed nulla at ex pulvinar ornare et nec
			libero. Nullam eu augue in nisl faucibus lacinia. Maecenas ac ornare
			nunc, facilisis mattis mi. Nullam non feugiat orci, quis rutrum
			neque. Pellentesque habitant morbi tristique senectus et netus et
			malesuada fames ac turpis egestas. Donec ornare ultrices elit, sit
			amet iaculis turpis tempus in. Donec viverra risus eget sapien
			faucibus volutpat. Curabitur feugiat venenatis elit, ac luctus nunc
			convallis sit amet. Donec rhoncus posuere diam, id posuere justo
			tincidunt sed. Aliquam quis eros posuere turpis consectetur
			vehicula. Nullam non velit odio. Quisque scelerisque erat facilisis
			viverra consequat. Aliquam ultricies, justo ac interdum lobortis,
			elit velit mattis ante, non placerat est nulla eu est.
		</p>
		<p>
			Sed eleifend eleifend risus, quis sagittis est egestas id.
			Suspendisse potenti. Maecenas neque turpis, sagittis ullamcorper
			magna a, molestie euismod lacus. Mauris eu lacus sit amet justo
			tristique porta. Nunc non laoreet leo. Donec eu sagittis eros.
			Aenean laoreet porttitor mi a pellentesque. Vestibulum dapibus
			dapibus auctor. Curabitur bibendum vel mi non convallis. Vivamus
			laoreet posuere justo eget viverra. Donec nec urna at odio convallis
			semper non et ex. Curabitur rhoncus, nisi sit amet gravida iaculis,
			augue tellus facilisis ligula, vitae iaculis metus dui in orci.
			Donec quis pretium elit.
		</p>
		<p>
			Pellentesque egestas sapien a eleifend viverra. Vestibulum ultrices
			tellus sapien, bibendum suscipit nulla mattis vitae. Vivamus magna
			lacus, blandit vitae metus at, consequat dignissim velit. Proin
			pharetra mauris blandit, lacinia dui nec, tristique diam. Sed in
			mattis mi, in efficitur mi. Ut mollis aliquam ante, et porttitor est
			laoreet ac. Maecenas pulvinar neque orci, et dictum erat aliquam ut.
		</p>
	</div>
	<div class="page" class:show={page === 'about'}>
		<h1>ABOUT</h1>
		<p>
			Duis massa augue, imperdiet ut sem ac, cursus sagittis nulla. Donec
			quis scelerisque sapien. Suspendisse viverra tellus at lacus dapibus
			mattis. Morbi dignissim leo vulputate, condimentum quam non,
			scelerisque odio. Fusce interdum, velit et bibendum dictum, diam dui
			ultrices orci, at bibendum orci lorem vitae lacus. Quisque ut lacus
			dignissim, hendrerit est vitae, faucibus risus. Mauris iaculis dolor
			ut diam auctor, id dapibus dolor porttitor. Mauris pharetra, felis
			id interdum elementum, mi lorem ornare metus, quis porttitor ante
			lorem in turpis. Donec accumsan consequat sem, ut ullamcorper nunc.
			Proin scelerisque purus ut turpis varius, id varius libero tempus.
			Ut lacinia condimentum egestas. Curabitur congue iaculis fringilla.
			Mauris lobortis non quam sit amet ultrices. Aliquam suscipit eget
			sem vitae malesuada.
		</p>
		<p>
			Maecenas non nisi metus. Curabitur a augue ultrices, efficitur lorem
			id, faucibus urna. Quisque a sapien massa. Duis nec libero sit amet
			erat scelerisque ultrices. Donec hendrerit sed diam vitae viverra.
			Pellentesque in finibus ipsum. In id enim non turpis molestie
			suscipit eget vel nisi. Maecenas suscipit interdum risus in tempor.
			Donec a luctus purus, sed pharetra quam. Donec dui tortor, gravida
			quis erat et, molestie iaculis mi. Sed lectus nisi, finibus sit amet
			mollis at, condimentum id augue. Nunc non volutpat nisl, ut semper
			enim. Mauris in vehicula mi, ut aliquam purus. Curabitur nec dapibus
			felis. Maecenas sagittis, erat eu auctor tincidunt, ligula elit
			hendrerit lacus, quis dignissim nunc lorem quis erat. Etiam at neque
			volutpat, sodales tellus in, malesuada magna.
		</p>
	</div>
	<div class="page" class:show={page === 'products'}>
		<h1>PRODUCTS</h1>
		<p>
			Nam a nunc velit. Duis condimentum turpis eget elit volutpat varius.
			Sed a aliquet ante. Sed luctus et lacus non tristique. Praesent
			mattis, purus non condimentum dapibus, dui arcu pharetra ex, ac
			tempus libero purus sit amet ipsum. Sed in ullamcorper lacus.
			Vestibulum ultricies fringilla felis aliquam maximus. Aliquam eu
			dolor a mauris sagittis dapibus. Duis imperdiet cursus purus, at
			egestas justo mattis ornare. Vivamus egestas, felis quis vehicula
			imperdiet, arcu lacus malesuada felis, in iaculis nunc mauris sit
			amet nibh. Etiam posuere est sed dolor auctor mattis. Nam semper,
			urna ac fringilla pellentesque, arcu purus commodo justo, eu
			consectetur lectus arcu sit amet ipsum.
		</p>
		<div class="product-list">
			<div class="product" />
			<div class="product" />
			<div class="product" />
			<div class="product" />
			<div class="product" />
		</div>
		<p>
			Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
			posuere cubilia curae; Aenean vehicula mattis felis, a porttitor
			mauris aliquet sollicitudin. Morbi nisl ante, varius sed consectetur
			id, hendrerit porttitor dui. Duis non maximus dui. Proin libero
			magna, convallis ut semper vitae, commodo eget mi. Donec sit amet
			lacus ac odio maximus consectetur eu eu ipsum. Vestibulum enim leo,
			commodo ac commodo at, egestas in neque. Sed interdum venenatis eros
			vel commodo. Aenean nec varius arcu. Aenean turpis enim, consectetur
			vel interdum id, vulputate sit amet erat. Integer vitae diam in
			nulla malesuada luctus eget vitae leo. Donec non lorem nec mi
			fringilla lacinia. Suspendisse potenti. Ut euismod lobortis nulla in
			gravida. Etiam tincidunt massa tellus.
		</p>
	</div>
	<div class="page" class:show={page === 'contact'}>
		<h1>CONTACT</h1>
		<p style="padding-left: 20px; text-indent: 0">
			<span><b>PHONE:</b> +90 538 284 8787</span>
			<br />
			<span><b>EMAIL:</b> berkin_akkaya@hotmail.com</span>
		</p>
		<p>
			In blandit interdum leo, ac accumsan elit ornare vitae. Integer
			pellentesque vitae turpis non consectetur. Aliquam orci justo,
			euismod ut tempus id, faucibus vel libero. Aliquam commodo ex ornare
			nisi ornare molestie. Vestibulum convallis sapien id magna euismod
			malesuada. Sed et commodo massa. Pellentesque habitant morbi
			tristique senectus et netus et malesuada fames ac turpis egestas.
			Mauris bibendum elit vel commodo euismod. Donec sit amet massa id
			nisl egestas suscipit eget a elit. Nulla sagittis sapien quis ex
			fermentum blandit. Cras id lorem et enim venenatis pretium. Morbi at
			pellentesque felis.
		</p>
		<p>
			Nulla ut dui neque. Aliquam bibendum, est quis mattis hendrerit,
			neque nisl consectetur mi, et bibendum magna risus id tortor.
			Phasellus in dolor sit amet tortor venenatis pellentesque. Lorem
			ipsum dolor sit amet, consectetur adipiscing elit. Morbi lacinia
			consectetur tempus. Sed volutpat urna varius finibus porttitor.
			Aenean tincidunt velit nec posuere congue. Phasellus posuere mollis
			lacinia. Morbi lacinia ex odio, sed consectetur tortor ultrices
			eget. Nulla egestas ut metus gravida semper. Phasellus libero
			ligula, porttitor sit amet eros ut, sollicitudin sagittis enim. Cras
			maximus aliquet fringilla. Nunc iaculis massa vel odio accumsan, eu
			aliquet diam eleifend.
		</p>
	</div>
</div>
<!-- ANIMATE HERE -->

<footer>
	<span>Created by</span>
	<a href="https://berkinakkaya.github.io">Berkin AKKAYA</a>
</footer>

<style lang="scss">
	#pages {
		position: relative;

		.page {
			width: 800px;
			max-width: 80vw;

			&.show {
				animation: FadeIn 1s;
				animation-fill-mode: forwards;
				position: relative;
				z-index: 1;
			}
			&:not(.show) {
				animation: FadeOut 1s;
				animation-fill-mode: forwards;
				position: absolute;
			}

			h1 {
				margin-bottom: 40px;
			}
			p {
				text-indent: 15px;
				line-height: 1.6em;

				&:not(:nth-last-child(1)) {
					margin-bottom: 40px;
				}
			}
		}
	}

	@keyframes FadeIn {
		0% {
			transform: translateX(-50%);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}
	@keyframes FadeOut {
		0% {
			transform: translateX(0);
			opacity: 1;
		}
		100% {
			transform: translateX(50%);
			opacity: 0;
		}
	}

	.product-list {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
		margin: 40px 0;

		.product {
			width: 100%;
			height: 150px;
			background-color: #999;
		}
	}

	footer {
		margin: 75px 0;

		span {
			opacity: 0.5;
		}
		a {
			color: black;
			opacity: 0.7;
			font-weight: bold;

			&:hover {
				opacity: 1;
			}
		}
	}
</style>
