// Types describing the data-cnstrc-* attribute contract our beacon reads from
// the DOM, plus the shape of window.cnstrc.purchaseData.

export type ContainerKind =
  | "search"
  | "browse"
  | "recommendations"
  | "product-detail";

// One tracked result item, read from a [data-cnstrc-item-id] element.
export interface BeaconItem {
  itemId: string;
  itemName?: string;
  variationId?: string;
}

// Parsed view of a results container element and its attributes.
export interface ContainerContext {
  kind: ContainerKind;
  element: HTMLElement;
  section?: string;
  resultId?: string;
  numResults?: number;
  resultPage?: number;
  zeroResult: boolean;
  // browse only
  filterName?: string;
  filterValue?: string;
  // recommendations only
  podId?: string;
  seedItems?: string;
}

// Shape expected at window.cnstrc.purchaseData (per Constructor docs).
export interface PurchaseData {
  items: Array<{
    item_id: string;
    variation_id?: string;
    count?: number;
    price?: number;
  }>;
  order_id?: string;
  revenue: number;
}

declare global {
  interface Window {
    cnstrc?: {
      indexKey?: string;
      purchaseData?: PurchaseData;
      [key: string]: unknown;
    };
  }
}
