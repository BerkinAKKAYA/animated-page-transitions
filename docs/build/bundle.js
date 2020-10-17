
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Header.svelte generated by Svelte v3.25.1 */

    const file = "src/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let nav;
    	let a0;
    	let t3;
    	let a1;
    	let t5;
    	let a2;
    	let t7;
    	let a3;
    	let t9;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Animated Pages";
    			t1 = space();
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "HOME";
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "ABOUT";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "PRODUCTS";
    			t7 = space();
    			a3 = element("a");
    			a3.textContent = "CONTACT";
    			t9 = space();
    			img = element("img");
    			attr_dev(h1, "class", "svelte-1ibcjs1");
    			add_location(h1, file, 8, 1, 148);
    			attr_dev(a0, "href", "#home");
    			attr_dev(a0, "class", "svelte-1ibcjs1");
    			toggle_class(a0, "active", /*page*/ ctx[0] === "home");
    			add_location(a0, file, 10, 2, 208);
    			attr_dev(a1, "href", "#about");
    			attr_dev(a1, "class", "svelte-1ibcjs1");
    			toggle_class(a1, "active", /*page*/ ctx[0] === "about");
    			add_location(a1, file, 17, 2, 345);
    			attr_dev(a2, "href", "#products");
    			attr_dev(a2, "class", "svelte-1ibcjs1");
    			toggle_class(a2, "active", /*page*/ ctx[0] === "products");
    			add_location(a2, file, 24, 2, 486);
    			attr_dev(a3, "href", "#contact");
    			attr_dev(a3, "class", "svelte-1ibcjs1");
    			toggle_class(a3, "active", /*page*/ ctx[0] === "contact");
    			add_location(a3, file, 31, 2, 639);
    			attr_dev(nav, "class", "svelte-1ibcjs1");
    			toggle_class(nav, "show", /*showNavMobile*/ ctx[1]);
    			add_location(nav, file, 9, 1, 173);
    			if (img.src !== (img_src_value = "img/hamburger.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "MENU");
    			attr_dev(img, "id", "hamburger");
    			attr_dev(img, "class", "svelte-1ibcjs1");
    			add_location(img, file, 39, 1, 795);
    			attr_dev(header, "class", "svelte-1ibcjs1");
    			add_location(header, file, 7, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t3);
    			append_dev(nav, a1);
    			append_dev(nav, t5);
    			append_dev(nav, a2);
    			append_dev(nav, t7);
    			append_dev(nav, a3);
    			append_dev(header, t9);
    			append_dev(header, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[4], false, false, false),
    					listen_dev(a2, "click", /*click_handler_2*/ ctx[5], false, false, false),
    					listen_dev(a3, "click", /*click_handler_3*/ ctx[6], false, false, false),
    					listen_dev(img, "click", /*ToggleNav*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1) {
    				toggle_class(a0, "active", /*page*/ ctx[0] === "home");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(a1, "active", /*page*/ ctx[0] === "about");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(a2, "active", /*page*/ ctx[0] === "products");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(a3, "active", /*page*/ ctx[0] === "contact");
    			}

    			if (dirty & /*showNavMobile*/ 2) {
    				toggle_class(nav, "show", /*showNavMobile*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { page } = $$props;
    	let showNavMobile = false;

    	const ToggleNav = () => {
    		$$invalidate(1, showNavMobile = !showNavMobile);
    	};

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, page = "home");
    		$$invalidate(1, showNavMobile = false);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, page = "about");
    		$$invalidate(1, showNavMobile = false);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, page = "products");
    		$$invalidate(1, showNavMobile = false);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, page = "contact");
    		$$invalidate(1, showNavMobile = false);
    	};

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ page, showNavMobile, ToggleNav });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("showNavMobile" in $$props) $$invalidate(1, showNavMobile = $$props.showNavMobile);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		page,
    		showNavMobile,
    		ToggleNav,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !("page" in props)) {
    			console.warn("<Header> was created without expected prop 'page'");
    		}
    	}

    	get page() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.1 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let updating_page;
    	let t0;
    	let div10;
    	let div0;
    	let h10;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let div1;
    	let h11;
    	let t10;
    	let p3;
    	let t12;
    	let p4;
    	let t14;
    	let div8;
    	let h12;
    	let t16;
    	let p5;
    	let t18;
    	let div7;
    	let div2;
    	let t19;
    	let div3;
    	let t20;
    	let div4;
    	let t21;
    	let div5;
    	let t22;
    	let div6;
    	let t23;
    	let p6;
    	let t25;
    	let div9;
    	let h13;
    	let t27;
    	let p7;
    	let span0;
    	let b0;
    	let t29;
    	let t30;
    	let br;
    	let t31;
    	let span1;
    	let b1;
    	let t33;
    	let t34;
    	let p8;
    	let t36;
    	let p9;
    	let t38;
    	let footer;
    	let span2;
    	let t40;
    	let a;
    	let current;

    	function header_page_binding(value) {
    		/*header_page_binding*/ ctx[1].call(null, value);
    	}

    	let header_props = {};

    	if (/*page*/ ctx[0] !== void 0) {
    		header_props.page = /*page*/ ctx[0];
    	}

    	header = new Header({ props: header_props, $$inline: true });
    	binding_callbacks.push(() => bind(header, "page", header_page_binding));

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div10 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "HOME";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tPellentesque nec tortor sit amet est finibus tincidunt. Cras non\n\t\t\tornare justo. Curabitur suscipit sodales libero, aliquet accumsan\n\t\t\tlorem mollis sed. Vestibulum sed nulla at ex pulvinar ornare et nec\n\t\t\tlibero. Nullam eu augue in nisl faucibus lacinia. Maecenas ac ornare\n\t\t\tnunc, facilisis mattis mi. Nullam non feugiat orci, quis rutrum\n\t\t\tneque. Pellentesque habitant morbi tristique senectus et netus et\n\t\t\tmalesuada fames ac turpis egestas. Donec ornare ultrices elit, sit\n\t\t\tamet iaculis turpis tempus in. Donec viverra risus eget sapien\n\t\t\tfaucibus volutpat. Curabitur feugiat venenatis elit, ac luctus nunc\n\t\t\tconvallis sit amet. Donec rhoncus posuere diam, id posuere justo\n\t\t\ttincidunt sed. Aliquam quis eros posuere turpis consectetur\n\t\t\tvehicula. Nullam non velit odio. Quisque scelerisque erat facilisis\n\t\t\tviverra consequat. Aliquam ultricies, justo ac interdum lobortis,\n\t\t\telit velit mattis ante, non placerat est nulla eu est.";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Sed eleifend eleifend risus, quis sagittis est egestas id.\n\t\t\tSuspendisse potenti. Maecenas neque turpis, sagittis ullamcorper\n\t\t\tmagna a, molestie euismod lacus. Mauris eu lacus sit amet justo\n\t\t\ttristique porta. Nunc non laoreet leo. Donec eu sagittis eros.\n\t\t\tAenean laoreet porttitor mi a pellentesque. Vestibulum dapibus\n\t\t\tdapibus auctor. Curabitur bibendum vel mi non convallis. Vivamus\n\t\t\tlaoreet posuere justo eget viverra. Donec nec urna at odio convallis\n\t\t\tsemper non et ex. Curabitur rhoncus, nisi sit amet gravida iaculis,\n\t\t\taugue tellus facilisis ligula, vitae iaculis metus dui in orci.\n\t\t\tDonec quis pretium elit.";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Pellentesque egestas sapien a eleifend viverra. Vestibulum ultrices\n\t\t\ttellus sapien, bibendum suscipit nulla mattis vitae. Vivamus magna\n\t\t\tlacus, blandit vitae metus at, consequat dignissim velit. Proin\n\t\t\tpharetra mauris blandit, lacinia dui nec, tristique diam. Sed in\n\t\t\tmattis mi, in efficitur mi. Ut mollis aliquam ante, et porttitor est\n\t\t\tlaoreet ac. Maecenas pulvinar neque orci, et dictum erat aliquam ut.";
    			t8 = space();
    			div1 = element("div");
    			h11 = element("h1");
    			h11.textContent = "ABOUT";
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "Duis massa augue, imperdiet ut sem ac, cursus sagittis nulla. Donec\n\t\t\tquis scelerisque sapien. Suspendisse viverra tellus at lacus dapibus\n\t\t\tmattis. Morbi dignissim leo vulputate, condimentum quam non,\n\t\t\tscelerisque odio. Fusce interdum, velit et bibendum dictum, diam dui\n\t\t\tultrices orci, at bibendum orci lorem vitae lacus. Quisque ut lacus\n\t\t\tdignissim, hendrerit est vitae, faucibus risus. Mauris iaculis dolor\n\t\t\tut diam auctor, id dapibus dolor porttitor. Mauris pharetra, felis\n\t\t\tid interdum elementum, mi lorem ornare metus, quis porttitor ante\n\t\t\tlorem in turpis. Donec accumsan consequat sem, ut ullamcorper nunc.\n\t\t\tProin scelerisque purus ut turpis varius, id varius libero tempus.\n\t\t\tUt lacinia condimentum egestas. Curabitur congue iaculis fringilla.\n\t\t\tMauris lobortis non quam sit amet ultrices. Aliquam suscipit eget\n\t\t\tsem vitae malesuada.";
    			t12 = space();
    			p4 = element("p");
    			p4.textContent = "Maecenas non nisi metus. Curabitur a augue ultrices, efficitur lorem\n\t\t\tid, faucibus urna. Quisque a sapien massa. Duis nec libero sit amet\n\t\t\terat scelerisque ultrices. Donec hendrerit sed diam vitae viverra.\n\t\t\tPellentesque in finibus ipsum. In id enim non turpis molestie\n\t\t\tsuscipit eget vel nisi. Maecenas suscipit interdum risus in tempor.\n\t\t\tDonec a luctus purus, sed pharetra quam. Donec dui tortor, gravida\n\t\t\tquis erat et, molestie iaculis mi. Sed lectus nisi, finibus sit amet\n\t\t\tmollis at, condimentum id augue. Nunc non volutpat nisl, ut semper\n\t\t\tenim. Mauris in vehicula mi, ut aliquam purus. Curabitur nec dapibus\n\t\t\tfelis. Maecenas sagittis, erat eu auctor tincidunt, ligula elit\n\t\t\thendrerit lacus, quis dignissim nunc lorem quis erat. Etiam at neque\n\t\t\tvolutpat, sodales tellus in, malesuada magna.";
    			t14 = space();
    			div8 = element("div");
    			h12 = element("h1");
    			h12.textContent = "PRODUCTS";
    			t16 = space();
    			p5 = element("p");
    			p5.textContent = "Nam a nunc velit. Duis condimentum turpis eget elit volutpat varius.\n\t\t\tSed a aliquet ante. Sed luctus et lacus non tristique. Praesent\n\t\t\tmattis, purus non condimentum dapibus, dui arcu pharetra ex, ac\n\t\t\ttempus libero purus sit amet ipsum. Sed in ullamcorper lacus.\n\t\t\tVestibulum ultricies fringilla felis aliquam maximus. Aliquam eu\n\t\t\tdolor a mauris sagittis dapibus. Duis imperdiet cursus purus, at\n\t\t\tegestas justo mattis ornare. Vivamus egestas, felis quis vehicula\n\t\t\timperdiet, arcu lacus malesuada felis, in iaculis nunc mauris sit\n\t\t\tamet nibh. Etiam posuere est sed dolor auctor mattis. Nam semper,\n\t\t\turna ac fringilla pellentesque, arcu purus commodo justo, eu\n\t\t\tconsectetur lectus arcu sit amet ipsum.";
    			t18 = space();
    			div7 = element("div");
    			div2 = element("div");
    			t19 = space();
    			div3 = element("div");
    			t20 = space();
    			div4 = element("div");
    			t21 = space();
    			div5 = element("div");
    			t22 = space();
    			div6 = element("div");
    			t23 = space();
    			p6 = element("p");
    			p6.textContent = "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices\n\t\t\tposuere cubilia curae; Aenean vehicula mattis felis, a porttitor\n\t\t\tmauris aliquet sollicitudin. Morbi nisl ante, varius sed consectetur\n\t\t\tid, hendrerit porttitor dui. Duis non maximus dui. Proin libero\n\t\t\tmagna, convallis ut semper vitae, commodo eget mi. Donec sit amet\n\t\t\tlacus ac odio maximus consectetur eu eu ipsum. Vestibulum enim leo,\n\t\t\tcommodo ac commodo at, egestas in neque. Sed interdum venenatis eros\n\t\t\tvel commodo. Aenean nec varius arcu. Aenean turpis enim, consectetur\n\t\t\tvel interdum id, vulputate sit amet erat. Integer vitae diam in\n\t\t\tnulla malesuada luctus eget vitae leo. Donec non lorem nec mi\n\t\t\tfringilla lacinia. Suspendisse potenti. Ut euismod lobortis nulla in\n\t\t\tgravida. Etiam tincidunt massa tellus.";
    			t25 = space();
    			div9 = element("div");
    			h13 = element("h1");
    			h13.textContent = "CONTACT";
    			t27 = space();
    			p7 = element("p");
    			span0 = element("span");
    			b0 = element("b");
    			b0.textContent = "PHONE:";
    			t29 = text(" +90 538 284 8787");
    			t30 = space();
    			br = element("br");
    			t31 = space();
    			span1 = element("span");
    			b1 = element("b");
    			b1.textContent = "EMAIL:";
    			t33 = text(" berkin_akkaya@hotmail.com");
    			t34 = space();
    			p8 = element("p");
    			p8.textContent = "In blandit interdum leo, ac accumsan elit ornare vitae. Integer\n\t\t\tpellentesque vitae turpis non consectetur. Aliquam orci justo,\n\t\t\teuismod ut tempus id, faucibus vel libero. Aliquam commodo ex ornare\n\t\t\tnisi ornare molestie. Vestibulum convallis sapien id magna euismod\n\t\t\tmalesuada. Sed et commodo massa. Pellentesque habitant morbi\n\t\t\ttristique senectus et netus et malesuada fames ac turpis egestas.\n\t\t\tMauris bibendum elit vel commodo euismod. Donec sit amet massa id\n\t\t\tnisl egestas suscipit eget a elit. Nulla sagittis sapien quis ex\n\t\t\tfermentum blandit. Cras id lorem et enim venenatis pretium. Morbi at\n\t\t\tpellentesque felis.";
    			t36 = space();
    			p9 = element("p");
    			p9.textContent = "Nulla ut dui neque. Aliquam bibendum, est quis mattis hendrerit,\n\t\t\tneque nisl consectetur mi, et bibendum magna risus id tortor.\n\t\t\tPhasellus in dolor sit amet tortor venenatis pellentesque. Lorem\n\t\t\tipsum dolor sit amet, consectetur adipiscing elit. Morbi lacinia\n\t\t\tconsectetur tempus. Sed volutpat urna varius finibus porttitor.\n\t\t\tAenean tincidunt velit nec posuere congue. Phasellus posuere mollis\n\t\t\tlacinia. Morbi lacinia ex odio, sed consectetur tortor ultrices\n\t\t\teget. Nulla egestas ut metus gravida semper. Phasellus libero\n\t\t\tligula, porttitor sit amet eros ut, sollicitudin sagittis enim. Cras\n\t\t\tmaximus aliquet fringilla. Nunc iaculis massa vel odio accumsan, eu\n\t\t\taliquet diam eleifend.";
    			t38 = space();
    			footer = element("footer");
    			span2 = element("span");
    			span2.textContent = "Created by";
    			t40 = space();
    			a = element("a");
    			a.textContent = "Berkin AKKAYA";
    			attr_dev(h10, "class", "svelte-7zr6qr");
    			add_location(h10, file$1, 14, 2, 365);
    			attr_dev(p0, "class", "svelte-7zr6qr");
    			add_location(p0, file$1, 15, 2, 381);
    			attr_dev(p1, "class", "svelte-7zr6qr");
    			add_location(p1, file$1, 32, 2, 1406);
    			attr_dev(p2, "class", "svelte-7zr6qr");
    			add_location(p2, file$1, 44, 2, 2054);
    			attr_dev(div0, "class", "page svelte-7zr6qr");
    			toggle_class(div0, "show", /*page*/ ctx[0] === "home");
    			add_location(div0, file$1, 13, 1, 315);
    			attr_dev(h11, "class", "svelte-7zr6qr");
    			add_location(h11, file$1, 54, 2, 2545);
    			attr_dev(p3, "class", "svelte-7zr6qr");
    			add_location(p3, file$1, 55, 2, 2562);
    			attr_dev(p4, "class", "svelte-7zr6qr");
    			add_location(p4, file$1, 70, 2, 3441);
    			attr_dev(div1, "class", "page svelte-7zr6qr");
    			toggle_class(div1, "show", /*page*/ ctx[0] === "about");
    			add_location(div1, file$1, 53, 1, 2494);
    			attr_dev(h12, "class", "svelte-7zr6qr");
    			add_location(h12, file$1, 86, 2, 4336);
    			attr_dev(p5, "class", "svelte-7zr6qr");
    			add_location(p5, file$1, 87, 2, 4356);
    			attr_dev(div2, "class", "product svelte-7zr6qr");
    			add_location(div2, file$1, 101, 3, 5120);
    			attr_dev(div3, "class", "product svelte-7zr6qr");
    			add_location(div3, file$1, 102, 3, 5147);
    			attr_dev(div4, "class", "product svelte-7zr6qr");
    			add_location(div4, file$1, 103, 3, 5174);
    			attr_dev(div5, "class", "product svelte-7zr6qr");
    			add_location(div5, file$1, 104, 3, 5201);
    			attr_dev(div6, "class", "product svelte-7zr6qr");
    			add_location(div6, file$1, 105, 3, 5228);
    			attr_dev(div7, "class", "product-list svelte-7zr6qr");
    			add_location(div7, file$1, 100, 2, 5090);
    			attr_dev(p6, "class", "svelte-7zr6qr");
    			add_location(p6, file$1, 107, 2, 5263);
    			attr_dev(div8, "class", "page svelte-7zr6qr");
    			toggle_class(div8, "show", /*page*/ ctx[0] === "products");
    			add_location(div8, file$1, 85, 1, 4282);
    			attr_dev(h13, "class", "svelte-7zr6qr");
    			add_location(h13, file$1, 123, 2, 6141);
    			add_location(b0, file$1, 125, 9, 6216);
    			add_location(span0, file$1, 125, 3, 6210);
    			add_location(br, file$1, 126, 3, 6257);
    			add_location(b1, file$1, 127, 9, 6273);
    			add_location(span1, file$1, 127, 3, 6267);
    			set_style(p7, "padding-left", "20px");
    			set_style(p7, "text-indent", "0");
    			attr_dev(p7, "class", "svelte-7zr6qr");
    			add_location(p7, file$1, 124, 2, 6160);
    			attr_dev(p8, "class", "svelte-7zr6qr");
    			add_location(p8, file$1, 129, 2, 6329);
    			attr_dev(p9, "class", "svelte-7zr6qr");
    			add_location(p9, file$1, 141, 2, 6982);
    			attr_dev(div9, "class", "page svelte-7zr6qr");
    			toggle_class(div9, "show", /*page*/ ctx[0] === "contact");
    			add_location(div9, file$1, 122, 1, 6088);
    			attr_dev(div10, "id", "pages");
    			attr_dev(div10, "class", "svelte-7zr6qr");
    			add_location(div10, file$1, 12, 0, 297);
    			attr_dev(span2, "class", "svelte-7zr6qr");
    			add_location(span2, file$1, 159, 1, 7749);
    			attr_dev(a, "href", "https://berkinakkaya.github.io");
    			attr_dev(a, "class", "svelte-7zr6qr");
    			add_location(a, file$1, 160, 1, 7774);
    			attr_dev(footer, "class", "svelte-7zr6qr");
    			add_location(footer, file$1, 158, 0, 7739);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(div10, t8);
    			append_dev(div10, div1);
    			append_dev(div1, h11);
    			append_dev(div1, t10);
    			append_dev(div1, p3);
    			append_dev(div1, t12);
    			append_dev(div1, p4);
    			append_dev(div10, t14);
    			append_dev(div10, div8);
    			append_dev(div8, h12);
    			append_dev(div8, t16);
    			append_dev(div8, p5);
    			append_dev(div8, t18);
    			append_dev(div8, div7);
    			append_dev(div7, div2);
    			append_dev(div7, t19);
    			append_dev(div7, div3);
    			append_dev(div7, t20);
    			append_dev(div7, div4);
    			append_dev(div7, t21);
    			append_dev(div7, div5);
    			append_dev(div7, t22);
    			append_dev(div7, div6);
    			append_dev(div8, t23);
    			append_dev(div8, p6);
    			append_dev(div10, t25);
    			append_dev(div10, div9);
    			append_dev(div9, h13);
    			append_dev(div9, t27);
    			append_dev(div9, p7);
    			append_dev(p7, span0);
    			append_dev(span0, b0);
    			append_dev(span0, t29);
    			append_dev(p7, t30);
    			append_dev(p7, br);
    			append_dev(p7, t31);
    			append_dev(p7, span1);
    			append_dev(span1, b1);
    			append_dev(span1, t33);
    			append_dev(div9, t34);
    			append_dev(div9, p8);
    			append_dev(div9, t36);
    			append_dev(div9, p9);
    			insert_dev(target, t38, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, span2);
    			append_dev(footer, t40);
    			append_dev(footer, a);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};

    			if (!updating_page && dirty & /*page*/ 1) {
    				updating_page = true;
    				header_changes.page = /*page*/ ctx[0];
    				add_flush_callback(() => updating_page = false);
    			}

    			header.$set(header_changes);

    			if (dirty & /*page*/ 1) {
    				toggle_class(div0, "show", /*page*/ ctx[0] === "home");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(div1, "show", /*page*/ ctx[0] === "about");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(div8, "show", /*page*/ ctx[0] === "products");
    			}

    			if (dirty & /*page*/ 1) {
    				toggle_class(div9, "show", /*page*/ ctx[0] === "contact");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t38);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let page = "home";

    	// For example if the url is "xyz.com/#about",
    	// page variable will be "about"
    	if (location.href.includes("#")) {
    		page = location.href.split("#").slice(-1)[0];
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function header_page_binding(value) {
    		page = value;
    		$$invalidate(0, page);
    	}

    	$$self.$capture_state = () => ({ Header, page });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, header_page_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    new App({ target: document.body });

}());
//# sourceMappingURL=bundle.js.map
