import type { ModelDefinition } from "../modelGeometry";
import { chineseBeastDesigns } from "./chineseBeasts";
import { worldBeastDesigns } from "./worldBeasts";
import type { SceneAsset } from "../sceneDocument";
import { groundParts } from "./shared";
import { produceDesigns } from "./produce";
import { geologyDesigns } from "./geology";
import { floraDesigns } from "./flora";
import { animalDesigns } from "./animals";
import { marineDesigns } from "./marine";
import { foodDesigns } from "./foods";
import { extraFloraDesigns } from "./extraFlora";
import { invertebrateDesigns } from "./invertebrates";
import { vertebrateDesigns } from "./vertebrates";
import { formationDesigns } from "./formations";
import { naturalOrganDesigns } from "./naturalOrgans";
import { fungiDesigns } from "./fungi";
import { skeletonPartDesigns } from "./skeletonParts";
import { wildFlowerDesigns } from "./wildFlowers";
import { oceanFormDesigns } from "./oceanForms";
import { seedFormDesigns } from "./seedForms";
import { prehistoricDesigns } from "./prehistoric";
import { treeDesigns } from "./trees";
import { nestDesigns } from "./nests";
import { birdDesigns } from "./birds";
import { coastalAnimalDesigns } from "./coastalAnimals";
import { bakedFoodDesigns } from "./bakedFoods";
import { earlyLifeDesigns } from "./earlyLife";
import { aquaticPlantDesigns } from "./aquaticPlants";
import { mineralFormDesigns } from "./mineralForms";
import { fishFormDesigns } from "./fishForms";
import { ediblePlantDesigns } from "./ediblePlants";
import { mammalFormDesigns } from "./mammalForms";
import { specialFlowerDesigns } from "./specialFlowers";
import { showcasePlantDesigns } from "./showcasePlants";
import { insectFormDesigns } from "./insectForms";
import { shapedFoodDesigns } from "./shapedFoods";
import { fieldFaunaDesigns } from "./fieldFauna";
import { softOrganDesigns } from "./softOrgans";
import { succulentFormDesigns } from "./succulentForms";
import { softSeaLifeDesigns } from "./softSeaLife";
import { gardenCropDesigns } from "./gardenCrops";
import { botanicalFormDesigns } from "./botanicalForms";
import { extinctFormDesigns } from "./extinctForms";
import { skullElementDesigns } from "./skullElements";
import { arthropodFormDesigns } from "./arthropodForms";
import { functionalFishDesigns } from "./functionalFish";
import { woodyFormDesigns } from "./woodyForms";
import { botanicalRarityDesigns } from "./botanicalRarities";
import { functionalPlantDesigns } from "./functionalPlants";
import { shoreFormDesigns } from "./shoreForms";
import { cambrianFormDesigns } from "./cambrianForms";
import { comparativeOrganDesigns } from "./comparativeOrgans";
import { algalFormDesigns } from "./algalForms";
import { orchidFormDesigns } from "./orchidForms";
import { ornamentalPlantDesigns } from "./ornamentalPlants";
import { distinctMammalDesigns } from "./distinctMammals";
import { avianFormDesigns } from "./avianForms";
import { bractedPlantDesigns } from "./bractedPlants";
import { gardenPerennialDesigns } from "./gardenPerennials";
import { floralShrubDesigns } from "./floralShrubs";
import { evergreenFormDesigns } from "./evergreenForms";
import { foliageFormDesigns } from "./foliageForms";
import { springShrubDesigns } from "./springShrubs";
import { floralHerbDesigns } from "./floralHerbs";
import { meadowHerbDesigns } from "./meadowHerbs";
import { carnivoreFormDesigns } from "./carnivoreForms";
import { arborealMammalDesigns } from "./arborealMammals";
import { groundMammalDesigns } from "./groundMammals";
import { toothedWhaleDesigns } from "./toothedWhales";
import { fragrantShrubDesigns } from "./fragrantShrubs";
import { fieldFlowerDesigns } from "./fieldFlowers";
import { economicPlantDesigns } from "./economicPlants";
import { fruitOrganDesigns } from "./fruitOrgans";
import { hymeniumFungusDesigns } from "./hymeniumFungi";
import { shelledFungusDesigns } from "./shelledFungi";
import { cupFungusDesigns } from "./cupFungi";
import { clusteredFungusDesigns } from "./clusteredFungi";
import { scaledReptileDesigns } from "./scaledReptiles";
import { amphibianBodyDesigns } from "./amphibianBodies";
import { specialTurtleDesigns } from "./specialTurtles";
import { specialSnakeDesigns } from "./specialSnakes";
import { bivalveArchitectureDesigns } from "./bivalveArchitectures";
import { pelagicCephalopodDesigns } from "./pelagicCephalopods";
import { armoredSeaLifeDesigns } from "./armoredSeaLife";
import { decapodSpecialistDesigns } from "./decapodSpecialists";
import { caveStructureDesigns } from "./caveStructures";
import { erosionFormDesigns } from "./erosionForms";
import { landformShellDesigns } from "./landformShells";
import { landAnimalExpansionBatchOneDesigns } from "./landAnimalExpansionBatchOne";
import { woodyExpansionBatchOneDesigns } from "./woodyExpansionBatchOne";
import { birdExpansionBatchOneDesigns } from "./birdExpansionBatchOne";
import { aquaticExpansionBatchOneDesigns } from "./aquaticExpansionBatchOne";
import { landAnimalExpansionBatchTwoDesigns } from "./landAnimalExpansionBatchTwo";
import { herbaceousExpansionBatchOneDesigns } from "./herbaceousExpansionBatchOne";
import { invertebrateExpansionBatchOneDesigns } from "./invertebrateExpansionBatchOne";
import { birdExpansionBatchTwoDesigns } from "./birdExpansionBatchTwo";
import { woodyExpansionBatchTwoDesigns } from "./woodyExpansionBatchTwo";
import { aquaticExpansionBatchTwoDesigns } from "./aquaticExpansionBatchTwo";
import { landAnimalExpansionBatchThreeDesigns } from "./landAnimalExpansionBatchThree";
import { reefExpansionBatchOneDesigns } from "./reefExpansionBatchOne";
import { fluvialGlacialLandformDesigns } from "./fluvialGlacialLandforms";
import { birdExpansionBatchThreeDesigns } from "./birdExpansionBatchThree";
import { giantArthropodExpansionBatchOneDesigns } from "./giantArthropodExpansionBatchOne";
import { aquaticExpansionBatchThreeDesigns } from "./aquaticExpansionBatchThree";
import { landAnimalExpansionBatchFourDesigns } from "./landAnimalExpansionBatchFour";
import { reefExpansionBatchTwoDesigns } from "./reefExpansionBatchTwo";
import { herbaceousExpansionBatchTwoDesigns } from "./herbaceousExpansionBatchTwo";
import { woodyExpansionBatchThreeDesigns } from "./woodyExpansionBatchThree";
import { birdExpansionBatchFourDesigns } from "./birdExpansionBatchFour";
import { reefExpansionBatchThreeDesigns } from "./reefExpansionBatchThree";
import { aquaticExpansionBatchFourDesigns } from "./aquaticExpansionBatchFour";
import { herbaceousExpansionBatchThreeDesigns } from "./herbaceousExpansionBatchThree";
import { geologicStructureExpansionBatchOneDesigns } from "./geologicStructureExpansionBatchOne";
import { birdExpansionBatchFiveDesigns } from "./birdExpansionBatchFive";
import { landAnimalExpansionBatchFiveDesigns } from "./landAnimalExpansionBatchFive";
import { landAnimalExpansionBatchSixDesigns } from "./landAnimalExpansionBatchSix";
import { aquaticExpansionBatchFiveDesigns } from "./aquaticExpansionBatchFive";
import { geologicStructureExpansionBatchTwoDesigns } from "./geologicStructureExpansionBatchTwo";
import { birdExpansionBatchSixDesigns } from "./birdExpansionBatchSix";
import { herbaceousExpansionBatchFourDesigns } from "./herbaceousExpansionBatchFour";
import { geologicStructureExpansionBatchThreeDesigns } from "./geologicStructureExpansionBatchThree";
import { landAnimalExpansionBatchSevenDesigns } from "./landAnimalExpansionBatchSeven";
import { landAnimalExpansionBatchEightDesigns } from "./landAnimalExpansionBatchEight";
import { woodyExpansionBatchFourDesigns } from "./woodyExpansionBatchFour";
import { osteologicalSkeletonExpansionBatchOneDesigns } from "./osteologicalSkeletonExpansionBatchOne";
import { osteologicalSkeletonExpansionBatchTwoDesigns } from "./osteologicalSkeletonExpansionBatchTwo";
import { birdExpansionBatchSevenDesigns } from "./birdExpansionBatchSeven";
import { geologicStructureExpansionBatchFourDesigns } from "./geologicStructureExpansionBatchFour";
import { landAnimalExpansionBatchNineDesigns } from "./landAnimalExpansionBatchNine";
import { aquaticExpansionBatchSixDesigns } from "./aquaticExpansionBatchSix";
import { herbaceousExpansionBatchFiveDesigns } from "./herbaceousExpansionBatchFive";
import { landAnimalExpansionBatchTenDesigns } from "./landAnimalExpansionBatchTen";
import { geologicStructureExpansionBatchFiveDesigns } from "./geologicStructureExpansionBatchFive";
import { birdExpansionBatchEightDesigns } from "./birdExpansionBatchEight";
import { woodyExpansionBatchFiveDesigns } from "./woodyExpansionBatchFive";
import { aquaticExpansionBatchSevenDesigns } from "./aquaticExpansionBatchSeven";
import { geologicStructureExpansionBatchSixDesigns } from "./geologicStructureExpansionBatchSix";
import { herbaceousExpansionBatchSixDesigns } from "./herbaceousExpansionBatchSix";
import { osteologicalSkeletonExpansionBatchThreeDesigns } from "./osteologicalSkeletonExpansionBatchThree";
import { osteologicalSkeletonExpansionBatchFourDesigns } from "./osteologicalSkeletonExpansionBatchFour";
import { landAnimalExpansionBatchElevenDesigns } from "./landAnimalExpansionBatchEleven";
import { landAnimalExpansionBatchTwelveDesigns } from "./landAnimalExpansionBatchTwelve";
import { mythicCreatureExpansionBatchOneDesigns } from "./mythicCreatureExpansionBatchOne";
import { birdExpansionBatchNineDesigns } from "./birdExpansionBatchNine";
import { aquaticExpansionBatchEightDesigns } from "./aquaticExpansionBatchEight";
import { woodyExpansionBatchSixDesigns } from "./woodyExpansionBatchSix";
import { landAnimalExpansionBatchThirteenDesigns } from "./landAnimalExpansionBatchThirteen";
import { birdExpansionBatchTenDesigns } from "./birdExpansionBatchTen";
import { landAnimalExpansionBatchFourteenDesigns } from "./landAnimalExpansionBatchFourteen";
import { osteologicalSkeletonExpansionBatchFiveDesigns } from "./osteologicalSkeletonExpansionBatchFive";
import { mythicCreatureExpansionBatchTwoDesigns } from "./mythicCreatureExpansionBatchTwo";
import { herbaceousExpansionBatchSevenDesigns } from "./herbaceousExpansionBatchSeven";
import { nearEasternMythicCreatureExpansionBatchOneDesigns } from "./nearEasternMythicCreatureExpansionBatchOne";
import { aquaticExpansionBatchNineDesigns } from "./aquaticExpansionBatchNine";
import { landAnimalExpansionBatchFifteenDesigns } from "./landAnimalExpansionBatchFifteen";
import { birdExpansionBatchElevenDesigns } from "./birdExpansionBatchEleven";
import { nearEasternMythicCreatureExpansionBatchTwoDesigns } from "./nearEasternMythicCreatureExpansionBatchTwo";
import { osteologicalSkeletonExpansionBatchSixDesigns } from "./osteologicalSkeletonExpansionBatchSix";
import { landAnimalExpansionBatchSixteenDesigns } from "./landAnimalExpansionBatchSixteen";
import { aquaticExpansionBatchTenDesigns } from "./aquaticExpansionBatchTen";
import { woodyExpansionBatchSevenDesigns } from "./woodyExpansionBatchSeven";
import { mythicCreatureExpansionBatchThreeDesigns } from "./mythicCreatureExpansionBatchThree";
import { herbaceousExpansionBatchEightDesigns } from "./herbaceousExpansionBatchEight";
import { nearEasternMythicCreatureExpansionBatchThreeDesigns } from "./nearEasternMythicCreatureExpansionBatchThree";
import { birdExpansionBatchTwelveDesigns } from "./birdExpansionBatchTwelve";
import { landAnimalExpansionBatchSeventeenDesigns } from "./landAnimalExpansionBatchSeventeen";
import { fluvialReliefExpansionBatchOneDesigns } from "./fluvialReliefExpansionBatchOne";
import { osteologicalSkeletonExpansionBatchSevenDesigns } from "./osteologicalSkeletonExpansionBatchSeven";
import { mythicCreatureExpansionBatchFourDesigns } from "./mythicCreatureExpansionBatchFour";
import { birdExpansionBatchThirteenDesigns } from "./birdExpansionBatchThirteen";
import { nearEasternMythicCreatureExpansionBatchFourDesigns } from "./nearEasternMythicCreatureExpansionBatchFour";
import { landAnimalExpansionBatchEighteenDesigns } from "./landAnimalExpansionBatchEighteen";
import { aquaticExpansionBatchElevenDesigns } from "./aquaticExpansionBatchEleven";
import { osteologicalSkeletonExpansionBatchEightDesigns } from "./osteologicalSkeletonExpansionBatchEight";
import { woodyExpansionBatchEightDesigns } from "./woodyExpansionBatchEight";
import { mythicCreatureExpansionBatchFiveDesigns } from "./mythicCreatureExpansionBatchFive";
import { nearEasternMythicCreatureExpansionBatchFiveDesigns } from "./nearEasternMythicCreatureExpansionBatchFive";
import { birdExpansionBatchFourteenDesigns } from "./birdExpansionBatchFourteen";
import { landAnimalExpansionBatchNineteenDesigns } from "./landAnimalExpansionBatchNineteen";
import { herbaceousExpansionBatchNineDesigns } from "./herbaceousExpansionBatchNine";
import { osteologicalSkeletonExpansionBatchNineDesigns } from "./osteologicalSkeletonExpansionBatchNine";
import { nearEasternMythicCreatureExpansionBatchSixDesigns } from "./nearEasternMythicCreatureExpansionBatchSix";
import { aquaticExpansionBatchThirteenDesigns } from "./aquaticExpansionBatchThirteen";
import { landAnimalExpansionBatchTwentyDesigns } from "./landAnimalExpansionBatchTwenty";
import { erosionalReliefExpansionBatchOneDesigns } from "./erosionalReliefExpansionBatchOne";
import { birdExpansionBatchFifteenDesigns } from "./birdExpansionBatchFifteen";
import { woodyExpansionBatchNineDesigns } from "./woodyExpansionBatchNine";
import { mythicCreatureExpansionBatchSixDesigns } from "./mythicCreatureExpansionBatchSix";
import { osteologicalSkeletonExpansionBatchTenDesigns } from "./osteologicalSkeletonExpansionBatchTen";
import { ichnofossilExpansionBatchOneDesigns } from "./ichnofossilExpansionBatchOne";
import { aquaticExpansionBatchTwelveDesigns } from "./aquaticExpansionBatchTwelve";
import { herbaceousExpansionBatchTenDesigns } from "./herbaceousExpansionBatchTen";
import { ichnofossilExpansionBatchTwoDesigns } from "./ichnofossilExpansionBatchTwo";
import { ichnofossilExpansionBatchThreeDesigns } from "./ichnofossilExpansionBatchThree";
import { birdExpansionBatchSixteenDesigns } from "./birdExpansionBatchSixteen";
import { mythicCreatureExpansionBatchSevenDesigns } from "./mythicCreatureExpansionBatchSeven";
import { landAnimalExpansionBatchTwentyOneDesigns } from "./landAnimalExpansionBatchTwentyOne";
import { woodyExpansionBatchTenDesigns } from "./woodyExpansionBatchTen";
import { aquaticExpansionBatchFourteenDesigns } from "./aquaticExpansionBatchFourteen";
import { birdExpansionBatchSeventeenDesigns } from "./birdExpansionBatchSeventeen";
import { osteologicalSkeletonExpansionBatchElevenDesigns } from "./osteologicalSkeletonExpansionBatchEleven";
import { landAnimalExpansionBatchTwentyTwoDesigns } from "./landAnimalExpansionBatchTwentyTwo";
import { herbaceousExpansionBatchElevenDesigns } from "./herbaceousExpansionBatchEleven";
import { mythicCreatureExpansionBatchEightDesigns } from "./mythicCreatureExpansionBatchEight";
import { ichnofossilExpansionBatchFourDesigns } from "./ichnofossilExpansionBatchFour";
import { osteologicalSkeletonExpansionBatchTwelveDesigns } from "./osteologicalSkeletonExpansionBatchTwelve";
import { woodyExpansionBatchElevenDesigns } from "./woodyExpansionBatchEleven";
import { landAnimalExpansionBatchTwentyThreeDesigns } from "./landAnimalExpansionBatchTwentyThree";
import { birdExpansionBatchEighteenDesigns } from "./birdExpansionBatchEighteen";
import { ichnofossilExpansionBatchFiveDesigns } from "./ichnofossilExpansionBatchFive";
import { osteologicalSkeletonExpansionBatchThirteenDesigns } from "./osteologicalSkeletonExpansionBatchThirteen";
import { aquaticExpansionBatchTwelveMoreDesigns } from "./aquaticExpansionBatchTwelveMore";
import { landAnimalExpansionBatchTwentyFourDesigns } from "./landAnimalExpansionBatchTwentyFour";
import { aquaticExpansionBatchFifteenDesigns } from "./aquaticExpansionBatchFifteen";
import { herbaceousExpansionBatchTwelveDesigns } from "./herbaceousExpansionBatchTwelve";
import { coastalAeolianLandformExpansionBatchOneDesigns } from "./coastalAeolianLandformExpansionBatchOne";
import { landAnimalExpansionBatchTwentyFiveDesigns } from "./landAnimalExpansionBatchTwentyFive";
import { largeAncientMammalExpansionBatchOneDesigns } from "./largeAncientMammalExpansionBatchOne";
import { woodyExpansionBatchTwelveDesigns } from "./woodyExpansionBatchTwelve";
import { osteologicalSkeletonExpansionBatchFourteenDesigns } from "./osteologicalSkeletonExpansionBatchFourteen";
import { aquaticExpansionBatchSixteenDesigns } from "./aquaticExpansionBatchSixteen";
import { landAnimalExpansionBatchTwentySixDesigns } from "./landAnimalExpansionBatchTwentySix";
import { largeAncientMammalExpansionBatchTwoDesigns } from "./largeAncientMammalExpansionBatchTwo";
import { osteologicalSkeletonExpansionBatchFifteenDesigns } from "./osteologicalSkeletonExpansionBatchFifteen";
import { landAnimalExpansionBatchTwentySevenDesigns } from "./landAnimalExpansionBatchTwentySeven";
import { glacialIcefallExpansionBatchOneDesigns } from "./glacialIcefallExpansionBatchOne";
import { aquaticExpansionBatchTwelveAncientDesigns } from "./aquaticExpansionBatchTwelveAncient";
import { coastalAeolianLandformExpansionBatchTwoDesigns } from "./coastalAeolianLandformExpansionBatchTwo";
import { herbaceousExpansionBatchThirteenDesigns } from "./herbaceousExpansionBatchThirteen";
import { largeAncientMammalExpansionBatchThreeDesigns } from "./largeAncientMammalExpansionBatchThree";
import { landAnimalExpansionBatchTwentyEightDesigns } from "./landAnimalExpansionBatchTwentyEight";
import { osteologicalSkeletonExpansionBatchSixteenDesigns } from "./osteologicalSkeletonExpansionBatchSixteen";
import { woodyExpansionBatchThirteenDesigns } from "./woodyExpansionBatchThirteen";
import { coastalAeolianLandformExpansionBatchThreeDesigns } from "./coastalAeolianLandformExpansionBatchThree";
import { largeAncientMammalExpansionBatchFourDesigns } from "./largeAncientMammalExpansionBatchFour";
import { landAnimalExpansionBatchTwentyNineDesigns } from "./landAnimalExpansionBatchTwentyNine";
import { seabedTectonicLandformExpansionBatchOneDesigns } from "./seabedTectonicLandformExpansionBatchOne";
import { herbaceousExpansionBatchFourteenDesigns } from "./herbaceousExpansionBatchFourteen";
import { osteologicalSkeletonExpansionBatchSeventeenDesigns } from "./osteologicalSkeletonExpansionBatchSeventeen";
import { submarineSedimentaryLandformExpansionBatchOneDesigns } from "./submarineSedimentaryLandformExpansionBatchOne";
import { landAnimalExpansionBatchThirtyDesigns } from "./landAnimalExpansionBatchThirty";
import { woodyExpansionBatchFourteenDesigns } from "./woodyExpansionBatchFourteen";

const masterDesigns = [
  ...produceDesigns,
  ...geologyDesigns,
  ...floraDesigns,
  ...animalDesigns,
  ...marineDesigns,
  ...foodDesigns,
  ...extraFloraDesigns,
  ...invertebrateDesigns,
  ...vertebrateDesigns,
  ...formationDesigns,
  ...naturalOrganDesigns,
  ...fungiDesigns,
  ...skeletonPartDesigns,
  ...wildFlowerDesigns,
  ...oceanFormDesigns,
  ...seedFormDesigns,
  ...prehistoricDesigns,
  ...treeDesigns,
  ...nestDesigns,
  ...birdDesigns,
  ...coastalAnimalDesigns,
  ...bakedFoodDesigns,
  ...earlyLifeDesigns,
  ...aquaticPlantDesigns,
  ...mineralFormDesigns,
  ...fishFormDesigns,
  ...ediblePlantDesigns,
  ...mammalFormDesigns,
  ...specialFlowerDesigns,
  ...showcasePlantDesigns,
  ...insectFormDesigns,
  ...shapedFoodDesigns,
  ...fieldFaunaDesigns,
  ...softOrganDesigns,
  ...succulentFormDesigns,
  ...softSeaLifeDesigns,
  ...gardenCropDesigns,
  ...botanicalFormDesigns,
  ...extinctFormDesigns,
  ...skullElementDesigns,
  ...arthropodFormDesigns,
  ...functionalFishDesigns,
  ...woodyFormDesigns,
  ...botanicalRarityDesigns,
  ...functionalPlantDesigns,
  ...shoreFormDesigns,
  ...cambrianFormDesigns,
  ...comparativeOrganDesigns,
  ...algalFormDesigns,
  ...orchidFormDesigns,
  ...ornamentalPlantDesigns,
  ...distinctMammalDesigns,
  ...avianFormDesigns,
  ...bractedPlantDesigns,
  ...gardenPerennialDesigns,
  ...floralShrubDesigns,
  ...evergreenFormDesigns,
  ...foliageFormDesigns,
  ...springShrubDesigns,
  ...floralHerbDesigns,
  ...meadowHerbDesigns,
  ...carnivoreFormDesigns,
  ...arborealMammalDesigns,
  ...groundMammalDesigns,
  ...toothedWhaleDesigns,
  ...fragrantShrubDesigns,
  ...fieldFlowerDesigns,
  ...economicPlantDesigns,
  ...fruitOrganDesigns,
  ...hymeniumFungusDesigns,
  ...shelledFungusDesigns,
  ...cupFungusDesigns,
  ...clusteredFungusDesigns,
  ...scaledReptileDesigns,
  ...amphibianBodyDesigns,
  ...specialTurtleDesigns,
  ...specialSnakeDesigns,
  ...bivalveArchitectureDesigns,
  ...pelagicCephalopodDesigns,
  ...armoredSeaLifeDesigns,
  ...decapodSpecialistDesigns,
  ...caveStructureDesigns,
  ...erosionFormDesigns,
  ...landformShellDesigns,
  ...landAnimalExpansionBatchOneDesigns,
  ...woodyExpansionBatchOneDesigns,
  ...birdExpansionBatchOneDesigns,
  ...aquaticExpansionBatchOneDesigns,
  ...landAnimalExpansionBatchTwoDesigns,
  ...herbaceousExpansionBatchOneDesigns,
  ...invertebrateExpansionBatchOneDesigns,
  ...birdExpansionBatchTwoDesigns,
  ...woodyExpansionBatchTwoDesigns,
  ...aquaticExpansionBatchTwoDesigns,
  ...landAnimalExpansionBatchThreeDesigns,
  ...reefExpansionBatchOneDesigns,
  ...fluvialGlacialLandformDesigns,
  ...birdExpansionBatchThreeDesigns,
  ...giantArthropodExpansionBatchOneDesigns,
  ...aquaticExpansionBatchThreeDesigns,
  ...landAnimalExpansionBatchFourDesigns,
  ...reefExpansionBatchTwoDesigns,
  ...herbaceousExpansionBatchTwoDesigns,
  ...woodyExpansionBatchThreeDesigns,
  ...birdExpansionBatchFourDesigns,
  ...reefExpansionBatchThreeDesigns,
  ...aquaticExpansionBatchFourDesigns,
  ...herbaceousExpansionBatchThreeDesigns,
  ...geologicStructureExpansionBatchOneDesigns,
  ...birdExpansionBatchFiveDesigns,
  ...landAnimalExpansionBatchFiveDesigns,
  ...landAnimalExpansionBatchSixDesigns,
  ...aquaticExpansionBatchFiveDesigns,
  ...geologicStructureExpansionBatchTwoDesigns,
  ...birdExpansionBatchSixDesigns,
  ...herbaceousExpansionBatchFourDesigns,
  ...geologicStructureExpansionBatchThreeDesigns,
  ...landAnimalExpansionBatchSevenDesigns,
  ...landAnimalExpansionBatchEightDesigns,
  ...woodyExpansionBatchFourDesigns,
  ...osteologicalSkeletonExpansionBatchOneDesigns,
  ...osteologicalSkeletonExpansionBatchTwoDesigns,
  ...birdExpansionBatchSevenDesigns,
  ...geologicStructureExpansionBatchFourDesigns,
  ...landAnimalExpansionBatchNineDesigns,
  ...aquaticExpansionBatchSixDesigns,
  ...herbaceousExpansionBatchFiveDesigns,
  ...landAnimalExpansionBatchTenDesigns,
  ...geologicStructureExpansionBatchFiveDesigns,
  ...birdExpansionBatchEightDesigns,
  ...woodyExpansionBatchFiveDesigns,
  ...aquaticExpansionBatchSevenDesigns,
  ...geologicStructureExpansionBatchSixDesigns,
  ...herbaceousExpansionBatchSixDesigns,
  ...osteologicalSkeletonExpansionBatchThreeDesigns,
  ...osteologicalSkeletonExpansionBatchFourDesigns,
  ...landAnimalExpansionBatchElevenDesigns,
  ...landAnimalExpansionBatchTwelveDesigns,
  ...mythicCreatureExpansionBatchOneDesigns,
  ...birdExpansionBatchNineDesigns,
  ...aquaticExpansionBatchEightDesigns,
  ...woodyExpansionBatchSixDesigns,
  ...landAnimalExpansionBatchThirteenDesigns,
  ...birdExpansionBatchTenDesigns,
  ...landAnimalExpansionBatchFourteenDesigns,
  ...osteologicalSkeletonExpansionBatchFiveDesigns,
  ...mythicCreatureExpansionBatchTwoDesigns,
  ...herbaceousExpansionBatchSevenDesigns,
  ...nearEasternMythicCreatureExpansionBatchOneDesigns,
  ...aquaticExpansionBatchNineDesigns,
  ...landAnimalExpansionBatchFifteenDesigns,
  ...birdExpansionBatchElevenDesigns,
  ...nearEasternMythicCreatureExpansionBatchTwoDesigns,
  ...osteologicalSkeletonExpansionBatchSixDesigns,
  ...landAnimalExpansionBatchSixteenDesigns,
  ...aquaticExpansionBatchTenDesigns,
  ...woodyExpansionBatchSevenDesigns,
  ...mythicCreatureExpansionBatchThreeDesigns,
  ...herbaceousExpansionBatchEightDesigns,
  ...nearEasternMythicCreatureExpansionBatchThreeDesigns,
  ...birdExpansionBatchTwelveDesigns,
  ...landAnimalExpansionBatchSeventeenDesigns,
  ...fluvialReliefExpansionBatchOneDesigns,
  ...osteologicalSkeletonExpansionBatchSevenDesigns,
  ...mythicCreatureExpansionBatchFourDesigns,
  ...birdExpansionBatchThirteenDesigns,
  ...nearEasternMythicCreatureExpansionBatchFourDesigns,
  ...landAnimalExpansionBatchEighteenDesigns,
  ...aquaticExpansionBatchElevenDesigns,
  ...osteologicalSkeletonExpansionBatchEightDesigns,
  ...woodyExpansionBatchEightDesigns,
  ...mythicCreatureExpansionBatchFiveDesigns,
  ...nearEasternMythicCreatureExpansionBatchFiveDesigns,
  ...birdExpansionBatchFourteenDesigns,
  ...landAnimalExpansionBatchNineteenDesigns,
  ...herbaceousExpansionBatchNineDesigns,
  ...osteologicalSkeletonExpansionBatchNineDesigns,
  ...nearEasternMythicCreatureExpansionBatchSixDesigns,
  ...aquaticExpansionBatchThirteenDesigns,
  ...landAnimalExpansionBatchTwentyDesigns,
  ...erosionalReliefExpansionBatchOneDesigns,
  ...birdExpansionBatchFifteenDesigns,
  ...woodyExpansionBatchNineDesigns,
  ...mythicCreatureExpansionBatchSixDesigns,
  ...osteologicalSkeletonExpansionBatchTenDesigns,
  ...ichnofossilExpansionBatchOneDesigns,
  ...aquaticExpansionBatchTwelveDesigns,
  ...herbaceousExpansionBatchTenDesigns,
  ...ichnofossilExpansionBatchTwoDesigns,
  ...ichnofossilExpansionBatchThreeDesigns,
  ...birdExpansionBatchSixteenDesigns,
  ...mythicCreatureExpansionBatchSevenDesigns,
  ...landAnimalExpansionBatchTwentyOneDesigns,
  ...woodyExpansionBatchTenDesigns,
  ...aquaticExpansionBatchFourteenDesigns,
  ...birdExpansionBatchSeventeenDesigns,
  ...osteologicalSkeletonExpansionBatchElevenDesigns,
  ...landAnimalExpansionBatchTwentyTwoDesigns,
  ...herbaceousExpansionBatchElevenDesigns,
  ...mythicCreatureExpansionBatchEightDesigns,
  ...ichnofossilExpansionBatchFourDesigns,
  ...osteologicalSkeletonExpansionBatchTwelveDesigns,
  ...woodyExpansionBatchElevenDesigns,
  ...landAnimalExpansionBatchTwentyThreeDesigns,
  ...birdExpansionBatchEighteenDesigns,
  ...ichnofossilExpansionBatchFiveDesigns,
  ...osteologicalSkeletonExpansionBatchThirteenDesigns,
  ...aquaticExpansionBatchTwelveMoreDesigns,
  ...landAnimalExpansionBatchTwentyFourDesigns,
  ...aquaticExpansionBatchFifteenDesigns,
  ...herbaceousExpansionBatchTwelveDesigns,
  ...coastalAeolianLandformExpansionBatchOneDesigns,
  ...landAnimalExpansionBatchTwentyFiveDesigns,
  ...largeAncientMammalExpansionBatchOneDesigns,
  ...woodyExpansionBatchTwelveDesigns,
  ...osteologicalSkeletonExpansionBatchFourteenDesigns,
  ...aquaticExpansionBatchSixteenDesigns,
  ...landAnimalExpansionBatchTwentySixDesigns,
  ...largeAncientMammalExpansionBatchTwoDesigns,
  ...osteologicalSkeletonExpansionBatchFifteenDesigns,
  ...landAnimalExpansionBatchTwentySevenDesigns,
  ...glacialIcefallExpansionBatchOneDesigns,
  ...aquaticExpansionBatchTwelveAncientDesigns,
  ...coastalAeolianLandformExpansionBatchTwoDesigns,
  ...herbaceousExpansionBatchThirteenDesigns,
  ...largeAncientMammalExpansionBatchThreeDesigns,
  ...landAnimalExpansionBatchTwentyEightDesigns,
  ...osteologicalSkeletonExpansionBatchSixteenDesigns,
  ...woodyExpansionBatchThirteenDesigns,
  ...coastalAeolianLandformExpansionBatchThreeDesigns,
  ...largeAncientMammalExpansionBatchFourDesigns,
  ...landAnimalExpansionBatchTwentyNineDesigns,
  ...seabedTectonicLandformExpansionBatchOneDesigns,
  ...herbaceousExpansionBatchFourteenDesigns,
  ...osteologicalSkeletonExpansionBatchSeventeenDesigns,
  ...submarineSedimentaryLandformExpansionBatchOneDesigns,
  ...landAnimalExpansionBatchThirtyDesigns,
  ...woodyExpansionBatchFourteenDesigns,
  ...chineseBeastDesigns,
  ...worldBeastDesigns,
];

export const masterNatureAssets: SceneAsset[] = masterDesigns.map((entry, design) => ({
  id: `masterNature${entry.key[0]!.toUpperCase()}${entry.key.slice(1)}`,
  name: entry.name,
  category: entry.itemType === "食品" ? "道具" : "自然",
  itemType: entry.itemType,
  ...(entry.theme ? { theme: entry.theme } : {}),
  state: "原始",
  tags: ["原创自然原型", ...entry.tags],
  kind: "model",
  normalize: false,
  license: "内置原创程序化模型",
  blueprint: { pack: "masterNature", design, revision: 1 },
}));

export function createMasterNatureModel(design: number): ModelDefinition {
  if (!Number.isInteger(design) || design < 0 || design >= masterDesigns.length) throw new Error("自然主素材设计编号无效");
  const entry = masterDesigns[design]!;
  return { name: entry.name, parts: groundParts(entry.build()) };
}
