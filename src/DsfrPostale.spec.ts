import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import DsfrPostale from "./DsfrPostale.vue";

describe("DsfrPostale", () => {
  it("émet l'événement 'addressSelected' avec l'adresse correcte", async () => {
    const wrapper = mount(DsfrPostale, {
      data() {
        return {
          // Initialement, pas de suggestions
          suggestions: [],
        };
      },
      attachTo: document.body, // Pour s'assurer qu'il est monté dans le document
    });

    const input = wrapper.find("input");

    // Simuler la saisie de texte dans le champ de saisie
    await input.setValue("10 Rue de Poitiers");

    // Mettre à jour les suggestions après la saisie (en simulant la réponse de l'API)
    await wrapper.setData({
      suggestions: [
        { housenumber: "10", street: "Rue de Poitiers", citycode: "49400" },
        { housenumber: "15", street: "Rue de Lyon", citycode: "75002" },
      ],
    });

    // Attendre que Vue ait terminé de mettre à jour le DOM
    await wrapper.vm.$nextTick();

    // Attendre un peu plus longtemps pour s'assurer que l'élément est visible
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Petite pause pour laisser le temps au DOM de se mettre à jour

    // Vérifier que le menu des suggestions est visible
    const suggestionMenu = wrapper.find(".fr-menu__list");
    const style = getComputedStyle(suggestionMenu.element);

    // Vérifier que l'élément n'est pas masqué avec display: none
    expect(style.display).not.toBe("none");

    // Vérifier qu'il y a au moins une suggestion dans le menu
    const listItems = suggestionMenu.findAll("li");
    expect(listItems.length).toBeGreaterThan(0); // Vérifie qu'il y a au moins une suggestion

    // Vérifier que le texte dans le premier élément de la liste correspond à l'adresse simulée
    const firstSuggestion = listItems.at(0);

    // Vérifier si firstSuggestion existe avant de l'utiliser
    expect(firstSuggestion).toBeDefined(); // Assurez-vous que la suggestion existe

    if (firstSuggestion) {
      expect(firstSuggestion.text()).toContain("10 Rue de Poitiers 49400 Saumur");

      // Simuler la sélection de l'adresse
      await firstSuggestion.trigger("click");

      // Vérifier que l'événement 'addressSelected' a bien été émis
      const emittedEvents = wrapper.emitted("addressSelected");

      // Assurer que l'événement a bien été émis
      expect(emittedEvents).toBeTruthy(); // Vérifie que 'emittedEvents' existe
      expect(emittedEvents?.length).toBeGreaterThan(0); // Vérifie qu'il y a des événements émis

      // Vérifier le contenu de l'événement
      if (emittedEvents && emittedEvents.length > 0) {
        console.log(emittedEvents[0][0]); // Afficher l'événement pour débogage

        expect(emittedEvents[0][0]).toEqual({
          city: "Saumur",
          citycode: "49328", // Assurez-vous que c'est le bon code INSEE
          housenumber: "10",
          label: "10 Rue de Poitiers 49400 Saumur",
          lat: 47.253416,
          lng: -0.079306,
          postcode: "49400",
          street: "Rue de Poitiers",
        });
      } else {
        throw new Error("L'événement 'addressSelected' n'a pas été émis.");
      }
    }
  });
});
