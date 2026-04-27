export interface StandardBox {
  id: number;
  characters: string[];
  ids: (number | null)[];
}

export interface SpecialPass {
  name: string;
  characters: string[];
  ids: (number | null)[];
}

export interface Data {
  standard_boxes: StandardBox[];
  special_passes: SpecialPass[];
}

export interface Ownership {
  owned: boolean;
  count: number;
}

export interface UserData {
  [characterId: number]: Ownership;
}

export interface DBUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface ChangelogItem {
  id?: string;
  version: string;
  date: string;
  changes: string[];
}
