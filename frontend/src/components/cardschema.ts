import * as Yup from "yup";
//import { useState } from "react";
import { TileSchema, CardSchema, BingoCard, Category } from "../types";
import debugLog from "../debug";

export const getCardSchema = (card?: BingoCard, category?: Category): Yup.SchemaOf<CardSchema> => {
    const stringField = (max: number, defaultValue: string = "") =>
        Yup.string()
            .default(defaultValue)
            .required("Cannot be blank.")
            .max(max, `Cannot be longer than ${max} characters.`);

    const categoryField = stringField(20, card ? card.category.name : category ? category.name : "").matches(/^\w+$/, {
        message: "Can only contain letters, numbers and underscores.",
        excludeEmptyString: true,
    });

    const tileGenerator = (function* () {
        if (card) for (let tile of card.tiles) yield stringField(50, tile.text);
        else while (true) yield stringField(50);
    })();

    const tileFields = getTileFields(() => tileGenerator.next().value);

    return Yup.object({
        ...tileFields,
        name: stringField(50, card ? card.name : ""),
        category: categoryField,
    });
};

/*
export const useCardSchema = (passedCard?: BingoCard, passedCategory?: Category) => {
    const [card] = useState(passedCard);
    const [category] = useState(passedCategory);
 * */
export const useCardSchema = (card?: BingoCard, category?: Category) => {
    debugLog({ SCHEMA: "init", card, category });

    return {
        cardSchema: getCardSchema(card, category),
        valuesToAPI(values: CardSchema<string>) {
            // getting tile fields like this reverses the order for some reason
            const tileFields = Object.entries(values)
                .filter(([field, _]) => field.startsWith("tile_"))
                .reverse();

            const tileArray = card
                ? card.tiles.map((tile, index) => ({ ...tile, text: tileFields[index][1] }))
                : tileFields.map(([_, value]) => ({ text: value }));

            const apiValues = {
                tiles: tileArray,
                name: card ? card.name : values.name,
                category: { name: card ? card.category.name : category ? category.name : values.category },
            };

            tileArray.forEach((tile) => debugLog(tile));
            debugLog(apiValues);

            return apiValues;
        },
    };
};

// yea it looks redundant, but idk how to preserve the object type
// with mapping.
const getTileFields = (valueFunc: () => any): TileSchema => {
    return {
        tile_1: valueFunc(),
        tile_2: valueFunc(),
        tile_3: valueFunc(),
        tile_4: valueFunc(),
        tile_5: valueFunc(),
        tile_6: valueFunc(),
        tile_7: valueFunc(),
        tile_8: valueFunc(),
        tile_9: valueFunc(),
        tile_10: valueFunc(),
        tile_11: valueFunc(),
        tile_12: valueFunc(),
        tile_13: valueFunc(),
        tile_14: valueFunc(),
        tile_15: valueFunc(),
        tile_16: valueFunc(),
        tile_17: valueFunc(),
        tile_18: valueFunc(),
        tile_19: valueFunc(),
        tile_20: valueFunc(),
        tile_21: valueFunc(),
        tile_22: valueFunc(),
        tile_23: valueFunc(),
        tile_24: valueFunc(),
        tile_25: valueFunc(),
    };
};

export const tileFieldNames = Object.keys(getTileFields(() => ""));
