/**
 * Where to buy PC components in India.
 *
 * Deliberately no star ratings. Seller ratings drift constantly, cannot be
 * verified from inside an offline application, and a stale number presented as
 * current is actively harmful when someone is about to spend a lakh. What is
 * recorded here instead is checkable: what a seller stocks, whether they deal
 * in new or refurbished stock, whether a physical counter exists, and the
 * failure mode worth knowing about before ordering.
 *
 * `physicalStore` is null where a storefront could not be confirmed — that
 * means "unconfirmed", not "online only".
 */

export type RetailerKind = "specialist" | "marketplace" | "refurbished" | "market";
export type StockCondition = "new" | "refurbished" | "open-box" | "used";

export interface Retailer {
  name: string;
  url: string;
  kind: RetailerKind;
  /** Component categories this seller reliably stocks. */
  stocks: string[];
  condition: StockCondition[];
  /** City with a walk-in counter, or null when unconfirmed. */
  physicalStore: string | null;
  summary: string;
  strengths: string[];
  /** The specific thing to check before committing money here. */
  watchFor: string;
}

export const RETAILERS: Retailer[] = [
  {
    name: "MDComputers",
    url: "https://mdcomputers.in/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Cabinet", "Cooling"],
    condition: ["new"],
    physicalStore: "Kolkata",
    summary:
      "One of the most widely used component specialists in India, and the reference many enthusiasts price against.",
    strengths: [
      "Deep component catalogue including niche SKUs",
      "Frequently among the lowest listed prices",
      "Ships nationwide with proper GST invoicing",
    ],
    watchFor:
      "Popular parts go out of stock quickly and the listing may stay up. Confirm availability before paying.",
  },
  {
    name: "PrimeABGB",
    url: "https://www.primeabgb.com/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Prebuilt"],
    condition: ["new"],
    physicalStore: "Mumbai (Lamington Road)",
    summary:
      "Long-established Mumbai retailer with a walk-in counter, popular for building in person and carrying parts home the same day.",
    strengths: [
      "Physical counter for same-day pickup",
      "Strong on high-end graphics and enthusiast boards",
      "Assembly and testing available",
    ],
    watchFor:
      "Online listed price and in-store price do not always match. Confirm which applies before travelling.",
  },
  {
    name: "Vedant Computers",
    url: "https://www.vedantcomputers.com/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Peripherals"],
    condition: ["new"],
    physicalStore: null,
    summary:
      "Established component retailer serving builders, businesses and content creators nationwide.",
    strengths: [
      "Broad catalogue across all core categories",
      "Regular stock of current-generation parts",
    ],
    watchFor: "Confirm walk-in availability on their site before planning a visit.",
  },
  {
    name: "TheITDepot",
    url: "https://www.theitdepot.com/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Networking"],
    condition: ["new"],
    physicalStore: null,
    summary:
      "Long-running online IT retailer with a wide catalogue extending beyond gaming parts into networking and office hardware.",
    strengths: ["Wide non-gaming catalogue", "Detailed product specification listings"],
    watchFor: "Delivery timelines can be longer than the larger marketplaces.",
  },
  {
    name: "Computech Store",
    url: "https://computechstore.in/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "Laptops"],
    condition: ["new"],
    physicalStore: null,
    summary: "Component and laptop retailer frequently competitive on current-generation processors.",
    strengths: ["Often keenly priced on new CPU launches"],
    watchFor: "Smaller operation than the marketplaces; confirm warranty handling in advance.",
  },
  {
    name: "EliteHubs",
    url: "https://elitehubs.com/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "RAM", "Storage", "PSU", "Prebuilt"],
    condition: ["new"],
    physicalStore: null,
    summary: "Component retailer with a focus on gaming builds and prebuilt systems.",
    strengths: ["Curated gaming-oriented selection", "Prebuilt configurations available"],
    watchFor: "Catalogue is narrower than the large specialists; not every SKU is carried.",
  },
  {
    name: "PC Studio (Ankit Infotech)",
    url: "https://www.pcstudio.in/",
    kind: "specialist",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Cabinet"],
    condition: ["new"],
    physicalStore: "Offline stores available",
    summary:
      "Component retailer operating both online and offline, well regarded for in-person service.",
    strengths: ["Offline presence for hands-on buying", "Build assistance"],
    watchFor: "Check which specific store location stocks the part you want.",
  },
  {
    name: "Microcenter India",
    url: "https://microcenterindia.com/",
    kind: "specialist",
    stocks: ["Prebuilt", "CPU", "GPU", "Motherboard", "RAM", "Storage"],
    condition: ["new"],
    physicalStore: "Kolkata",
    summary:
      "Builds custom and prebuilt systems in Kolkata and ships them across India. Unrelated to the US chain of a similar name.",
    strengths: ["Assembled and tested systems", "Useful if you would rather not build yourself"],
    watchFor: "Compare the bundled build price against buying the parts individually here.",
  },
  {
    name: "Amazon.in",
    url: "https://www.amazon.in/",
    kind: "marketplace",
    stocks: ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Laptops", "Peripherals"],
    condition: ["new", "refurbished", "open-box"],
    physicalStore: null,
    summary:
      "Largest reach and the easiest returns process, but a marketplace — the seller behind a listing matters as much as the listing.",
    strengths: [
      "Straightforward returns and dispute resolution",
      "Amazon Renewed for refurbished stock with a supplier-backed warranty",
      "Fast delivery to most of the country",
    ],
    watchFor:
      "Check whether the seller is Amazon or a third party, and that the product is 'Fulfilled by Amazon'. Component pricing is often above the specialists.",
  },
  {
    name: "Flipkart",
    url: "https://www.flipkart.com/",
    kind: "marketplace",
    stocks: ["CPU", "GPU", "RAM", "Storage", "Laptops", "Peripherals"],
    condition: ["new", "refurbished"],
    physicalStore: null,
    summary:
      "Wide reach with aggressive sale-period pricing, though the enthusiast component catalogue is thinner than Amazon's.",
    strengths: ["Deep discounts during Big Billion Days and similar events", "Wide delivery network"],
    watchFor:
      "Seller quality varies considerably. Verify the seller rating and return window on the specific listing.",
  },
  {
    name: "Cashify",
    url: "https://www.cashify.in/buy-refurbished-laptops",
    kind: "refurbished",
    stocks: ["Laptops", "Phones"],
    condition: ["refurbished"],
    physicalStore: "Stores in several cities",
    summary:
      "Refurbisher with its own grading process, warranty cover and EMI options, plus physical stores for in-person inspection.",
    strengths: [
      "Own quality process rather than a pass-through marketplace",
      "Typically six months of warranty",
      "Physical stores let you inspect before buying",
    ],
    watchFor:
      "Grading language varies. Ask exactly what 'superb' or 'good' means for cosmetic and battery condition.",
  },
  {
    name: "NewJaisa",
    url: "https://newjaisa.com/",
    kind: "refurbished",
    stocks: ["Laptops", "Desktops"],
    condition: ["refurbished"],
    physicalStore: null,
    summary: "Refurbisher of laptops and desktops with quality checks and warranty cover.",
    strengths: ["Quality-checked stock with warranty", "Desktop as well as laptop inventory"],
    watchFor: "Confirm the warranty period and what it covers before ordering.",
  },
  {
    name: "Amazon Renewed",
    url: "https://www.amazon.in/renewed",
    kind: "refurbished",
    stocks: ["Laptops", "Peripherals", "Storage"],
    condition: ["refurbished", "open-box"],
    physicalStore: null,
    summary:
      "Amazon's refurbished programme — inspected by approved suppliers with a minimum 90-day supplier-backed guarantee.",
    strengths: ["Amazon's returns process applies", "Very wide selection"],
    watchFor:
      "Units come from many different suppliers, so condition varies more than with a single refurbisher. The guarantee is shorter than dedicated refurbishers offer.",
  },
];

/** Physical hardware markets — useful for bargaining and for same-day parts. */
export interface HardwareMarket {
  name: string;
  city: string;
  summary: string;
  watchFor: string;
}

export const HARDWARE_MARKETS: HardwareMarket[] = [
  {
    name: "Nehru Place",
    city: "New Delhi",
    summary:
      "The largest computer hardware market in India. Effectively every component, plus repair and assembly services, within a few blocks.",
    watchFor:
      "Quality varies enormously between shops. Insist on a GST invoice with the serial number recorded, and verify warranty registration on the manufacturer's site before leaving.",
  },
  {
    name: "Lamington Road",
    city: "Mumbai",
    summary:
      "Mumbai's established electronics and computer hardware street, with a mix of long-standing retailers and small shops.",
    watchFor:
      "Prices are negotiable but so is what you actually receive. Confirm the exact SKU rather than the model family.",
  },
  {
    name: "SP Road",
    city: "Bengaluru",
    summary:
      "Bengaluru's hardware market, strong on components and electronics, with several established component retailers.",
    watchFor: "Ask whether stock is Indian-warranty or imported — imported stock may have no local RMA path.",
  },
  {
    name: "Ritchie Street",
    city: "Chennai",
    summary: "Chennai's computer hardware market, covering components, laptops and repair services.",
    watchFor: "Verify that a component is new and not open-box being sold as sealed.",
  },
  {
    name: "Chandni Chowk",
    city: "Kolkata",
    summary: "Kolkata's electronics and computer hardware market, near several established retailers.",
    watchFor: "Cross-check the market price against the online specialists before committing.",
  },
];
