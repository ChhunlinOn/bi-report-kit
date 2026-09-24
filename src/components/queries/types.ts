export interface SavedQuery {
  id: string;
  name: string;
  createdBy: string;
  sql: string;
  createdAt: string;
}

export type NewSavedQuery = Omit<SavedQuery, "id" | "createdAt">;

/**
 * A named bundle of saved queries, reachable by one shareable link (see
 * CollectionManager for creating/sharing these and CollectionView for the
 * read-only page a link opens to).
 */
export interface QueryCollection {
  id: string;
  name: string;
  createdBy: string;
  /** ids of the SavedQuery entries included in this collection */
  queryIds: string[];
  createdAt: string;
}

export type NewQueryCollection = Omit<QueryCollection, "id" | "createdAt">;
