<template>
    <div>
        <label :for="inputId" class="fr-label">{{ label }}</label>
        <input type="text" class="fr-input" role="combobox" :aria-expanded="suggestions.length > 0" :id="inputId"
            v-model="query" @input="debounceGetAdresseSuggestions" @keydown="handleKeyDown" aria-autocomplete="list"
            aria-controls="suggestions" :aria-activedescendant="activeDescendant" autocomplete="off" />
        <div class="fr-collapse fr-menu fr-menu__combobox" :class="{ 'fr-collapse--expanded': suggestions.length > 0 }">
            <ul role="listbox" v-show="suggestions.length > 0" id="suggestions" aria-label="Adresses postales suggérées"
                class="fr-menu__list">
                <li v-for="(suggestion, index) in suggestions" :key="index" :id="'suggestion-' + index" role="option"
                    class="fr-nav__link" :aria-selected="index === activeIndex" @click="selectAddress(index)">
                    {{ suggestion.properties.label }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";

interface AddressFeature {
    properties: {
        label: string;
        housenumber?: string;
        street?: string;
        postcode: string;
        city: string;
        citycode?: string;
    };
    geometry: {
        coordinates: [number, number];
    };
}

interface SelectedAddress {
    label: string;
    housenumber?: string;
    street?: string;
    postcode: string;
    city: string;
    citycode?: string;
    lat: number;
    lng: number;
}

export default defineComponent({
    name: "DsfrPostale",
    props: {
        label: {
            type: String as PropType<string>,
            required: true,
        },
        inputId: {
            type: String as PropType<string>,
            required: true,
        }
    },
    emits: ["addressSelected"],
    setup(_, { emit }) {
        const query = ref<string>("");
        const suggestions = ref<AddressFeature[]>([]);
        const activeIndex = ref<number>(-1);
        const currentAddresses = ref<AddressFeature[]>([]);
        const debounceTimeout = ref<number | null>(null); // Timeout pour le debounce

        const activeDescendant = computed<string>(() => {
            return activeIndex.value >= 0 ? `suggestion-${activeIndex.value}` : "";
        });

        const isValidQuery = (query: string): boolean => {
            const regex = /\s[a-zA-Z]/;
            return regex.test(query);
        };

        const getAdresseSuggestions = async () => {
            if (query.value.length < 3 || !isValidQuery(query.value)) {
                suggestions.value = [];
                activeIndex.value = -1;
                return;
            }

            try {
                const response = await fetch(
                    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
                        query.value
                    )}`
                );
                const data = await response.json();
                suggestions.value = data.features;
                currentAddresses.value = data.features;
                activeIndex.value = -1;
            } catch (error) {
                console.error("Erreur lors de la récupération des suggestions :", error);
            }
        };

        // Fonction de debounce pour retarder l'appel à l'API
        const debounceGetAdresseSuggestions = () => {
            if (debounceTimeout.value) {
                clearTimeout(debounceTimeout.value); // Efface le précédent timeout
            }

            debounceTimeout.value = setTimeout(() => {
                getAdresseSuggestions();
            }, 300); // Délai de 300 ms avant de faire l'appel à l'API
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (suggestions.value.length === 0) return;

            if (event.key === "ArrowDown") {
                activeIndex.value =
                    (activeIndex.value + 1) % suggestions.value.length;
            } else if (event.key === "ArrowUp") {
                activeIndex.value =
                    (activeIndex.value - 1 + suggestions.value.length) %
                    suggestions.value.length;
            } else if (event.key === "Enter" && activeIndex.value >= 0) {
                selectAddress(activeIndex.value);
            } else if (event.key === "Escape") {
                suggestions.value = [];
                activeIndex.value = -1;
            }
        };

        const selectAddress = (index: number) => {
            const selected = currentAddresses.value[index].properties;
            const selectedAddress: SelectedAddress = {
                label: selected.label,
                housenumber: selected.housenumber,
                street: selected.street,
                postcode: selected.postcode,
                city: selected.city,
                citycode: selected.citycode,
                lat: currentAddresses.value[index].geometry.coordinates[1],
                lng: currentAddresses.value[index].geometry.coordinates[0],
            };
            query.value = selected.label;
            suggestions.value = [];

            emit("addressSelected", selectedAddress);
        };

        return {
            query,
            suggestions,
            activeIndex,
            activeDescendant,
            debounceGetAdresseSuggestions,
            handleKeyDown,
            selectAddress,
        };
    },
});
</script>

<style scoped>
#suggestions li[aria-selected="true"],
#suggestions li:hover {
    background-color: var(--background-open-blue-france);
}

@media (min-width:62em) {
    .fr-menu__combobox {
        position: relative;
    }
}
</style>