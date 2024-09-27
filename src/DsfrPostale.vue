<template>
    <div>
        <label :for="inputId" class="fr-label">{{ label }}</label>
        <input type="text" class="fr-input" role="combobox" aria-haspopup="listbox" aria-owns="suggestions"
            :aria-expanded="suggestions.length > 0" :id="inputId" v-model="query" @input="getAdresseSuggestions"
            @keydown="handleKeyDown" aria-autocomplete="list" aria-controls="suggestions"
            :aria-activedescendant="activeDescendant" autocomplete="off" />
        <ul role="listbox" v-show="suggestions.length > 0" id="suggestions" class="suggestions">
            <li v-for="(suggestion, index) in suggestions" :key="index" :id="'suggestion-' + index" role="option"
                :aria-selected="index === activeIndex" @click="selectAddress(index)">
                {{ suggestion.properties.label }}
            </li>
        </ul>
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
        },
    },
    emits: ["addressSelected"],
    setup(_, { emit }) {
        const query = ref<string>("");
        const suggestions = ref<AddressFeature[]>([]);
        const activeIndex = ref<number>(-1);
        const currentAddresses = ref<AddressFeature[]>([]);

        const activeDescendant = computed<string>(() => {
            return activeIndex.value >= 0 ? `suggestion-${activeIndex.value}` : "";
        });

        const isValidQuery = (query: string): boolean => {
            const regex = /\s[a-zA-Z]/;
            return regex.test(query);
        };

        const getAdresseSuggestions = async () => {
            if (!isValidQuery(query.value)) {
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
                console.error("Erreur lors de la récupération des suggestions:", error);
            }
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
            getAdresseSuggestions,
            handleKeyDown,
            selectAddress,
        };
    },
});
</script>

<style scoped>
.suggestions {
    border: 1px solid var(--background-contrast-grey-active);
    border-top: 0;
    width: 39vw;
    list-style-type: none;
    padding: 0;
}

.suggestions li {
    padding: 10px;
    cursor: pointer;
    border-top: 1px solid var(--background-contrast-grey-active);
}

.suggestions {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
}

.suggestions li[aria-selected="true"],
.suggestions li:hover {
    background-color: var(--background-open-blue-france);
}
</style>