export interface User {
  created_at: string;
  name: string;
  id: number;
  score: number;
}

export type UserState = User | null;

export interface Category {
  name: string;
  id: number;
  created_at: string;
  author: User;
  cards_count: number;
}

export interface BingoTile {
  text: string;
  id: number;
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
  tile_1: string;
  tile_2: string;
  tile_3: string;
  tile_4: string;
  tile_5: string;
  tile_6: string;
  tile_7: string;
  tile_8: string;
  tile_9: string;
  tile_10: string;
  tile_11: string;
  tile_12: string;
  tile_13: string;
  tile_14: string;
  tile_15: string;
  tile_16: string;
  tile_17: string;
  tile_18: string;
  tile_19: string;
  tile_20: string;
  tile_21: string;
  tile_22: string;
  tile_23: string;
  tile_24: string;
  tile_25: string;
}

export type CardState = BingoCard | null;

export interface SearchResults<T = any> {
    count: number;
    page_size: number;
    results: T[];
}
