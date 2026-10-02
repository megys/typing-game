export const customerLooks = [
  { portrait: "손", color: "coral" },
  { portrait: "손", color: "mint" },
  { portrait: "손", color: "gold" },
  { portrait: "손", color: "blue" },
  { portrait: "손", color: "rose" },
  { portrait: "손", color: "green" },
];

const action = (id, korean, english, category = "counter", unlockAt = 0) => ({ id, korean, english, category, unlockAt });

export const recipeActions = {
  clearCup: action("clear-cup", "투명 컵을 가져와요", "Grab tall glass"),
  mug: action("mug", "머그잔을 가져와요", "Grab mug"),
  discard: action("discard", "음료를 버려요", "Throw away the drink"),
  coffee: action("coffee", "커피를 내려요", "Make coffee"),
  water: action("water", "물을 부어요", "Pour water"),
  sparklingWater: action("sparkling-water", "탄산수를 부어요", "Pour sparkling water", "fridge", 14),
  hotWater: action("hot-water", "뜨거운 물을 부어요", "Pour hot water", "counter", 6),
  milk: action("milk", "우유를 부어요", "Pour milk", "milk"),
  steamMilk: action("steam-milk", "우유를 데워요", "Steam milk", "milk", 2),
  soyMilk: action("soy-milk", "두유를 부어요", "Pour soy milk", "milk", 10),
  oatMilk: action("oat-milk", "귀리 우유를 부어요", "Pour oat milk", "milk", 12),
  ice: action("ice", "얼음을 넣어요", "Add ice"),
  greenTea: action("green-tea", "녹차 티백을 넣어요", "Add green tea", "tea", 6),
  blackTea: action("black-tea", "홍차 티백을 넣어요", "Add black tea", "tea", 6),
  earlGrey: action("earl-grey", "얼그레이 티백을 넣어요", "Add Earl Grey", "tea", 8),
  peppermint: action("peppermint", "페퍼민트 티백을 넣어요", "Add peppermint tea", "tea", 8),
  chamomile: action("chamomile", "캐모마일 티백을 넣어요", "Add chamomile tea", "tea", 10),
  yuja: action("yuja", "유자청을 넣어요", "Add yuja preserve", "tea", 10),
  peachTea: action("peach-tea", "복숭아 차를 넣어요", "Add peach tea", "tea", 12),
  hibiscus: action("hibiscus", "히비스커스 티백을 넣어요", "Add hibiscus tea", "tea", 12),
  matcha: action("matcha", "말차 가루를 넣어요", "Add matcha", "tea", 14),
  chai: action("chai", "차이 농축액을 넣어요", "Add chai", "tea", 14),
  vanilla: action("vanilla-syrup", "바닐라 시럽을 넣어요", "Add vanilla syrup", "syrup", 6),
  caramel: action("caramel-syrup", "카라멜 시럽을 넣어요", "Add caramel syrup", "syrup", 4),
  hazelnut: action("hazelnut-syrup", "헤이즐넛 시럽을 넣어요", "Add hazelnut syrup", "syrup", 8),
  chocolate: action("chocolate-syrup", "초콜릿 시럽을 넣어요", "Add chocolate syrup", "syrup", 4),
  strawberry: action("strawberry-syrup", "딸기 시럽을 넣어요", "Add strawberry syrup", "syrup", 10),
  peachSyrup: action("peach-syrup", "복숭아 시럽을 넣어요", "Add peach syrup", "syrup", 12),
  mint: action("mint-syrup", "민트 시럽을 넣어요", "Add mint syrup", "syrup", 14),
  lemonSyrup: action("lemon-syrup", "레몬 시럽을 넣어요", "Add lemon syrup", "syrup", 14),
  greenGrapeSyrup: action("green-grape-syrup", "청포도 시럽을 넣어요", "Add green grape syrup", "syrup", 14),
  grapefruitSyrup: action("grapefruit-syrup", "자몽 시럽을 넣어요", "Add grapefruit syrup", "syrup", 14),
  whippedCream: action("whipped-cream", "휘핑크림을 올려요", "Add whipped cream", "topping", 4),
  honey: action("honey", "꿀을 넣어요", "Add honey", "topping", 10),
  lemon: action("lemon", "레몬을 넣어요", "Add lemon", "topping", 8),
};

export const actionCategories = [
  { id: "tea", english: "Tea", korean: "차", actions: Object.values(recipeActions).filter(({ category }) => category === "tea") },
  { id: "syrup", english: "Syrups", korean: "시럽", actions: Object.values(recipeActions).filter(({ category }) => category === "syrup") },
  { id: "fridge", english: "Fridge", korean: "냉장고", actions: [recipeActions.water, recipeActions.sparklingWater, recipeActions.ice, ...Object.values(recipeActions).filter(({ category }) => category === "milk")] },
  { id: "topping", english: "Extras", korean: "추가", actions: Object.values(recipeActions).filter(({ category }) => category === "topping") },
];

const dialogue = (korean, english) => [
  { korean: `${korean} 한 잔 주세요.`, english: `One ${english}, please.` },
  { korean: `오늘은 ${korean} 마시고 싶어요.`, english: `I'd like ${/^[aeiou]/i.test(english) ? "an" : "a"} ${english} today.` },
  { korean: `${korean} 주세요!`, english: `${english}, please!` },
];

const drink = (korean, english, recipe, unlockAt = 0) => ({ korean, english, dialogue: dialogue(korean, english), recipe, unlockAt });

export const drinks = [
  drink("아메리카노", "Americano", [recipeActions.mug, recipeActions.coffee, recipeActions.water]),
  drink("아이스 아메리카노", "Iced Americano", [recipeActions.clearCup, recipeActions.coffee, recipeActions.water, recipeActions.ice]),
  drink("카페 라테", "Latte", [recipeActions.mug, recipeActions.coffee, recipeActions.milk]),
  drink("아이스 카페 라테", "Iced latte", [recipeActions.clearCup, recipeActions.coffee, recipeActions.milk, recipeActions.ice]),
  drink("에스프레소", "Espresso", [recipeActions.mug, recipeActions.coffee], 2),
  drink("카푸치노", "Cappuccino", [recipeActions.mug, recipeActions.coffee, recipeActions.steamMilk], 2),
  drink("카페 모카", "Cafe mocha", [recipeActions.mug, recipeActions.coffee, recipeActions.milk, recipeActions.chocolate, recipeActions.whippedCream], 4),
  drink("카라멜 마키아토", "Caramel macchiato", [recipeActions.mug, recipeActions.milk, recipeActions.coffee, recipeActions.caramel], 4),
  drink("녹차", "Green tea", [recipeActions.mug, recipeActions.greenTea, recipeActions.hotWater], 6),
  drink("홍차", "Black tea", [recipeActions.mug, recipeActions.blackTea, recipeActions.hotWater], 6),
  drink("얼그레이", "Earl Grey", [recipeActions.mug, recipeActions.earlGrey, recipeActions.hotWater, recipeActions.lemon], 8),
  drink("페퍼민트 차", "Peppermint tea", [recipeActions.mug, recipeActions.peppermint, recipeActions.hotWater], 8),
  drink("캐모마일 차", "Chamomile tea", [recipeActions.mug, recipeActions.chamomile, recipeActions.hotWater, recipeActions.honey], 10),
  drink("유자차", "Yuja tea", [recipeActions.mug, recipeActions.yuja, recipeActions.hotWater, recipeActions.honey], 10),
  drink("복숭아 아이스티", "Peach iced tea", [recipeActions.clearCup, recipeActions.peachTea, recipeActions.water, recipeActions.peachSyrup, recipeActions.ice], 12),
  drink("히비스커스 차", "Hibiscus tea", [recipeActions.mug, recipeActions.hibiscus, recipeActions.hotWater], 12),
  drink("말차 라테", "Matcha latte", [recipeActions.mug, recipeActions.matcha, recipeActions.milk], 14),
  drink("차이 라테", "Chai latte", [recipeActions.mug, recipeActions.chai, recipeActions.steamMilk], 14),
  drink("딸기에이드", "Strawberry ade", [recipeActions.clearCup, recipeActions.strawberry, recipeActions.sparklingWater, recipeActions.ice], 14),
  drink("레모네이드", "Lemonade", [recipeActions.clearCup, recipeActions.lemonSyrup, recipeActions.sparklingWater, recipeActions.ice], 14),
  drink("청포도에이드", "Green grape ade", [recipeActions.clearCup, recipeActions.greenGrapeSyrup, recipeActions.sparklingWater, recipeActions.ice], 14),
  drink("자몽에이드", "Grapefruit ade", [recipeActions.clearCup, recipeActions.grapefruitSyrup, recipeActions.sparklingWater, recipeActions.ice], 14),
  drink("복숭아에이드", "Peach ade", [recipeActions.clearCup, recipeActions.peachSyrup, recipeActions.sparklingWater, recipeActions.ice], 14),
];

export function unlockedDrinks(servedOrders) {
  return drinks.filter(({ unlockAt }) => unlockAt <= servedOrders);
}