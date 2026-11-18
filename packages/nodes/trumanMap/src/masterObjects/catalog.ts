import type { AssetItemType, AssetTheme, SceneAsset } from "../sceneDocument";
import type { ModelDefinition } from "../modelGeometry";
import { finishMasterObject, type MasterPrototype } from "./parts";
import { folkDeityChinaObjects } from "./folkDeitiesChina";
import { folkUnderworldObjects } from "./folkUnderworld";
import { folkSculptureWorldObjects } from "./folkSculptureWorld";
import { cookingObjects } from "./cooking";
import { tablewareObjects } from "./tableware";
import { livingObjects } from "./living";
import { medicalObjects } from "./medical";
import { craftObjects } from "./craft";
import { musicObjects } from "./music";
import { electronicObjects } from "./electronics";
import { sportObjects } from "./sports";
import { opticalObjects } from "./optical";
import { professionalObjects } from "./professional";
import { woodworkingObjects } from "./woodworking";
import { metalworkingObjects } from "./metalworking";
import { textileObjects } from "./textile";
import { imagingCraftObjects } from "./imagingCraft";
import { foodProcessingObjects } from "./foodProcessing";
import { gardeningObjects } from "./gardening";
import { cleaningMaintenanceObjects } from "./cleaningMaintenance";
import { analysisLabObjects } from "./analysisLab";
import { specialtyMedicalObjects } from "./specialtyMedical";
import { rescueEquipmentObjects } from "./rescueEquipment";
import { teachingOfficeObjects } from "./teachingOffice";
import { precisionMachinesObjects } from "./precisionMachines";
import { personalCareObjects } from "./personalCare";
import { homeAccessoriesObjects } from "./homeAccessories";
import { travelGearObjects } from "./travelGear";
import { worldMusicObjects } from "./worldMusic";
import { soundEngineeringObjects } from "./soundEngineering";
import { computerDevicesObjects } from "./computerDevices";
import { kitchenHandToolObjects } from "./kitchenHandTools";
import { gameToyObjects } from "./gamesToys";
import { fieldEquipmentObjects } from "./fieldEquipment";
import { sportsApparatusObjects } from "./sportsApparatus";
import { officeStationeryObjects } from "./officeStationery";
import { protectiveEquipmentObjects } from "./protectiveEquipment";
import { photoOpticsObjects } from "./photoOptics";
import { physicsDemonstratorObjects } from "./physicsDemonstrators";
import { foodServiceObjects } from "./foodService";
import { electronicRepairObjects } from "./electronicRepair";
import { informationDeviceObjects } from "./informationDevices";
import { historicalDailyObjects } from "./historicalDaily";
import { clothingAccessoryObjects } from "./clothingAccessories";
import { fantasyRelicObjects } from "./fantasyRelics";
import { domesticLivingObjects } from "./domesticLiving";
import { clinicalMechanismObjects } from "./clinicalMechanisms";
import { draftingDeviceObjects } from "./draftingDevices";
import { historicalArmObjects } from "./historicalArms";
import { percussionDeviceObjects } from "./percussionDevices";
import { ruralToolObjects } from "./ruralTools";
import { mechanicalToyObjects } from "./mechanicalToys";
import { culturalCraftObjects } from "./culturalCraft";
import { chineseCraftObjects } from "./chineseCraft";
import { heritageDeviceObjects } from "./heritageDevices";
import { analogMechanismObjects } from "./analogMechanisms";
import { futureInstrumentObjects } from "./futureInstruments";
import { urbanInterfaceObjects } from "./urbanInterfaces";
import { salvageToolObjects } from "./salvageTools";
import { mythicPropObjects } from "./mythicProps";
import { japaneseDailyObjects } from "./japaneseDaily";
import { globalCraftObjects } from "./globalCraft";
import { mechanismPartObjects } from "./mechanismParts";
import { trainingGearObjects } from "./trainingGear";
import { precisionSensorObjects } from "./precisionSensors";
import { cyberElectronicObjects } from "./cyberElectronics";
import { reconstructionToolObjects } from "./reconstructionTools";
import { kitchenSystemObjects } from "./kitchenSystems";
import { culturalWearObjects } from "./culturalWear";
import { acousticInstrumentObjects } from "./acousticInstruments";
import { domesticCareObjects } from "./domesticCare";
import { chineseDailyFormObjects } from "./chineseDailyForms";
import { microAnalysisObjects } from "./microAnalysis";
import { playMechanismObjects } from "./playMechanisms";
import { heritageMechanicObjects } from "./heritageMechanics";
import { japaneseMechanismObjects } from "./japaneseMechanisms";
import { advancedInstrumentObjects } from "./advancedInstruments";
import { domesticStructureObjects } from "./domesticStructures";
import { historicInformationObjects } from "./historicInformation";
import { worldObjectFormObjects } from "./worldObjectForms";
import { offGridLivingObjects } from "./offGridLiving";
import { clinicalComponentObjects } from "./clinicalComponents";
import { surgicalToolObjects } from "./surgicalTools";
import { culturalFurnishingObjects } from "./culturalFurnishings";
import { marineEquipmentObjects } from "./marineEquipment";
import { lightingFormObjects } from "./lightingForms";
import { livingFurnitureObjects } from "./livingFurniture";
import { furnitureExpansionBatchOneObjects } from "./furnitureExpansionBatchOne";
import { garmentExpansionBatchOneObjects } from "./garmentExpansionBatchOne";
import { sportExpansionBatchOneObjects } from "./sportExpansionBatchOne";
import { domesticExpansionBatchOneObjects } from "./domesticExpansionBatchOne";
import { electronicExpansionBatchOneObjects } from "./electronicExpansionBatchOne";
import { playExpansionBatchOneObjects } from "./playExpansionBatchOne";
import { heritageFurnitureBatchOneObjects } from "./heritageFurnitureBatchOne";
import { musicExpansionBatchOneObjects } from "./musicExpansionBatchOne";
import { culinaryExpansionBatchOneObjects } from "./culinaryExpansionBatchOne";
import { furnitureExpansionBatchTwoObjects } from "./furnitureExpansionBatchTwo";
import { sportExpansionBatchTwoObjects } from "./sportExpansionBatchTwo";
import { domesticExpansionBatchTwoObjects } from "./domesticExpansionBatchTwo";
import { culinaryExpansionBatchTwoObjects } from "./culinaryExpansionBatchTwo";
import { stageTextileExpansionBatchOneObjects } from "./stageTextileExpansionBatchOne";
import { furnitureExpansionBatchThreeObjects } from "./furnitureExpansionBatchThree";
import { electronicExpansionBatchTwoObjects } from "./electronicExpansionBatchTwo";
import { heritageFurnitureBatchTwoObjects } from "./heritageFurnitureBatchTwo";
import { sportExpansionBatchThreeObjects } from "./sportExpansionBatchThree";
import { playExpansionBatchTwoObjects } from "./playExpansionBatchTwo";
import { furnitureExpansionBatchFourObjects } from "./furnitureExpansionBatchFour";
import { musicExpansionBatchTwoObjects } from "./musicExpansionBatchTwo";
import { stageTextileExpansionBatchTwoObjects } from "./stageTextileExpansionBatchTwo";
import { domesticExpansionBatchThreeObjects } from "./domesticExpansionBatchThree";
import { culinaryExpansionBatchThreeObjects } from "./culinaryExpansionBatchThree";
import { electronicExpansionBatchThreeObjects } from "./electronicExpansionBatchThree";
import { furnitureExpansionBatchFiveObjects } from "./furnitureExpansionBatchFive";
import { domesticExpansionBatchFourObjects } from "./domesticExpansionBatchFour";
import { stageTextileExpansionBatchThreeObjects } from "./stageTextileExpansionBatchThree";
import { playExpansionBatchThreeObjects } from "./playExpansionBatchThree";
import { culinaryExpansionBatchFourObjects } from "./culinaryExpansionBatchFour";
import { musicExpansionBatchThreeObjects } from "./musicExpansionBatchThree";
import { husbandryEquipmentBatchOneObjects } from "./husbandryEquipmentBatchOne";
import { furnitureExpansionBatchSixObjects } from "./furnitureExpansionBatchSix";
import { heritageFurnitureBatchThreeObjects } from "./heritageFurnitureBatchThree";
import { culinaryExpansionBatchFiveObjects } from "./culinaryExpansionBatchFive";
import { electronicExpansionBatchFourObjects } from "./electronicExpansionBatchFour";
import { stageTextileExpansionBatchFourObjects } from "./stageTextileExpansionBatchFour";
import { domesticExpansionBatchFiveObjects } from "./domesticExpansionBatchFive";
import { furnitureExpansionBatchSevenObjects } from "./furnitureExpansionBatchSeven";
import { playExpansionBatchFourObjects } from "./playExpansionBatchFour";
import { electronicExpansionBatchFiveObjects } from "./electronicExpansionBatchFive";
import { musicExpansionBatchFourObjects } from "./musicExpansionBatchFour";
import { garmentExpansionBatchTwoObjects } from "./garmentExpansionBatchTwo";
import { logisticsEquipmentBatchOneObjects } from "./logisticsEquipmentBatchOne";
import { domesticExpansionBatchSixObjects } from "./domesticExpansionBatchSix";
import { husbandryEquipmentBatchTwoObjects } from "./husbandryEquipmentBatchTwo";
import { furnitureExpansionBatchEightObjects } from "./furnitureExpansionBatchEight";
import { heritageFurnitureBatchFourObjects } from "./heritageFurnitureBatchFour";
import { logisticsEquipmentBatchTwoObjects } from "./logisticsEquipmentBatchTwo";
import { electronicExpansionBatchSixObjects } from "./electronicExpansionBatchSix";
import { garmentExpansionBatchThreeObjects } from "./garmentExpansionBatchThree";
import { domesticExpansionBatchSevenObjects } from "./domesticExpansionBatchSeven";
import { horticultureEquipmentBatchOneObjects } from "./horticultureEquipmentBatchOne";
import { furnitureExpansionBatchNineObjects } from "./furnitureExpansionBatchNine";
import { electronicExpansionBatchSevenObjects } from "./electronicExpansionBatchSeven";
import { stageTextileExpansionBatchFiveObjects } from "./stageTextileExpansionBatchFive";
import { musicExpansionBatchFiveObjects } from "./musicExpansionBatchFive";
import { domesticExpansionBatchEightObjects } from "./domesticExpansionBatchEight";
import { logisticsEquipmentBatchThreeObjects } from "./logisticsEquipmentBatchThree";
import { heritageFurnitureBatchFiveObjects } from "./heritageFurnitureBatchFive";
import { nonMetalManufacturingBatchOneObjects } from "./nonMetalManufacturingBatchOne";
import { electronicExpansionBatchEightObjects } from "./electronicExpansionBatchEight";
import { domesticExpansionBatchNineObjects } from "./domesticExpansionBatchNine";
import { furnitureExpansionBatchTenObjects } from "./furnitureExpansionBatchTen";
import { heritageFurnitureBatchSixObjects } from "./heritageFurnitureBatchSix";
import { electronicExpansionBatchNineObjects } from "./electronicExpansionBatchNine";
import { nonMetalManufacturingBatchTwoObjects } from "./nonMetalManufacturingBatchTwo";
import { furnitureExpansionBatchElevenObjects } from "./furnitureExpansionBatchEleven";
import { heritageFurnitureBatchSevenObjects } from "./heritageFurnitureBatchSeven";
import { forestryEquipmentBatchOneObjects } from "./forestryEquipmentBatchOne";
import { domesticExpansionBatchTenObjects } from "./domesticExpansionBatchTen";
import { stageTextileExpansionBatchSixObjects } from "./stageTextileExpansionBatchSix";
import { electronicExpansionBatchTenObjects } from "./electronicExpansionBatchTen";
import { furnitureExpansionBatchTwelveObjects } from "./furnitureExpansionBatchTwelve";
import { restaurantEquipmentBatchOneObjects } from "./restaurantEquipmentBatchOne";
import { electronicExpansionBatchElevenObjects } from "./electronicExpansionBatchEleven";
import { furnitureExpansionBatchThirteenObjects } from "./furnitureExpansionBatchThirteen";
import { domesticExpansionBatchElevenObjects } from "./domesticExpansionBatchEleven";
import { electronicExpansionBatchTwelveObjects } from "./electronicExpansionBatchTwelve";
import { stageTextileExpansionBatchSevenObjects } from "./stageTextileExpansionBatchSeven";
import { furnitureExpansionBatchFourteenObjects } from "./furnitureExpansionBatchFourteen";

const groups: { items: MasterPrototype[]; itemType: AssetItemType; theme?: AssetTheme }[] = [
  { items: cookingObjects, itemType: "器物" }, { items: tablewareObjects, itemType: "器物" },
  { items: livingObjects, itemType: "器物" }, { items: medicalObjects, itemType: "设施", theme: "现代" },
  { items: craftObjects, itemType: "器物" }, { items: musicObjects, itemType: "乐器" },
  { items: electronicObjects, itemType: "电子设备", theme: "现代" }, { items: sportObjects, itemType: "运动用品", theme: "现代" },
  { items: opticalObjects, itemType: "设施", theme: "现代" }, { items: professionalObjects, itemType: "设施", theme: "现代" },
  { items: woodworkingObjects, itemType: "器物" }, { items: metalworkingObjects, itemType: "器物", theme: "现代" },
  { items: textileObjects, itemType: "器物" }, { items: imagingCraftObjects, itemType: "器物", theme: "现代" },
  { items: foodProcessingObjects, itemType: "器物", theme: "现代" }, { items: gardeningObjects, itemType: "器物", theme: "现代" },
  { items: cleaningMaintenanceObjects, itemType: "器物", theme: "现代" }, { items: analysisLabObjects, itemType: "设施", theme: "现代" },
  { items: specialtyMedicalObjects, itemType: "设施", theme: "现代" }, { items: rescueEquipmentObjects, itemType: "器物", theme: "现代" },
  { items: teachingOfficeObjects, itemType: "器物" }, { items: precisionMachinesObjects, itemType: "设施", theme: "现代" },
  { items: personalCareObjects, itemType: "器物", theme: "现代" }, { items: homeAccessoriesObjects, itemType: "器物", theme: "现代" },
  { items: travelGearObjects, itemType: "器物", theme: "现代" }, { items: worldMusicObjects, itemType: "乐器" },
  { items: soundEngineeringObjects, itemType: "电子设备", theme: "现代" }, { items: computerDevicesObjects, itemType: "电子设备", theme: "现代" },
  { items: kitchenHandToolObjects, itemType: "器物", theme: "现代" }, { items: gameToyObjects, itemType: "器物", theme: "现代" },
  { items: fieldEquipmentObjects, itemType: "设施", theme: "现代" }, { items: sportsApparatusObjects, itemType: "运动用品", theme: "现代" },
  { items: officeStationeryObjects, itemType: "器物", theme: "现代" },
  { items: protectiveEquipmentObjects, itemType: "器物", theme: "现代" },
  { items: photoOpticsObjects, itemType: "器物", theme: "现代" },
  { items: physicsDemonstratorObjects, itemType: "设施", theme: "现代" }, { items: foodServiceObjects, itemType: "器物", theme: "现代" },
  { items: electronicRepairObjects, itemType: "电子设备", theme: "现代" }, { items: informationDeviceObjects, itemType: "器物" },
  { items: historicalDailyObjects, itemType: "器物", theme: "中式" }, { items: clothingAccessoryObjects, itemType: "服饰", theme: "现代" },
  { items: fantasyRelicObjects, itemType: "器物", theme: "奇幻" },
  { items: domesticLivingObjects, itemType: "器物", theme: "现代" },
  { items: clinicalMechanismObjects, itemType: "设施", theme: "现代" },
  { items: draftingDeviceObjects, itemType: "器物", theme: "现代" },
  { items: historicalArmObjects, itemType: "器物" },
  { items: percussionDeviceObjects, itemType: "乐器" },
  { items: ruralToolObjects, itemType: "器物", theme: "现代" },
  { items: mechanicalToyObjects, itemType: "器物", theme: "现代" },
  { items: culturalCraftObjects, itemType: "器物" },
  { items: chineseCraftObjects, itemType: "器物", theme: "中式" },
  { items: heritageDeviceObjects, itemType: "器物" },
  { items: analogMechanismObjects, itemType: "器物", theme: "蒸汽朋克" },
  { items: futureInstrumentObjects, itemType: "电子设备", theme: "科幻" },
  { items: urbanInterfaceObjects, itemType: "电子设备", theme: "赛博朋克" },
  { items: salvageToolObjects, itemType: "器物", theme: "废土" },
  { items: mythicPropObjects, itemType: "器物", theme: "奇幻" },
  { items: japaneseDailyObjects, itemType: "器物", theme: "日式" },
  { items: globalCraftObjects, itemType: "器物" },
  { items: mechanismPartObjects, itemType: "构件", theme: "蒸汽朋克" },
  { items: trainingGearObjects, itemType: "运动用品", theme: "现代" },
  { items: precisionSensorObjects, itemType: "设施", theme: "科幻" },
  { items: cyberElectronicObjects, itemType: "电子设备", theme: "赛博朋克" },
  { items: reconstructionToolObjects, itemType: "器物", theme: "废土" },
  { items: kitchenSystemObjects, itemType: "器物", theme: "欧式" },
  { items: culturalWearObjects, itemType: "服饰" },
  { items: acousticInstrumentObjects, itemType: "乐器" },
  { items: domesticCareObjects, itemType: "器物", theme: "现代" },
  { items: chineseDailyFormObjects, itemType: "器物", theme: "中式" },
  { items: microAnalysisObjects, itemType: "设施", theme: "科幻" },
  { items: playMechanismObjects, itemType: "器物", theme: "现代" },
  { items: heritageMechanicObjects, itemType: "器物" },
  { items: japaneseMechanismObjects, itemType: "器物", theme: "日式" },
  { items: advancedInstrumentObjects, itemType: "设施", theme: "科幻" },
  { items: domesticStructureObjects, itemType: "器物" },
  { items: historicInformationObjects, itemType: "器物", theme: "蒸汽朋克" },
  { items: worldObjectFormObjects, itemType: "器物", theme: "异域" },
  { items: offGridLivingObjects, itemType: "器物", theme: "废土" },
  { items: clinicalComponentObjects, itemType: "设施", theme: "赛博朋克" },
  { items: surgicalToolObjects, itemType: "器物", theme: "现代" },
  { items: culturalFurnishingObjects, itemType: "器物" },
  { items: marineEquipmentObjects, itemType: "器物", theme: "现代" },
  { items: lightingFormObjects, itemType: "灯具" },
  { items: livingFurnitureObjects, itemType: "家具" },
  { items: furnitureExpansionBatchOneObjects, itemType: "家具" },
  { items: garmentExpansionBatchOneObjects, itemType: "服饰" },
  { items: sportExpansionBatchOneObjects, itemType: "运动用品", theme: "现代" },
  { items: domesticExpansionBatchOneObjects, itemType: "器物", theme: "现代" },
  { items: electronicExpansionBatchOneObjects, itemType: "电子设备", theme: "现代" },
  { items: playExpansionBatchOneObjects, itemType: "器物", theme: "现代" },
  { items: heritageFurnitureBatchOneObjects, itemType: "家具" },
  { items: musicExpansionBatchOneObjects, itemType: "乐器" },
  { items: culinaryExpansionBatchOneObjects, itemType: "器物", theme: "现代" },
  { items: furnitureExpansionBatchTwoObjects, itemType: "家具" },
  { items: sportExpansionBatchTwoObjects, itemType: "运动用品", theme: "现代" },
  { items: domesticExpansionBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: culinaryExpansionBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: stageTextileExpansionBatchOneObjects, itemType: "设施" },
  { items: furnitureExpansionBatchThreeObjects, itemType: "家具" },
  { items: electronicExpansionBatchTwoObjects, itemType: "电子设备", theme: "现代" },
  { items: heritageFurnitureBatchTwoObjects, itemType: "家具" },
  { items: sportExpansionBatchThreeObjects, itemType: "运动用品", theme: "现代" },
  { items: playExpansionBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchFourObjects, itemType: "家具" },
  { items: musicExpansionBatchTwoObjects, itemType: "乐器" },
  { items: stageTextileExpansionBatchTwoObjects, itemType: "设施" },
  { items: domesticExpansionBatchThreeObjects, itemType: "设施", theme: "现代" },
  { items: culinaryExpansionBatchThreeObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchThreeObjects, itemType: "电子设备", theme: "现代" },
  { items: furnitureExpansionBatchFiveObjects, itemType: "家具" },
  { items: domesticExpansionBatchFourObjects, itemType: "设施", theme: "现代" },
  { items: stageTextileExpansionBatchThreeObjects, itemType: "设施" },
  { items: playExpansionBatchThreeObjects, itemType: "设施", theme: "现代" },
  { items: culinaryExpansionBatchFourObjects, itemType: "设施", theme: "现代" },
  { items: musicExpansionBatchThreeObjects, itemType: "乐器" },
  { items: husbandryEquipmentBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchSixObjects, itemType: "家具" },
  { items: heritageFurnitureBatchThreeObjects, itemType: "家具" },
  { items: culinaryExpansionBatchFiveObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchFourObjects, itemType: "电子设备", theme: "现代" },
  { items: stageTextileExpansionBatchFourObjects, itemType: "设施" },
  { items: domesticExpansionBatchFiveObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchSevenObjects, itemType: "家具" },
  { items: playExpansionBatchFourObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchFiveObjects, itemType: "电子设备", theme: "现代" },
  { items: musicExpansionBatchFourObjects, itemType: "乐器" },
  { items: garmentExpansionBatchTwoObjects, itemType: "服饰" },
  { items: logisticsEquipmentBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: domesticExpansionBatchSixObjects, itemType: "设施", theme: "现代" },
  { items: husbandryEquipmentBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchEightObjects, itemType: "家具" },
  { items: heritageFurnitureBatchFourObjects, itemType: "家具" },
  { items: logisticsEquipmentBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchSixObjects, itemType: "电子设备", theme: "现代" },
  { items: garmentExpansionBatchThreeObjects, itemType: "服饰" },
  { items: domesticExpansionBatchSevenObjects, itemType: "设施", theme: "现代" },
  { items: horticultureEquipmentBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchNineObjects, itemType: "家具" },
  { items: electronicExpansionBatchSevenObjects, itemType: "电子设备", theme: "现代" },
  { items: stageTextileExpansionBatchFiveObjects, itemType: "设施" },
  { items: musicExpansionBatchFiveObjects, itemType: "乐器" },
  { items: domesticExpansionBatchEightObjects, itemType: "设施", theme: "现代" },
  { items: logisticsEquipmentBatchThreeObjects, itemType: "设施", theme: "现代" },
  { items: heritageFurnitureBatchFiveObjects, itemType: "家具" },
  { items: nonMetalManufacturingBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchEightObjects, itemType: "电子设备", theme: "现代" },
  { items: domesticExpansionBatchNineObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchTenObjects, itemType: "灯具" },
  { items: heritageFurnitureBatchSixObjects, itemType: "器物" },
  { items: electronicExpansionBatchNineObjects, itemType: "电子设备", theme: "现代" },
  { items: nonMetalManufacturingBatchTwoObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchElevenObjects, itemType: "灯具" },
  { items: heritageFurnitureBatchSevenObjects, itemType: "器物" },
  { items: forestryEquipmentBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: domesticExpansionBatchTenObjects, itemType: "器物", theme: "现代" },
  { items: stageTextileExpansionBatchSixObjects, itemType: "设施" },
  { items: electronicExpansionBatchTenObjects, itemType: "电子设备", theme: "现代" },
  { items: furnitureExpansionBatchTwelveObjects, itemType: "构件", theme: "现代" },
  { items: restaurantEquipmentBatchOneObjects, itemType: "设施", theme: "现代" },
  { items: electronicExpansionBatchElevenObjects, itemType: "电子设备", theme: "现代" },
  { items: furnitureExpansionBatchThirteenObjects, itemType: "家具", theme: "现代" },
  { items: domesticExpansionBatchElevenObjects, itemType: "器物", theme: "现代" },
  { items: electronicExpansionBatchTwelveObjects, itemType: "电子设备", theme: "现代" },
  { items: stageTextileExpansionBatchSevenObjects, itemType: "设施", theme: "现代" },
  { items: furnitureExpansionBatchFourteenObjects, itemType: "家具", theme: "现代" },
  { items: folkDeityChinaObjects, itemType: "器物", theme: "中式" },
  { items: folkUnderworldObjects, itemType: "器物", theme: "中式" },
  { items: folkSculptureWorldObjects.slice(0, 15), itemType: "器物" },
  { items: folkSculptureWorldObjects.slice(15), itemType: "器物", theme: "异域" },
];

for (const group of groups) {
  if (group.items.length < 1 || group.items.length > 25) throw new Error("独立道具原型分组必须包含1至25项");
}

// 已发布首250项保留原顺序；后续完成的独立原型按批追加，只登记元数据。
const batches = [{ start: 0, count: 10 }, { start: 10, count: groups.length - 10 }];
export const masterObjectAssets: SceneAsset[] = batches.flatMap(batch => Array.from({ length: batch.count * 25 }, (_, index): SceneAsset | undefined => {
  const groupIndex = batch.start + index % batch.count, itemIndex = Math.floor(index / batch.count), group = groups[groupIndex]!, design = groupIndex * 25 + itemIndex, item = group.items[itemIndex];
  if (!item) return undefined;
  const theme = item.theme ?? group.theme;
  return { id: `masterObject${String(design).padStart(4, "0")}`, name: item.name, category: "道具", itemType: item.itemType ?? group.itemType, ...(theme ? { theme } : {}), kind: "model", normalize: false, license: "内置原创程序化模型", blueprint: { pack: "masterObjects", design, revision: 1 } };
}).filter((item): item is SceneAsset => item !== undefined));

export function createMasterObjectModel(design: number): ModelDefinition {
  if (!Number.isInteger(design) || design < 0 || design >= groups.length * 25) throw new Error("独立道具原型编号无效");
  const group = groups[Math.floor(design / 25)]!, item = group.items[design % 25];
  if (!item) throw new Error("独立道具原型编号无效");
  return finishMasterObject(item.name, item.build());
}
