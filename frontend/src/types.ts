export interface User {
    created_at: string;
    name: string;
    id: number;
    score: number;
    is_following: boolean | null;
    categories_created: Category[];
}

export type UserState = User | null;

export interface Hashtag {
    name: string;
}

export interface Category {
    description: string;
    related_categories: Category[];
    is_subscribed: boolean | null;
    subscriber_count: number;
    hashtags: Hashtag[];
    name: string;
    id: number;
    created_at: string;
    author: User;
    cards_count: number;
    icon_url: string;
    banner_url: string;
}

export interface BingoTile {
    text: string;
    id: number;
    score: number;
    clicked: boolean;
    hovered: boolean;
}

export interface BingoCard {
    name: string;
    tiles: BingoTile[];
    score: number;
    id: number;
    created_at: string;
    author: User;
    upvoted: boolean | null;
    category: Category;
    hashtags: Hashtag[];
}

export type CardState = BingoCard | null;

export interface SearchResults<T = any> {
    count: number;
    page_size: number;
    results: T[];
}

export interface TileSchema<T = any> {
    tile_1: T;
    tile_2: T;
    tile_3: T;
    tile_4: T;
    tile_5: T;
    tile_6: T;
    tile_7: T;
    tile_8: T;
    tile_9: T;
    tile_10: T;
    tile_11: T;
    tile_12: T;
    tile_13: T;
    tile_14: T;
    tile_15: T;
    tile_16: T;
    tile_17: T;
    tile_18: T;
    tile_19: T;
    tile_20: T;
    tile_21: T;
    tile_22: T;
    tile_23: T;
    tile_24: T;
    tile_25: T;
}

export interface CardSchema<T = any> extends TileSchema<T> {
    name: string;
    category: string;
}

export type ObjectArray<T = any> = { [s: string]: T };
