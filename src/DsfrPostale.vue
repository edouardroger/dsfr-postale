<template>
    <div class="fr-input-group" ref="inputGroupRef">
        <label :for="inputId" class="fr-label">{{ label }}
            <span class="fr-hint-text" v-show="hint">{{ hint }}</span>
        </label>
        <input type="text" class="fr-input" role="combobox" :aria-expanded="suggestions.length > 0" :id="inputId"
            v-model="query" @input="debounceGetAdresseSuggestions" @keydown="handleKeyDown" aria-autocomplete="list"
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
        const debounceTimeout = ref<number | null>(null); // Timeout pour le debounce
        const inputGroupRef = ref<HTMLElement | null>(null); // Référence au conteneur
        const errorMessage = ref<string>(props.errorMessage); //  Message d'erreur

        // Calcule l'ID de la suggestion active pour l'accessibilité
        const activeDescendant = computed<string>(() => {
            return activeIndex.value >= 0 ? `suggestion-${activeIndex.value}` : "";
        });

        watch(() => props.errorMessage, (newError) => {
            errorMessage.value = newError; // Si la prop errorMessage change, on met à jour sa valeur locale
        });

        // L'ID du message d'erreur
        const errorMessageId = computed(() => `error-message-${props.inputId}`);

        // Celui des suggestions
        const suggestionsId = computed(() => `suggestions-${props.inputId}`);

        // Vérifie si la requête est valide
        const isValidQuery = (query: string): boolean => {
            const regex = /\s[a-zA-Z]/;
            return regex.test(query);
        };

        // Récupère les suggestions d'adresses depuis l'API
        const getAdresseSuggestions = async () => {
            // Vérifie si la requête est suffisamment longue et valide
            if (query.value.length < 3 || !isValidQuery(query.value)) {
                hideSuggestions();
                return;
            }

            try {
                // Construire l'URL avec la requête et le code postal (si fourni)
                const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query.value)}` +
                    (props.postcode ? `&postcode=${encodeURIComponent(props.postcode)}` : "");
                const response = await fetch(url); // Appelle l'API
                if (!response.ok) {
                    throw new Error("Erreur de récupération des suggestions.");
                }
                const data = await response.json(); // Convertit la réponse en JSON
                suggestions.value = data.features; // Stocke les suggestions
                currentAddresses.value = data.features; // Stocke les adresses actuelles
                activeIndex.value = -1; // Réinitialise l'index actif
                errorMessage.value = ""; // Supprime le message d'erreur
            } catch (error) {
                errorMessage.value = "Erreur lors de l'obtention des adresses. Veuillez réessayer."; // Affiche un message d'erreur
                console.error("Erreur lors de l'obtention des adresses :", error);
            }
        };

        // Fonction pour retarder l'appel à l'API
        const debounceGetAdresseSuggestions = () => {
            if (debounceTimeout.value) {
                clearTimeout(debounceTimeout.value); // Efface le précédent timeout
            }

            // Met en place un nouveau timeout
            debounceTimeout.value = window.setTimeout(() => {
                getAdresseSuggestions(); // Appelle la fonction de suggestions après un délai
            }, 300); // Délai de 300 ms
        };

        // Gère les événements de touches pour la navigation dans les suggestions
        const handleKeyDown = (event: KeyboardEvent) => {
            if (suggestions.value.length === 0) return; // Si aucune suggestion…

            if (event.key === "ArrowDown") {
                // Sélectionne la suggestion suivante
                activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
            } else if (event.key === "ArrowUp") {
                // Sélectionne la suggestion précédente
                activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
            } else if (event.key === "Enter" && activeIndex.value >= 0) {
                // Sélectionne l'adresse active par la touche Entrer
                selectAddress(activeIndex.value);
            } else if (event.key === "Escape" || event.key === "Tab") {
                // Réinitialise les suggestions si la touche Échap (ou Tab) est employée
                hideSuggestions();
            }
        };

        // Sélectionne l'adresse en fonction de l'index
        const selectAddress = (index: number) => {
            const selected = currentAddresses.value[index].properties; // Récupère les propriétés de l'adresse sélectionnée
            const selectedAddress: SelectedAddress = {
                label: selected.label,
                housenumber: selected.housenumber,
                street: selected.street,
                postcode: selected.postcode,
                city: selected.city,
                citycode: selected.citycode,
                lat: currentAddresses.value[index].geometry.coordinates[1], // Latitude
                lng: currentAddresses.value[index].geometry.coordinates[0], // Longitude
            };
            query.value = selected.label; // Met à jour la requête avec l'adresse sélectionnée
            suggestions.value = []; // Vide les suggestions

            emit("addressSelected", selectedAddress); // Émet l'adresse sélectionnée
        };

        // Fonction pour masquer les suggestions
        const hideSuggestions = () => {
            suggestions.value = []; // Masquer les suggestions
            activeIndex.value = -1; // Réinitialiser l'index actif
        };

        // Fonction pour masquer les suggestions lorsque l'utilisateur clique en dehors
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (inputGroupRef.value && !inputGroupRef.value.contains(target)) {
                hideSuggestions();
            }
        };

        // Ajoute un écouteur d'événements lors du montage du composant
        onMounted(() => {
            document.addEventListener("click", handleClickOutside);
        });

        // Supprime l'écouteur d'événements lors de son démontage
        onBeforeUnmount(() => {
            document.removeEventListener("click", handleClickOutside);
        });

        return {
            query,
            suggestions,
            activeIndex,
            activeDescendant,
            debounceGetAdresseSuggestions,
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
