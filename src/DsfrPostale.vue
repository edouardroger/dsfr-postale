<template>
    <div class="fr-input-group" ref="inputGroupRef">
        <label :for="inputId" class="fr-label">{{ label }}
            <span class="fr-hint-text" v-show="hint">{{ hint }}</span>
        </label>
        <input type="text" class="fr-input" role="combobox" :aria-expanded="suggestions.length > 0" :id="inputId"
            v-model="query" @input="onInput" @keydown="handleKeyDown" aria-autocomplete="list"
            aria-controls="suggestions" :aria-activedescendant="activeDescendant" autocomplete="off"
            :aria-describedby="errorMessageId" :required="required" />
        <p v-if="errorMessage" class="fr-error-text" :id="errorMessageId" role="alert">{{ errorMessage }}</p>
        <div class="fr-menu" v-show="suggestions.length > 0">
            <ul class="fr-menu__list" role="listbox" :id="suggestionsId" aria-label="Adresses postales suggérées">
                <li v-for="(suggestion, index) in suggestions" :key="index" :id="'suggestion-' + index" role="option"
                    class="fr-nav__link" :aria-selected="index === activeIndex" @click="selectAddress(index)">
                    {{ suggestion.properties.label }}
                </li>
            </ul>
        </div>
    </div>
</template>


<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, onBeforeUnmount, watch } from "vue";

// Interface pour les suggestions d'adresses
interface AddressFeature {
    properties: {
        label: string; // Adresse complète
        housenumber?: string; // Numéro de la voie (optionnel)
        street?: string; // Rue (optionnelle)
        postcode: string; // Code postal
        city: string; // Ville£
        citycode?: string; // Code INSEE de la ville (optionnel)
    };
    geometry: {
        coordinates: [number, number]; // Coordonnées géographiques
    };
}

// Interface pour l'adresse sélectionnée
interface SelectedAddress {
    label: string; // Adresse complète
    housenumber?: string; // Numéro de la voie (optionnel)
    street?: string; // Rue (optionnelle)
    postcode: string; // Code postal de la ville
    city: string; // Ville
    citycode?: string; // Code INSEE de la ville (optionnel)
    lat: number; // Latitude
    lng: number; // Longitude
}

export default defineComponent({
    name: "DsfrPostale",
    props: {
        label: {
            type: String as PropType<string>,
            default: "Votre adresse postale" // Valeur par défaut pour l'étiquette du champ
        },
        inputId: {
            type: String as PropType<string>,
            default: () => `input-${Math.random().toString(36).substr(2, 9)}`, // ID, généré aléatoirement par défaut
        },
        debounce: {
            type: Boolean,
            default: true // Debounce, activé par défaut
        },
        debounceDelay: {
            type: Number as PropType<number>,
            default: 300 // Délai de debounce en ms
        },
        hint: {
            type: String as PropType<string>, // Aide à la saisie
        },
        postcode: {
            type: String as PropType<string>,
            default: "", // Valeur par défaut pour le code postal
        },
        errorMessage: {
            type: String as PropType<string>,
            default: ""
        },
        required: {
            type: Boolean,
            default: false
        }
    },
    emits: ["addressSelected"], // Événement émis lors de la sélection d'une adresse
    setup(props, { emit }) {
        const query = ref<string>(""); // Stocke la requête utilisateur
        const suggestions = ref<AddressFeature[]>([]); // Stocke les suggestions d'adresses
        const activeIndex = ref<number>(-1); // Index de la suggestion actuellement sélectionnée
        const currentAddresses = ref<AddressFeature[]>([]); // Stocke les adresses actuellement disponibles
        let debounceTimer: number | null = null; // Timer local pour le debounce
        const inputGroupRef = ref<HTMLElement | null>(null); // Référence au conteneur
        const errorMessage = ref<string>(props.errorMessage); //  Message d'erreur

        // Calcule l'ID de la suggestion active pour l'accessibilité
        const activeDescendant = computed<string>(() => activeIndex.value >= 0 ? `suggestion-${activeIndex.value}` : "");
        const errorMessageId = computed(() => `error-message-${props.inputId}`); // L'ID du message d'erreur
        const suggestionsId = computed(() => `suggestions-${props.inputId}`); // Celui des suggestions

        watch(() => props.errorMessage, (newError) => {
            errorMessage.value = newError; // Si la prop errorMessage change, on met à jour sa valeur locale
        });

        // Vérifie si la requête est valide
        const isValidQuery = (q: string) => /\s[a-zA-Z]/.test(q);

        // Récupère les suggestions d'adresses depuis l'API
        const getAdresseSuggestions = async () => {
            // Vérifie si la requête est suffisamment longue et valide
            if (query.value.length < 3 || !isValidQuery(query.value)) {
                hideSuggestions();
                return;
            }

            try {
                // Nouvelle URL GeoPlateforme
                const url = `https://data.geopf.fr/geocodage/search/?q=${encodeURIComponent(query.value)}&limit=5`
                    + (props.postcode ? `&postcode=${encodeURIComponent(props.postcode)}` : "");
                const response = await fetch(url, {
                    headers: { 'accept': 'application/json' }
                });
                if (!response.ok) {
                    throw new Error("Erreur de récupération des suggestions.");
                }
                const data = await response.json();

                const features = (data.features || []).map((feature: any) => ({
                    properties: {
                        label: feature.properties.label,
                        housenumber: feature.properties.housenumber,
                        street: feature.properties.street,
                        postcode: feature.properties.postcode,
                        city: feature.properties.city,
                        citycode: feature.properties.citycode
                    },
                    geometry: { coordinates: feature.geometry.coordinates }
                }));

                suggestions.value = features;
                currentAddresses.value = features;
                activeIndex.value = -1;
                errorMessage.value = "";
            } catch (error) {
                errorMessage.value = "Erreur lors de l'obtention des adresses. Veuillez réessayer.";
                console.error("Erreur lors de l'obtention des adresses :", error);
            }
        };

        // Handler déclenché à chaque saisie : recourt à un appel immédiat ou à un debounce, selon la valeur de la prop éponyme
        const onInput = () => {
            if (!props.debounce) return getAdresseSuggestions();
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => getAdresseSuggestions(), props.debounceDelay) as unknown as number;
        };

        // Gère les événements de touches pour la navigation dans les suggestions
        const handleKeyDown = (event: KeyboardEvent) => {
            if (suggestions.value.length === 0) {
                if (event.key === "Escape") query.value = ""; // Si aucune suggestion, on vide le champ de saisie
                return; // Si aucune suggestion, on ne va pas plus loin
            }
            switch (event.key) {
                case "ArrowDown": // Sélectionne la suggestion suivante
                    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
                    break;
                case "ArrowUp": // Sélectionne la suggestion précédente
                    activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
                    break;
                case "Enter": // Sélectionne l'adresse active par la touche Entrer
                    if (activeIndex.value >= 0) selectAddress(activeIndex.value);
                    break;
                case "Escape": // Masque les suggestions
                case "Tab": // Masque les suggestions si la touche Tab est employée
                    hideSuggestions();
            }
        };

        // Sélectionne l'adresse en fonction de l'index
        const selectAddress = (index: number) => {
            const { properties, geometry } = currentAddresses.value[index]; // Récupère les propriétés et géométrie de l'adresse sélectionnée
            const selectedAddress: SelectedAddress = {
                label: properties.label,
                housenumber: properties.housenumber,
                street: properties.street,
                postcode: properties.postcode,
                city: properties.city,
                citycode: properties.citycode,
                lat: geometry.coordinates[1], // Latitude
                lng: geometry.coordinates[0], // Longitude
            };
            query.value = properties.label; // Met à jour la requête avec l'adresse sélectionnée
            suggestions.value = []; // Vide les suggestions
            emit("addressSelected", selectedAddress); // Émet l'adresse sélectionnée
        };

        // Masquer les suggestions et réinitialiser l'index actif
        const hideSuggestions = () => {
            suggestions.value = [];
            activeIndex.value = -1;
        };

        // Masquer les suggestions lorsque l'utilisateur clique en dehors
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (inputGroupRef.value && !inputGroupRef.value.contains(target)) hideSuggestions();
        };

        onMounted(() => document.addEventListener("click", handleClickOutside)); // Ajoute un écouteur d'événements lors du montage
        onBeforeUnmount(() => {
            // Supprime l'écouteur d'événements et nettoie le timer
            document.removeEventListener("click", handleClickOutside);
            if (debounceTimer) clearTimeout(debounceTimer);
        });

        return {
            query,
            suggestions,
            activeIndex,
            activeDescendant,
            onInput,
            handleKeyDown,
            selectAddress,
            hideSuggestions,
            inputGroupRef,
            errorMessage,
            errorMessageId,
            suggestionsId
        };
    },
});
</script>

<style scoped>
.fr-menu__list li[aria-selected="true"],
.fr-menu__list li:hover {
    background-color: var(--background-open-blue-france);
    outline: 2px solid var(--border-action-high-blue-france);
}

@media all {
    .fr-menu {
        filter: drop-shadow(var(--overlap-shadow));
    }

    .fr-menu__list {
        background-color: #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 18, .16);
    }

    .fr-menu .fr-nav__link {
        box-shadow: 0 calc(-1rem - 1px) 0 -1rem #ddd
    }
}
</style>
