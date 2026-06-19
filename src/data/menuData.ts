import type { MenuCategory } from "../types/menu";

export const menuData: MenuCategory[] = [
  {
    key: "soups",
    titleKey: "categories.soups",
    items: [
      { id: 1, nameKey: "menu.soups.lentil.name", image: "images/lentil-soup.jpg", descriptionKey: "menu.soups.lentil.description", price: 5, weight: "250 qr" },
      { id: 2, nameKey: "menu.soups.creamyMushroom.name", image: "images/mushroom-soup.jpg", descriptionKey: "menu.soups.creamyMushroom.description", price: 6, weight: "250 qr" },
      { id: 3, nameKey: "menu.soups.dushbere.name", image: "images/Dumpling-Soup.jpg", descriptionKey: "menu.soups.dushbere.description", price: 6, weight: "250 qr" },
      { id: 4, nameKey: "menu.soups.tomato.name", image: "images/tomato-soup.jpg", descriptionKey: "menu.soups.tomato.description", price: 5, weight: "250 qr" },
      { id: 5, nameKey: "menu.soups.chicken.name", image: "images/chickensoup.jpg", descriptionKey: "menu.soups.chicken.description", price: 5, weight: "250 qr" }
    ]
  },
  {
    key: "garnishes",
    titleKey: "categories.garnishes",
    items: [
      { id: 6, nameKey: "menu.garnishes.rice.name", image: "images/rice.jpg", descriptionKey: "menu.garnishes.rice.description", price: 4, weight: "150 qr" },
      { id: 7, nameKey: "menu.garnishes.grilledVegetables.name", image: "images/grilled-vegetables.jpg", descriptionKey: "menu.garnishes.grilledVegetables.description", price: 5, weight: "180 qr" },
      { id: 8, nameKey: "menu.garnishes.homePotatoes.name", image: "images/potatos.jpg", descriptionKey: "menu.garnishes.homePotatoes.description", price: 5, weight: "120 qr" },
      { id: 9, nameKey: "menu.garnishes.fries.name", image: "images/fires.jpg", descriptionKey: "menu.garnishes.fries.description", price: 5, weight: "120 qr" }
    ]
  },
  {
    key: "salads",
    titleKey: "categories.salads",
    items: [
      { id: 10, nameKey: "menu.salads.caesarChicken.name", image: "images/chicken-caesar.jpg", descriptionKey: "menu.salads.caesarChicken.description", price: 12, weight: "260 qr" },
      { id: 11, nameKey: "menu.salads.caesarShrimp.name", image: "images/shrimp-caesar.jpg", descriptionKey: "menu.salads.caesarShrimp.description", price: 14, weight: "260 qr" },
      { id: 12, nameKey: "menu.salads.crispyEggplant.name", image: "images/crispy-eggplant.jpg", descriptionKey: "menu.salads.crispyEggplant.description", price: 8, weight: "200 qr" },
      { id: 13, nameKey: "menu.salads.greek.name", image: "images/greek-salad.jpg", descriptionKey: "menu.salads.greek.description", price: 8, weight: "220 qr" },
      { id: 14, nameKey: "menu.salads.tomatoCranberry.name", image: "images/tomato-salad.jpg", descriptionKey: "menu.salads.tomatoCranberry.description", price: 7, weight: "200 qr" },
      { id: 15, nameKey: "menu.salads.tuna.name", image: "images/tuna-salad.jpg", descriptionKey: "menu.salads.tuna.description", price: 14, weight: "270 qr" },
      { id: 16, nameKey: "menu.salads.shepherd.name", image: "images/coban-salad.jpg", descriptionKey: "menu.salads.shepherd.description", price: 6, weight: "250 qr" },
      { id: 17, nameKey: "menu.salads.grill.name", image: "images/vegetable-salad.jpg", descriptionKey: "menu.salads.grill.description", price: 7, weight: "250 qr" },
      { id: 18, nameKey: "menu.salads.quinoaAthlete.name", image: "images/quinoa-salad.jpg", descriptionKey: "menu.salads.quinoaAthlete.description", price: 15, weight: "" }
    ]
  },
  {
    key: "appetizers",
    titleKey: "categories.appetizers",
    items: [
      { id: 19, nameKey: "menu.appetizers.cheesePlatter.name", image: "images/cheese-platter.jpg", descriptionKey: "menu.appetizers.cheesePlatter.description", price: 12, weight: "150 qr" },
      { id: 20, nameKey: "menu.appetizers.pickles.name", image: "images/pickles-plate.jpg", descriptionKey: "menu.appetizers.pickles.description", price: 8, weight: "600 qr" },
      { id: 21, nameKey: "menu.appetizers.olives.name", image: "images/olives-bowl.jpg", descriptionKey: "menu.appetizers.olives.description", price: 6, weight: "" },
      { id: 22, nameKey: "menu.appetizers.vegetableBouquet.name", image: "images/vegetable-platter.jpg", descriptionKey: "menu.appetizers.vegetableBouquet.description", price: 7, weight: "280 qr" },
      { id: 23, nameKey: "menu.appetizers.herbCheese.name", image: "images/herb-cheese.jpg", descriptionKey: "menu.appetizers.herbCheese.description", price: 6, weight: "190 qr" },
      { id: 24, nameKey: "menu.appetizers.onionRings.name", image: "images/onion-rings.jpg", descriptionKey: "menu.appetizers.onionRings.description", price: 6, weight: "8 ədəd" },
      { id: 25, nameKey: "menu.appetizers.mozzarellaSticks.name", image: "images/mozzarella-sticks.jpg", descriptionKey: "menu.appetizers.mozzarellaSticks.description", price: 8, weight: "4 ədəd" },
      { id: 26, nameKey: "menu.appetizers.tempuraShrimp.name", image: "images/tempura-shrimp.jpg", descriptionKey: "menu.appetizers.tempuraShrimp.description", price: 12, weight: "100 qr" },
      { id: 27, nameKey: "menu.appetizers.crispyWings.name", image: "images/crispy-chicken-wings.jpg", descriptionKey: "menu.appetizers.crispyWings.description", price: 9, weight: "220 qr" }
    ]
  },
  {
    key: "meat",
    titleKey: "categories.meat",
    items: [
      { id: 28, nameKey: "menu.meat.pomegranateBeef.name", image: "images/beef pomegranate.jpg", descriptionKey: "menu.meat.pomegranateBeef.description", price: 22, weight: "280 qr" },
      { id: 29, nameKey: "menu.meat.lokumSteak.name", image: "images/beef-steak.jpg", descriptionKey: "menu.meat.lokumSteak.description", price: 25, weight: "280 qr" },
      { id: 30, nameKey: "menu.meat.beefLanget.name", image: "images/beef strips.jpg", descriptionKey: "menu.meat.beefLanget.description", price: 14, weight: "düyü / kartof fri ilə" },
      { id: 31, nameKey: "menu.meat.beefStroganoff.name", image: "images/beef stroganoff.jpg", descriptionKey: "menu.meat.beefStroganoff.description", price: 16, weight: "düyü / kartof fri ilə" }
    ]
  },
  {
    key: "chicken",
    titleKey: "categories.chicken",
    items: [
      { id: 32, nameKey: "menu.chicken.schnitzel.name", image: "images/chicken-schnitzel.jpg", descriptionKey: "menu.chicken.schnitzel.description", price: 12, weight: "280 qr" },
      { id: 33, nameKey: "menu.chicken.tabaka.name", image: "images/roasted-chicken.jpg", descriptionKey: "menu.chicken.tabaka.description", price: 21, weight: "500 qr" },
      { id: 34, nameKey: "menu.chicken.langet.name", image: "images/chicken-strips.jpg", descriptionKey: "menu.chicken.langet.description", price: 9, weight: "300 qr" },
      { id: 35, nameKey: "menu.chicken.stroganoff.name", image: "images/chicken-stroganoff.jpg", descriptionKey: "menu.chicken.stroganoff.description", price: 12, weight: "300 qr" }
    ]
  },
  {
    key: "saj",
    titleKey: "categories.saj",
    items: [
      { id: 36, nameKey: "menu.saj.beefSaj.name", image: "images/beef-saj.jpg", descriptionKey: "menu.saj.beefSaj.description", price: 32, weight: "600 qr" },
      { id: 37, nameKey: "menu.saj.chickenSaj.name", image: "images/chicken-saj.jpg", descriptionKey: "menu.saj.chickenSaj.description", price: 27, weight: "750 qr" },
      { id: 38, nameKey: "menu.saj.lambSaj.name", image: "images/lambsaj.jpg", descriptionKey: "menu.saj.lambSaj.description", price: 30, weight: "600 qr" },
      { id: 39, nameKey: "menu.saj.mixedSaj.name", image: "images/mixedsaj.jpg", descriptionKey: "menu.saj.mixedSaj.description", price: 36, weight: "600 qr" }
    ]
  },
  {
    key: "fish",
    titleKey: "categories.fish",
    items: [
      { id: 40, nameKey: "menu.fish.troutGrill.name", image: "images/trout-fish.jpg", descriptionKey: "menu.fish.troutGrill.description", price: 18, weight: "200 qr" },
      { id: 41, nameKey: "menu.fish.salmonGrill.name", image: "images/salmon-fillet.jpg", descriptionKey: "menu.fish.salmonGrill.description", price: 25, weight: "350 qr" },
      { id: 42, nameKey: "menu.fish.seaBreamGrill.name", image: "images/grilled-sea.jpg", descriptionKey: "menu.fish.seaBreamGrill.description", price: 22, weight: "350 qr" }
    ]
  },
  {
    key: "pasta",
    titleKey: "categories.pasta",
    items: [
      { id: 43, nameKey: "menu.pasta.arrabbiata.name", image: "images/arrabbiata-pasta.jpg", descriptionKey: "menu.pasta.arrabbiata.description", price: 12, weight: "250 qr" },
      { id: 44, nameKey: "menu.pasta.bolognese.name", image: "images/spaghetti-bolognese.jpg", descriptionKey: "menu.pasta.bolognese.description", price: 13, weight: "250 qr" },
      { id: 45, nameKey: "menu.pasta.alfredo.name", image: "images/fettuccine-alfredo.jpg", descriptionKey: "menu.pasta.alfredo.description", price: 13, weight: "250 qr" },
      { id: 46, nameKey: "menu.pasta.carbona.name", image: "images/spaghetti-carbonara.jpg", descriptionKey: "menu.pasta.carbona.description", price: 12, weight: "250 qr" }
    ]
  },
  {
    key: "pizza",
    titleKey: "categories.pizza",
    items: [
      { id: 47, nameKey: "menu.pizza.mixed.name", image: "images/mixed-pizza.jpg", descriptionKey: "menu.pizza.mixed.description", price: 17, weight: "600 qr" },
      { id: 48, nameKey: "menu.pizza.bbq.name", image: "images/bbq-chicken-pizza.jpg", descriptionKey: "menu.pizza.bbq.description", price: 14, weight: "600 qr" },
      { id: 49, nameKey: "menu.pizza.fourCheese.name", image: "images/four-cheese-pizza.jpg", descriptionKey: "menu.pizza.fourCheese.description", price: 12, weight: "500 qr" },
      { id: 50, nameKey: "menu.pizza.margherita.name", image: "images/margherita-pizza.jpg", descriptionKey: "menu.pizza.margherita.description", price: 10, weight: "500 qr" },
      { id: 51, nameKey: "menu.pizza.pepperoni.name", image: "images/pepperoni-pizza.jpg", descriptionKey: "menu.pizza.pepperoni.description", price: 13, weight: "600 qr" },
      { id: 52, nameKey: "menu.pizza.chicken.name", image: "images/chicken-pizza.jpg", descriptionKey: "menu.pizza.chicken.description", price: 15, weight: "600 qr" },
      { id: 53, nameKey: "menu.pizza.mexicano.name", image: "images/mexican-pizza.jpg", descriptionKey: "menu.pizza.mexicano.description", price: 18, weight: "600 qr" },
      { id: 54, nameKey: "menu.pizza.caesar.name", image: "images/pizza-caesar.jpg", descriptionKey: "menu.pizza.caesar.description", price: 14, weight: "600 qr" }
    ]
  },
  {
    key: "burgers",
    titleKey: "categories.burgers",
    items: [
      { id: 55, nameKey: "menu.burgers.mexicano.name", image: "images/spicy-burger.jpg", descriptionKey: "menu.burgers.mexicano.description", price: 13, weight: "450 qr" },
      { id: 56, nameKey: "menu.burgers.cheese.name", image: "images/cheeseburger.jpg", descriptionKey: "menu.burgers.cheese.description", price: 12, weight: "350 qr" },
      { id: 57, nameKey: "menu.burgers.chicken.name", image: "images/chicken-burger.jpg", descriptionKey: "menu.burgers.chicken.description", price: 9, weight: "350 qr" },
      { id: 58, nameKey: "menu.burgers.lokum.name", image: "images/beef-burger.jpg", descriptionKey: "menu.burgers.lokum.description", price: 15, weight: "350 qr" },
      { id: 59, nameKey: "menu.burgers.bbq.name", image: "images/bbq-burger.jpg", descriptionKey: "menu.burgers.bbq.description", price: 12, weight: "350 qr" }
    ]
  },
  {
    key: "fastfood",
    titleKey: "categories.fastfood",
    items: [
      { id: 60, nameKey: "menu.fastfood.specialBeefWrap.name", image: "images/beef-wrap.jpg", descriptionKey: "menu.fastfood.specialBeefWrap.description", price: 13, weight: "" },
      { id: 61, nameKey: "menu.fastfood.specialChickenWrap.name", image: "images/chicken-wrap.jpg", descriptionKey: "menu.fastfood.specialChickenWrap.description", price: 10, weight: "" },
      { id: 62, nameKey: "menu.fastfood.chickenShawarma.name", image: "images/chicken-shawarma.jpg", descriptionKey: "menu.fastfood.chickenShawarma.description", price: 10, weight: "" },
      { id: 63, nameKey: "menu.fastfood.beefShawarma.name", image: "images/beef-shawarma.jpg", descriptionKey: "menu.fastfood.beefShawarma.description", price: 13, weight: "" },
      { id: 64, nameKey: "menu.fastfood.caesarRoll.name", image: "images/chicken-caesar-wrap.jpg", descriptionKey: "menu.fastfood.caesarRoll.description", price: 9, weight: "250 qr" },
      { id: 65, nameKey: "menu.fastfood.chickenBurrito.name", image: "images/chicken-burrito.jpg", descriptionKey: "menu.fastfood.chickenBurrito.description", price: 11, weight: "300 qr" },
      { id: 66, nameKey: "menu.fastfood.beefBurrito.name", image: "images/beef-burrito.jpg", descriptionKey: "menu.fastfood.beefBurrito.description", price: 12, weight: "300 qr" },
      { id: 67, nameKey: "menu.fastfood.clubSandwich.name", image: "images/club-sandwich.jpg", descriptionKey: "menu.fastfood.clubSandwich.description", price: 10, weight: "350 qr" },
      { id: 68, nameKey: "menu.fastfood.cheeseToast.name", image: "images/grilled-cheese-sandwich.jpg", descriptionKey: "menu.fastfood.cheeseToast.description", price: 5, weight: "160 qr" },
      { id: 69, nameKey: "menu.fastfood.sucukToast.name", image: "images/sucuk-sandwich.jpg", descriptionKey: "menu.fastfood.sucukToast.description", price: 9, weight: "250 qr" },
      { id: 70, nameKey: "menu.fastfood.chickenNuggets.name", image: "images/chicken-nuggets.jpg", descriptionKey: "menu.fastfood.chickenNuggets.description", price: 9, weight: "260 qr" }
    ]
  },
  {
    key: "desserts",
    titleKey: "categories.desserts",
    items: [
      { id: 71, nameKey: "menu.desserts.vanillaCheesecake.name", image: "images/vanilla-cheesecake.jpg", descriptionKey: "menu.desserts.vanillaCheesecake.description", price: 10, weight: "" },
      { id: 72, nameKey: "menu.desserts.strawberryCheesecake.name", image: "images/strawberry-cheesecake.jpg", descriptionKey: "menu.desserts.strawberryCheesecake.description", price: 10, weight: "" },
      { id: 73, nameKey: "menu.desserts.chocolateCheesecake.name", image: "images/chocolate-cheesecake.jpg", descriptionKey: "menu.desserts.chocolateCheesecake.description", price: 10, weight: "" },
      { id: 74, nameKey: "menu.desserts.honeyCake.name", image: "images/honey-cake.jpg", descriptionKey: "menu.desserts.honeyCake.description", price: 10, weight: "" },
      { id: 75, nameKey: "menu.desserts.tiramisu.name", image: "images/tiramisu.jpg", descriptionKey: "menu.desserts.tiramisu.description", price: 10, weight: "" },
      { id: 76, nameKey: "menu.desserts.sanSebastian.name", image: "images/basque-burnt.jpg", descriptionKey: "menu.desserts.sanSebastian.description", price: 10, weight: "" },
      { id: 77, nameKey: "menu.desserts.fruitPlate.name", image: "images/fruit-platter.jpg", descriptionKey: "menu.desserts.fruitPlate.description", price: 12, weight: "800 qr" }
    ]
  },
  {
    key: "beerSnacks",
    titleKey: "categories.beerSnacks",
    items: [
      { id: 78, nameKey: "menu.beerSnacks.sausagePlate.name", image: "images/sausage-platter.jpg", descriptionKey: "menu.beerSnacks.sausagePlate.description", price: 9, weight: "200 qr" },
      { id: 79, nameKey: "menu.beerSnacks.stringCheese.name", image: "images/stringcheese.jpg", descriptionKey: "menu.beerSnacks.stringCheese.description", price: 5, weight: "150 qr" },
      { id: 80, nameKey: "menu.beerSnacks.smokedQuail.name", image: "images/smoked-quail.jpg", descriptionKey: "menu.beerSnacks.smokedQuail.description", price: 5, weight: "120 qr" },
      { id: 81, nameKey: "menu.beerSnacks.friedCheese.name", image: "images/fried-cheese.jpg", descriptionKey: "menu.beerSnacks.friedCheese.description", price: 6, weight: "150 qr" },
      { id: 82, nameKey: "menu.beerSnacks.smokedMeat.name", image: "images/smoked-meat.jpg", descriptionKey: "menu.beerSnacks.smokedMeat.description", price: 4, weight: "100 qr" },
      { id: 83, nameKey: "menu.beerSnacks.friedDushbere.name", image: "images/fried-dumplings.jpg", descriptionKey: "menu.beerSnacks.friedDushbere.description", price: 6, weight: "180 qr" },
      { id: 84, nameKey: "menu.beerSnacks.smokedTrout.name", image: "images/smoked-trout-fish.jpg", descriptionKey: "menu.beerSnacks.smokedTrout.description", price: 14, weight: "220 qr" },
      { id: 85, nameKey: "menu.beerSnacks.iveriaSausage.name", image: "images/sausages-grilled.jpg", descriptionKey: "menu.beerSnacks.iveriaSausage.description", price: 8, weight: "150 qr" },
      { id: 86, nameKey: "menu.beerSnacks.chickpeas.name", image: "images/boiled-chickpeas.jpg", descriptionKey: "menu.beerSnacks.chickpeas.description", price: 4, weight: "150 qr" },
      { id: 87, nameKey: "menu.beerSnacks.lemon.name", image: "images/limon.jpg", descriptionKey: "menu.beerSnacks.lemon.description", price: 1, weight: "" },
      { id: 88, nameKey: "menu.beerSnacks.pistachio.name", image: "images/pistachio-nuts.jpg", descriptionKey: "menu.beerSnacks.pistachio.description", price: 7, weight: "" },
      { id: 89, nameKey: "menu.beerSnacks.chips.name", image: "images/potato-chips.jpg", descriptionKey: "menu.beerSnacks.chips.description", price: 6, weight: "" }
    ]
  },
  {
    key: "sets",
    titleKey: "categories.sets",
    items: [
      { id: 90, nameKey: "menu.sets.beerSet.name", image: "images/beer-snacks.jpg", descriptionKey: "menu.sets.beerSet.description", price: 20, weight: "" },
      { id: 91, nameKey: "menu.sets.russianSet.name", image: "images/russian-appetizer.jpg", descriptionKey: "menu.sets.russianSet.description", price: 50, weight: "" }
    ]
  }
];