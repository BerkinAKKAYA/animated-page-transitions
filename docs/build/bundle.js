
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

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
    			attr_dev(h1, "class", "svelte-s8gnqk");
    			add_location(h1, file, 8, 1, 148);
    			attr_dev(a0, "href", "#home");
    			attr_dev(a0, "class", "svelte-s8gnqk");
    			add_location(a0, file, 10, 2, 208);
    			attr_dev(a1, "href", "#about");
    			attr_dev(a1, "class", "svelte-s8gnqk");
    			add_location(a1, file, 11, 2, 268);
    			attr_dev(a2, "href", "#products");
    			attr_dev(a2, "class", "svelte-s8gnqk");
    			add_location(a2, file, 12, 2, 331);
    			attr_dev(a3, "href", "#contact");
    			attr_dev(a3, "class", "svelte-s8gnqk");
    			add_location(a3, file, 13, 2, 403);
    			attr_dev(nav, "class", "svelte-s8gnqk");
    			toggle_class(nav, "show", /*showNavMobile*/ ctx[1]);
    			add_location(nav, file, 9, 1, 173);
    			if (img.src !== (img_src_value = "img/hamburger.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "MENU");
    			attr_dev(img, "id", "hamburger");
    			attr_dev(img, "class", "svelte-s8gnqk");
    			add_location(img, file, 15, 1, 479);
    			attr_dev(header, "class", "svelte-s8gnqk");
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

    	const click_handler = () => $$invalidate(0, page = "home");
    	const click_handler_1 = () => $$invalidate(0, page = "about");
    	const click_handler_2 = () => $$invalidate(0, page = "products");
    	const click_handler_3 = () => $$invalidate(0, page = "contact");

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

    const { console: console_1 } = globals;
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let updating_page;
    	let t0;
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
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "HOME";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque\n\t\tnec tortor sit amet est finibus tincidunt. Cras non ornare justo.\n\t\tCurabitur suscipit sodales libero, aliquet accumsan lorem mollis sed.\n\t\tVestibulum sed nulla at ex pulvinar ornare et nec libero. Nullam eu\n\t\taugue in nisl faucibus lacinia. Maecenas ac ornare nunc, facilisis\n\t\tmattis mi. Nullam non feugiat orci, quis rutrum neque. Pellentesque\n\t\thabitant morbi tristique senectus et netus et malesuada fames ac turpis\n\t\tegestas. Donec ornare ultrices elit, sit amet iaculis turpis tempus in.\n\t\tDonec viverra risus eget sapien faucibus volutpat. Curabitur feugiat\n\t\tvenenatis elit, ac luctus nunc convallis sit amet. Donec rhoncus posuere\n\t\tdiam, id posuere justo tincidunt sed. Aliquam quis eros posuere turpis\n\t\tconsectetur vehicula. Nullam non velit odio. Quisque scelerisque erat\n\t\tfacilisis viverra consequat. Aliquam ultricies, justo ac interdum\n\t\tlobortis, elit velit mattis ante, non placerat est nulla eu est.";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Sed eleifend eleifend risus, quis sagittis est egestas id. Suspendisse\n\t\tpotenti. Maecenas neque turpis, sagittis ullamcorper magna a, molestie\n\t\teuismod lacus. Mauris eu lacus sit amet justo tristique porta. Nunc non\n\t\tlaoreet leo. Donec eu sagittis eros. Aenean laoreet porttitor mi a\n\t\tpellentesque. Vestibulum dapibus dapibus auctor. Curabitur bibendum vel\n\t\tmi non convallis. Vivamus laoreet posuere justo eget viverra. Donec nec\n\t\turna at odio convallis semper non et ex. Curabitur rhoncus, nisi sit\n\t\tamet gravida iaculis, augue tellus facilisis ligula, vitae iaculis metus\n\t\tdui in orci. Donec quis pretium elit.";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Pellentesque egestas sapien a eleifend viverra. Vestibulum ultrices\n\t\ttellus sapien, bibendum suscipit nulla mattis vitae. Vivamus magna\n\t\tlacus, blandit vitae metus at, consequat dignissim velit. Proin pharetra\n\t\tmauris blandit, lacinia dui nec, tristique diam. Sed in mattis mi, in\n\t\tefficitur mi. Ut mollis aliquam ante, et porttitor est laoreet ac.\n\t\tMaecenas pulvinar neque orci, et dictum erat aliquam ut.";
    			t8 = space();
    			div1 = element("div");
    			h11 = element("h1");
    			h11.textContent = "ABOUT";
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "Duis massa augue, imperdiet ut sem ac, cursus sagittis nulla. Donec quis\n\t\tscelerisque sapien. Suspendisse viverra tellus at lacus dapibus mattis.\n\t\tMorbi dignissim leo vulputate, condimentum quam non, scelerisque odio.\n\t\tFusce interdum, velit et bibendum dictum, diam dui ultrices orci, at\n\t\tbibendum orci lorem vitae lacus. Quisque ut lacus dignissim, hendrerit\n\t\test vitae, faucibus risus. Mauris iaculis dolor ut diam auctor, id\n\t\tdapibus dolor porttitor. Mauris pharetra, felis id interdum elementum,\n\t\tmi lorem ornare metus, quis porttitor ante lorem in turpis. Donec\n\t\taccumsan consequat sem, ut ullamcorper nunc. Proin scelerisque purus ut\n\t\tturpis varius, id varius libero tempus. Ut lacinia condimentum egestas.\n\t\tCurabitur congue iaculis fringilla. Mauris lobortis non quam sit amet\n\t\tultrices. Aliquam suscipit eget sem vitae malesuada.";
    			t12 = space();
    			p4 = element("p");
    			p4.textContent = "Maecenas non nisi metus. Curabitur a augue ultrices, efficitur lorem id,\n\t\tfaucibus urna. Quisque a sapien massa. Duis nec libero sit amet erat\n\t\tscelerisque ultrices. Donec hendrerit sed diam vitae viverra.\n\t\tPellentesque in finibus ipsum. In id enim non turpis molestie suscipit\n\t\teget vel nisi. Maecenas suscipit interdum risus in tempor. Donec a\n\t\tluctus purus, sed pharetra quam. Donec dui tortor, gravida quis erat et,\n\t\tmolestie iaculis mi. Sed lectus nisi, finibus sit amet mollis at,\n\t\tcondimentum id augue. Nunc non volutpat nisl, ut semper enim. Mauris in\n\t\tvehicula mi, ut aliquam purus. Curabitur nec dapibus felis. Maecenas\n\t\tsagittis, erat eu auctor tincidunt, ligula elit hendrerit lacus, quis\n\t\tdignissim nunc lorem quis erat. Etiam at neque volutpat, sodales tellus\n\t\tin, malesuada magna.";
    			t14 = space();
    			div8 = element("div");
    			h12 = element("h1");
    			h12.textContent = "PRODUCTS";
    			t16 = space();
    			p5 = element("p");
    			p5.textContent = "Nam a nunc velit. Duis condimentum turpis eget elit volutpat varius. Sed\n\t\ta aliquet ante. Sed luctus et lacus non tristique. Praesent mattis,\n\t\tpurus non condimentum dapibus, dui arcu pharetra ex, ac tempus libero\n\t\tpurus sit amet ipsum. Sed in ullamcorper lacus. Vestibulum ultricies\n\t\tfringilla felis aliquam maximus. Aliquam eu dolor a mauris sagittis\n\t\tdapibus. Duis imperdiet cursus purus, at egestas justo mattis ornare.\n\t\tVivamus egestas, felis quis vehicula imperdiet, arcu lacus malesuada\n\t\tfelis, in iaculis nunc mauris sit amet nibh. Etiam posuere est sed dolor\n\t\tauctor mattis. Nam semper, urna ac fringilla pellentesque, arcu purus\n\t\tcommodo justo, eu consectetur lectus arcu sit amet ipsum.";
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
    			p6.textContent = "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere\n\t\tcubilia curae; Aenean vehicula mattis felis, a porttitor mauris aliquet\n\t\tsollicitudin. Morbi nisl ante, varius sed consectetur id, hendrerit\n\t\tporttitor dui. Duis non maximus dui. Proin libero magna, convallis ut\n\t\tsemper vitae, commodo eget mi. Donec sit amet lacus ac odio maximus\n\t\tconsectetur eu eu ipsum. Vestibulum enim leo, commodo ac commodo at,\n\t\tegestas in neque. Sed interdum venenatis eros vel commodo. Aenean nec\n\t\tvarius arcu. Aenean turpis enim, consectetur vel interdum id, vulputate\n\t\tsit amet erat. Integer vitae diam in nulla malesuada luctus eget vitae\n\t\tleo. Donec non lorem nec mi fringilla lacinia. Suspendisse potenti. Ut\n\t\teuismod lobortis nulla in gravida. Etiam tincidunt massa tellus.";
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
    			p8.textContent = "In blandit interdum leo, ac accumsan elit ornare vitae. Integer\n\t\tpellentesque vitae turpis non consectetur. Aliquam orci justo, euismod\n\t\tut tempus id, faucibus vel libero. Aliquam commodo ex ornare nisi ornare\n\t\tmolestie. Vestibulum convallis sapien id magna euismod malesuada. Sed et\n\t\tcommodo massa. Pellentesque habitant morbi tristique senectus et netus\n\t\tet malesuada fames ac turpis egestas. Mauris bibendum elit vel commodo\n\t\teuismod. Donec sit amet massa id nisl egestas suscipit eget a elit.\n\t\tNulla sagittis sapien quis ex fermentum blandit. Cras id lorem et enim\n\t\tvenenatis pretium. Morbi at pellentesque felis.";
    			t36 = space();
    			p9 = element("p");
    			p9.textContent = "Nulla ut dui neque. Aliquam bibendum, est quis mattis hendrerit, neque\n\t\tnisl consectetur mi, et bibendum magna risus id tortor. Phasellus in\n\t\tdolor sit amet tortor venenatis pellentesque. Lorem ipsum dolor sit\n\t\tamet, consectetur adipiscing elit. Morbi lacinia consectetur tempus. Sed\n\t\tvolutpat urna varius finibus porttitor. Aenean tincidunt velit nec\n\t\tposuere congue. Phasellus posuere mollis lacinia. Morbi lacinia ex odio,\n\t\tsed consectetur tortor ultrices eget. Nulla egestas ut metus gravida\n\t\tsemper. Phasellus libero ligula, porttitor sit amet eros ut,\n\t\tsollicitudin sagittis enim. Cras maximus aliquet fringilla. Nunc iaculis\n\t\tmassa vel odio accumsan, eu aliquet diam eleifend.";
    			t38 = space();
    			footer = element("footer");
    			span2 = element("span");
    			span2.textContent = "Created by";
    			t40 = space();
    			a = element("a");
    			a.textContent = "Berkin AKKAYA";
    			attr_dev(h10, "class", "svelte-1jkpz0j");
    			add_location(h10, file$1, 12, 1, 285);
    			attr_dev(p0, "class", "svelte-1jkpz0j");
    			add_location(p0, file$1, 13, 1, 300);
    			attr_dev(p1, "class", "svelte-1jkpz0j");
    			add_location(p1, file$1, 29, 1, 1306);
    			attr_dev(p2, "class", "svelte-1jkpz0j");
    			add_location(p2, file$1, 40, 1, 1940);
    			attr_dev(div0, "class", "page svelte-1jkpz0j");
    			toggle_class(div0, "show", /*page*/ ctx[0] === "home");
    			add_location(div0, file$1, 11, 0, 236);
    			attr_dev(h11, "class", "svelte-1jkpz0j");
    			add_location(h11, file$1, 50, 1, 2421);
    			attr_dev(p3, "class", "svelte-1jkpz0j");
    			add_location(p3, file$1, 51, 1, 2437);
    			attr_dev(p4, "class", "svelte-1jkpz0j");
    			add_location(p4, file$1, 65, 1, 3299);
    			attr_dev(div1, "class", "page svelte-1jkpz0j");
    			toggle_class(div1, "show", /*page*/ ctx[0] === "about");
    			add_location(div1, file$1, 49, 0, 2371);
    			attr_dev(h12, "class", "svelte-1jkpz0j");
    			add_location(h12, file$1, 81, 1, 4178);
    			attr_dev(p5, "class", "svelte-1jkpz0j");
    			add_location(p5, file$1, 82, 1, 4197);
    			attr_dev(div2, "class", "product svelte-1jkpz0j");
    			add_location(div2, file$1, 95, 2, 4945);
    			attr_dev(div3, "class", "product svelte-1jkpz0j");
    			add_location(div3, file$1, 96, 2, 4971);
    			attr_dev(div4, "class", "product svelte-1jkpz0j");
    			add_location(div4, file$1, 97, 2, 4997);
    			attr_dev(div5, "class", "product svelte-1jkpz0j");
    			add_location(div5, file$1, 98, 2, 5023);
    			attr_dev(div6, "class", "product svelte-1jkpz0j");
    			add_location(div6, file$1, 99, 2, 5049);
    			attr_dev(div7, "class", "product-list svelte-1jkpz0j");
    			add_location(div7, file$1, 94, 1, 4916);
    			attr_dev(p6, "class", "svelte-1jkpz0j");
    			add_location(p6, file$1, 101, 1, 5082);
    			attr_dev(div8, "class", "page svelte-1jkpz0j");
    			toggle_class(div8, "show", /*page*/ ctx[0] === "products");
    			add_location(div8, file$1, 80, 0, 4125);
    			attr_dev(h13, "class", "svelte-1jkpz0j");
    			add_location(h13, file$1, 116, 1, 5942);
    			add_location(b0, file$1, 118, 8, 6015);
    			add_location(span0, file$1, 118, 2, 6009);
    			add_location(br, file$1, 119, 2, 6055);
    			add_location(b1, file$1, 120, 8, 6070);
    			add_location(span1, file$1, 120, 2, 6064);
    			set_style(p7, "padding-left", "20px");
    			set_style(p7, "text-indent", "0");
    			attr_dev(p7, "class", "svelte-1jkpz0j");
    			add_location(p7, file$1, 117, 1, 5960);
    			attr_dev(p8, "class", "svelte-1jkpz0j");
    			add_location(p8, file$1, 122, 1, 6124);
    			attr_dev(p9, "class", "svelte-1jkpz0j");
    			add_location(p9, file$1, 133, 1, 6763);
    			attr_dev(div9, "class", "page svelte-1jkpz0j");
    			toggle_class(div9, "show", /*page*/ ctx[0] === "contact");
    			add_location(div9, file$1, 115, 0, 5890);
    			attr_dev(span2, "class", "svelte-1jkpz0j");
    			add_location(span2, file$1, 149, 1, 7508);
    			attr_dev(a, "href", "https://berkinakkaya.github.io");
    			attr_dev(a, "class", "svelte-1jkpz0j");
    			add_location(a, file$1, 150, 1, 7533);
    			attr_dev(footer, "class", "svelte-1jkpz0j");
    			add_location(footer, file$1, 148, 0, 7498);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h10);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h11);
    			append_dev(div1, t10);
    			append_dev(div1, p3);
    			append_dev(div1, t12);
    			append_dev(div1, p4);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div8, anchor);
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
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div9, anchor);
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
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div9);
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

    	if (location.href.includes("#")) {
    		page = location.href.split("#").slice(-1)[0];
    	}

    	console.log(page);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
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
