import { defineComponent as w, ref as d, computed as D, openBlock as c, createElementBlock as p, createElementVNode as g, toDisplayString as y, withDirectives as m, vModelText as k, Fragment as A, renderList as S, vShow as _ } from "vue";
const I = w({
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
  setup(e, { emit: n }) {
    const l = d(""), o = d([]), s = d(-1), i = d([]), a = D(() => s.value >= 0 ? `suggestion-${s.value}` : ""), u = (t) => /\s[a-zA-Z]/.test(t), v = async () => {
      if (!u(l.value)) {
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
        console.error("Erreur lors de la r\xE9cup\xE9ration des suggestions:", t);
      }
    }, h = (t) => {
      o.value.length !== 0 && (t.key === "ArrowDown" ? s.value = (s.value + 1) % o.value.length : t.key === "ArrowUp" ? s.value = (s.value - 1 + o.value.length) % o.value.length : t.key === "Enter" && s.value >= 0 ? f(s.value) : t.key === "Escape" && (o.value = [], s.value = -1));
    }, f = (t) => {
      const r = i.value[t].properties, b = {
        label: r.label,
        housenumber: r.housenumber,
        street: r.street,
        postcode: r.postcode,
        city: r.city,
        citycode: r.citycode,
        lat: i.value[t].geometry.coordinates[1],
        lng: i.value[t].geometry.coordinates[0]
      };
      l.value = r.label, o.value = [], n("addressSelected", b);
    };
    return {
      query: l,
      suggestions: o,
      activeIndex: s,
      activeDescendant: a,
      getAdresseSuggestions: v,
      handleKeyDown: h,
      selectAddress: f
    };
  }
});
const E = (e, n) => {
  const l = e.__vccOpts || e;
  for (const [o, s] of n)
    l[o] = s;
  return l;
}, $ = ["for"], q = ["aria-expanded", "id", "aria-activedescendant"], C = {
  role: "listbox",
  id: "suggestions",
  class: "suggestions"
}, K = ["id", "aria-selected", "onClick"];
function P(e, n, l, o, s, i) {
  return c(), p("div", null, [
    g("label", {
      for: e.inputId,
      class: "fr-label"
    }, y(e.label), 9, $),
    m(g("input", {
      type: "text",
      class: "fr-input",
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-owns": "suggestions",
      "aria-expanded": e.suggestions.length > 0,
      id: e.inputId,
      "onUpdate:modelValue": n[0] || (n[0] = (a) => e.query = a),
      onInput: n[1] || (n[1] = (...a) => e.getAdresseSuggestions && e.getAdresseSuggestions(...a)),
      onKeydown: n[2] || (n[2] = (...a) => e.handleKeyDown && e.handleKeyDown(...a)),
      "aria-autocomplete": "list",
      "aria-controls": "suggestions",
      "aria-activedescendant": e.activeDescendant,
      autocomplete: "off"
    }, null, 40, q), [
      [k, e.query]
    ]),
    m(g("ul", C, [
      (c(!0), p(A, null, S(e.suggestions, (a, u) => (c(), p("li", {
        key: u,
        id: "suggestion-" + u,
        role: "option",
        "aria-selected": u === e.activeIndex,
        onClick: (v) => e.selectAddress(u)
      }, y(a.properties.label), 9, K))), 128))
    ], 512), [
      [_, e.suggestions.length > 0]
    ])
  ]);
}
const V = /* @__PURE__ */ E(I, [["render", P], ["__scopeId", "data-v-1d8680dd"]]);
export {
  V as default
};
