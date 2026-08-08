/** Filter item definition — maps a UI filter to a data-fetch strategy */
export interface FilterItem {
  key: string;         // unique key within its group
  label: string;       // display name
  icon: string;        // emoji icon
  /** One of: "cat" (WP category), "search" (keyword), "mode" (top-level nav) */
  type: "cat" | "search" | "mode";
  /** For type=cat: WP category URL; type=search: keyword query; type=mode: nav mode */
  value: string;
}

export interface FilterSelection {
  groupId: string;
  itemKey: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  items: FilterItem[];
}

const B = "https://www.nunghd4k.com";

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "genre",
    label: "แนวหนัง",
    items: [
      { key: "action",    label: "แอคชั่น",     icon: "🔥", type: "cat", value: `${B}/action-%e0%b8%95%e0%b9%88%e0%b8%ad%e0%b8%aa%e0%b8%b9%e0%b9%89/` },
      { key: "adventure", label: "ผจญภัย",      icon: "🗺️", type: "cat", value: `${B}/adventure-%e0%b8%9c%e0%b8%88%e0%b8%8d%e0%b8%a0%e0%b8%b1%e0%b8%a2/` },
      { key: "animation", label: "การ์ตูน",      icon: "🎨", type: "cat", value: `${B}/animation-%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%8c%e0%b8%95%e0%b8%b9%e0%b8%99/` },
      { key: "comedy",    label: "ตลก",         icon: "😂", type: "cat", value: `${B}/comedy-%e0%b8%95%e0%b8%a5%e0%b8%81/` },
      { key: "crime",     label: "อาชญากรรม",    icon: "🔫", type: "cat", value: `${B}/crime-%e0%b8%ad%e0%b8%b2%e0%b8%8a%e0%b8%8d%e0%b8%b2%e0%b8%81%e0%b8%a3%e0%b8%a3%e0%b8%a1/` },
      { key: "documentary", label: "สารคดี",     icon: "📖", type: "cat", value: `${B}/documentary-%e0%b8%aa%e0%b8%b2%e0%b8%a3%e0%b8%84%e0%b8%94%e0%b8%b5/` },
      { key: "drama",     label: "ดราม่า",       icon: "🎭", type: "cat", value: `${B}/drama-%e0%b8%8a%e0%b8%b5%e0%b8%a7%e0%b8%b4%e0%b8%95/` },
      { key: "family",    label: "ครอบครัว",     icon: "👨‍👩‍👧‍👦", type: "cat", value: `${B}/family-%e0%b9%81%e0%b8%99%e0%b8%a7%e0%b8%84%e0%b8%a3%e0%b8%ad%e0%b8%9a%e0%b8%84%e0%b8%a3%e0%b8%b1%e0%b8%a7/` },
      { key: "fantasy",   label: "แฟนตาซี",     icon: "🧙", type: "cat", value: `${B}/fantasy-%e0%b9%81%e0%b8%9f%e0%b8%99%e0%b8%95%e0%b8%b2%e0%b8%8b%e0%b8%b5/` },
      { key: "history",   label: "ประวัติศาสตร์", icon: "🏛️", type: "cat", value: `${B}/history-%e0%b8%9b%e0%b8%a3%e0%b8%b0%e0%b8%a7%e0%b8%b1%e0%b8%95%e0%b8%b4%e0%b8%a8%e0%b8%b2%e0%b8%aa%e0%b8%95%e0%b8%a3%e0%b9%8c/` },
      { key: "horror",    label: "สยองขวัญ",     icon: "👻", type: "cat", value: `${B}/horror-%e0%b8%aa%e0%b8%a2%e0%b8%ad%e0%b8%87%e0%b8%82%e0%b8%a7%e0%b8%b1%e0%b8%8d/` },
      { key: "mystery",   label: "ลี้ลับ",       icon: "🔍", type: "cat", value: `${B}/mystery-%e0%b9%80%e0%b8%81%e0%b8%b5%e0%b9%88%e0%b8%a2%e0%b8%a7%e0%b8%81%e0%b8%b1%e0%b8%9a%e0%b8%aa%e0%b8%b4%e0%b9%88%e0%b8%87%e0%b8%a5%e0%b8%b5%e0%b9%89%e0%b8%a5%e0%b8%b1%e0%b8%9a/` },
      { key: "romance",   label: "โรแมนติก",     icon: "💕", type: "cat", value: `${B}/romance-%e0%b8%a3%e0%b8%b1%e0%b8%81/` },
      { key: "scifi",     label: "ไซไฟ",        icon: "🚀", type: "cat", value: `${B}/sci-fi-%e0%b8%99%e0%b8%b4%e0%b8%a2%e0%b8%b2%e0%b8%a2%e0%b8%a7%e0%b8%b4%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%a8%e0%b8%b2%e0%b8%aa%e0%b8%95%e0%b8%a3%e0%b9%8c/` },
      { key: "sport",     label: "กีฬา",        icon: "⚽", type: "cat", value: `${B}/sport-%e0%b8%81%e0%b8%b5%e0%b8%ac%e0%b8%b2/` },
      { key: "thriller",  label: "ระทึกขวัญ",    icon: "😱", type: "cat", value: `${B}/thriller-%e0%b9%80%e0%b8%82%e0%b8%a2%e0%b9%88%e0%b8%b2%e0%b8%82%e0%b8%a7%e0%b8%b1%e0%b8%8d/` },
      { key: "war",       label: "สงคราม",      icon: "🎖️", type: "cat", value: `${B}/war-%e0%b9%80%e0%b8%81%e0%b8%b5%e0%b9%88%e0%b8%a2%e0%b8%a7%e0%b8%81%e0%b8%b1%e0%b8%9a%e0%b8%aa%e0%b8%87%e0%b8%84%e0%b8%a3%e0%b8%b2%e0%b8%a1/` },
    ],
  },
  {
    id: "country",
    label: "ประเทศ",
    items: [
      { key: "thai",    label: "ไทย",    icon: "🇹🇭", type: "cat",    value: `${B}/thaimovie/` },
      { key: "korean",  label: "เกาหลี",  icon: "🇰🇷", type: "search", value: "เกาหลี" },
      { key: "chinese", label: "จีน",    icon: "🇨🇳", type: "search", value: "จีน" },
      { key: "japanese",label: "ญี่ปุ่น",  icon: "🇯🇵", type: "search", value: "ญี่ปุ่น" },
      { key: "indian",  label: "อินเดีย",  icon: "🇮🇳", type: "search", value: "อินเดีย" },
      { key: "western", label: "ฝรั่ง",    icon: "🌍", type: "cat",    value: `${B}/%e0%b8%ab%e0%b8%99%e0%b8%b1%e0%b8%87%e0%b8%9d%e0%b8%a3%e0%b8%b1%e0%b9%88%e0%b8%87/` },
      { key: "asia",    label: "เอเชีย",   icon: "🌏", type: "cat",    value: `${B}/%e0%b8%ab%e0%b8%99%e0%b8%b1%e0%b8%87%e0%b9%80%e0%b8%ad%e0%b9%80%e0%b8%8a%e0%b8%b5%e0%b8%a2/` },
    ],
  },
  {
    id: "platform",
    label: "แพลตฟอร์ม",
    items: [
      { key: "netflix",    label: "Netflix",     icon: "🎬", type: "mode",   value: "netflix" },
      { key: "disney",     label: "Disney+",     icon: "🏰", type: "search", value: "ดิสนีย์" },
      { key: "hbo",        label: "HBO",         icon: "📺", type: "search", value: "HBO" },
      { key: "prime",      label: "Prime Video", icon: "📦", type: "search", value: "Prime" },
    ],
  },
  {
    id: "series",
    label: "ซีรีย์",
    items: [
      { key: "series-korean",   label: "ซีรีย์เกาหลี",  icon: "🇰🇷", type: "search", value: "เกาหลี" },
      { key: "series-chinese",  label: "ซีรีย์จีน",    icon: "🇨🇳", type: "search", value: "จีน" },
      { key: "series-western",  label: "ซีรีย์ฝรั่ง",   icon: "🇺🇸", type: "search", value: "ฝรั่ง" },
      { key: "series-thai",     label: "ซีรีย์ไทย",    icon: "🇹🇭", type: "search", value: "ไทย" },
      { key: "series-japanese", label: "ซีรีย์ญี่ปุ่น",  icon: "🇯🇵", type: "search", value: "ญี่ปุ่น" },
    ],
  },
];
