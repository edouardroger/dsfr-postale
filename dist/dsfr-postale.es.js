import { defineComponent as D, ref as d, computed as _, openBlock as c, createElementBlock as g, createElementVNode as p, toDisplayString as y, withDirectives as m, vModelText as k, Fragment as S, renderList as E, vShow as I } from "vue";
const $ = D({
  name: "DsfrPostale",
  props: {
    label: {
      type: String,
      required: !0
    },
    inputId: {
      type: String,
      required: !0
    }
  },
  emits: ["addressSelected"],
  setup(e, { emit: a }) {
    const l = d(""), o = d([]), s = d(-1), i = d([]), n = d(null), u = _(() => s.value >= 0 ? `suggestion-${s.value}` : ""), v = (t) => /\s[a-zA-Z]/.test(t), b = async () => {
      if (l.value.length < 3 || !v(l.value)) {
        o.value = [], s.value = -1;
        return;
      }
      try {
        const r = await (await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            l.value
          )}`
        )).json();
        o.value = r.features, i.value = r.features, s.value = -1;
      } catch (t) {
        console.error("Erreur lors de la r\xE9cup\xE9ration des suggestions :", t);
      }
    }, h = () => {
      n.value && clearTimeout(n.value), n.value = setTimeout(() => {
        b();
      }, 300);
    }, A = (t) => {
      o.value.length !== 0 && (t.key === "ArrowDown" ? s.value = (s.value + 1) % o.value.length : t.key === "ArrowUp" ? s.value = (s.value - 1 + o.value.length) % o.value.length : t.key === "Enter" && s.value >= 0 ? f(s.value) : t.key === "Escape" && (o.value = [], s.value = -1));
    }, f = (t) => {
      const r = i.value[t].properties, w = {
        label: r.label,
        housenumber: r.housenumber,
        street: r.street,
        postcode: r.postcode,
        city: r.city,
        citycode: r.citycode,
        lat: i.value[t].geometry.coordinates[1],
        lng: i.value[t].geometry.coordinates[0]
      };
      l.value = r.label, o.value = [], a("addressSelected", w);
    };
    return {
      query: l,
      suggestions: o,
      activeIndex: s,
      activeDescendant: u,
      debounceGetAdresseSuggestions: h,
      handleKeyDown: A,
      selectAddress: f
    };
  }
});
const q = (e, a) => {
  const l = e.__vccOpts || e;
  for (const [o, s] of a)
    l[o] = s;
  return l;
}, C = ["for"], K = ["aria-expanded", "id", "aria-activedescendant"], T = {
  role: "listbox",
  id: "suggestions",
  "aria-label": "Adresses postales sugg\xE9r\xE9es",
  class: "fr-hidden fr-menu__list"
}, G = ["id", "aria-selected", "onClick"];
function P(e, a, l, o, s, i) {
  return c(), g("div", null, [
    p("label", {
      for: e.inputId,
      class: "fr-label"
    }, y(e.label), 9, C),
    m(p("input", {
      type: "text",
      class: "fr-input",
      role: "combobox",
      "aria-expanded": e.suggestions.length > 0,
      id: e.inputId,
      "onUpdate:modelValue": a[0] || (a[0] = (n) => e.query = n),
      onInput: a[1] || (a[1] = (...n) => e.debounceGetAdresseSuggestions && e.debounceGetAdresseSuggestions(...n)),
      onKeydown: a[2] || (a[2] = (...n) => e.handleKeyDown && e.handleKeyDown(...n)),
      "aria-autocomplete": "list",
      "aria-controls": "suggestions",
      "aria-activedescendant": e.activeDescendant,
      autocomplete: "off"
    }, null, 40, K), [
      [k, e.query]
    ]),
    m(p("ul", T, [
      (c(!0), g(S, null, E(e.suggestions, (n, u) => (c(), g("li", {
        key: u,
        id: "suggestion-" + u,
        role: "option",
        "aria-selected": u === e.activeIndex,
        onClick: (v) => e.selectAddress(u)
      }, y(n.properties.label), 9, G))), 128))
    ], 512), [
      [I, e.suggestions.length > 0]
    ])
  ]);
}
const V = /* @__PURE__ */ q($, [["render", P], ["__scopeId", "data-v-97878216"]]);
export {
  V as default
};
