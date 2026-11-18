import type { SceneAsset } from "../sceneDocument";
import { finishObjectModel } from "../objectModelParts";
import { cycleModels } from "./cycleModels";
import { railModels } from "./railModels";
import { marineModels } from "./marineModels";
import { aircraftModels } from "./aircraftModels";
import { airportModels } from "./airportModels";
import { utilityModels } from "./utilityModels";
import { spaceModels } from "./spaceModels";
import { farmModels } from "./farmModels";
import { constructionModels } from "./constructionModels";
import { siegeModels } from "./siegeModels";
import { waterSportModels } from "./waterSportModels";
import { serviceModels } from "./serviceModels";
import { advancedAirModels } from "./advancedAirModels";
import { advancedSpaceModels } from "./advancedSpaceModels";
import { merchantModels } from "./merchantModels";
import { leisureModels } from "./leisureModels";
import { historicShipModels } from "./historicShipModels";
import { robotModels } from "./robotModels";
import { specialRailModels } from "./specialRailModels";
import { workShipModels } from "./workShipModels";
import { mobileRobotModels } from "./mobileRobotModels";
import { roadFleetModels } from "./roadFleetModels";
import { specialistMachineModels } from "./specialistMachineModels";
import { travelVehicleModels } from "./travelVehicleModels";
import { rootCropMachineModels } from "./rootCropMachineModels";
import { navalShipModels } from "./navalShipModels";
import { tillageModels } from "./tillageModels";
import { towingMachineModels } from "./towingMachineModels";
import { rotorLayoutModels } from "./rotorLayoutModels";
import { mainlineRailModels } from "./mainlineRailModels";
import { inspectionRobotModels } from "./inspectionRobotModels";
import { dailyMobilityModels } from "./dailyMobilityModels";
import { iceRacingModels } from "./iceRacingModels";
import { linkageWalkerModels } from "./linkageWalkerModels";
import { fieldCareModels } from "./fieldCareModels";
import { experimentalAirModels } from "./experimentalAirModels";
import { divingCapsuleModels } from "./divingCapsuleModels";
import { passengerShipModels } from "./passengerShipModels";
import { offshorePlatformModels } from "./offshorePlatformModels";
import { assistedMobilityModels } from "./assistedMobilityModels";
import { iceSailModels } from "./iceSailModels";
import { subseaWorkModels } from "./subseaWorkModels";
import { miningVehicleModels } from "./miningVehicleModels";
import { compactionToolModels } from "./compactionToolModels";
import { marineEquipmentModels } from "./marineEquipmentModels";
import { liftingAttachmentModels } from "./liftingAttachmentModels";
import { harborFittingModels } from "./harborFittingModels";
import { roadSafetyModels } from "./roadSafetyModels";
import { vehicleWorkshopModels } from "./vehicleWorkshopModels";
import { lightMobilityModels } from "./lightMobilityModels";
import { vehicleComponentModels } from "./vehicleComponentModels";
import { shipControlModels } from "./shipControlModels";
import { emergencyEquipmentModels } from "./emergencyEquipmentModels";
import { forestMachineModels } from "./forestMachineModels";
import { excavatorAttachmentModels } from "./excavatorAttachmentModels";
import { urbanCartModels } from "./urbanCartModels";
import { fieldUtilityModels } from "./fieldUtilityModels";
import { airfieldServiceModels } from "./airfieldServiceModels";
import { aeroEngineModels } from "./aeroEngineModels";
import { smallMarineDriveModels } from "./smallMarineDriveModels";
import { landscapePowerModels } from "./landscapePowerModels";
import { concreteToolModels } from "./concreteToolModels";
import { woodshopPowerModels } from "./woodshopPowerModels";
import { railExpansionBatchOne } from "./railExpansionBatchOne";
import { aerospaceExpansionBatchOne } from "./aerospaceExpansionBatchOne";
import { marineExpansionBatchOne } from "./marineExpansionBatchOne";
import { roadExpansionBatchOne } from "./roadExpansionBatchOne";
import { roadExpansionBatchTwo } from "./roadExpansionBatchTwo";
import { railExpansionBatchTwo } from "./railExpansionBatchTwo";
import { aerospaceExpansionBatchTwo } from "./aerospaceExpansionBatchTwo";
import { roadExpansionBatchThree } from "./roadExpansionBatchThree";
import { marineExpansionBatchTwo } from "./marineExpansionBatchTwo";
import { railExpansionBatchThree } from "./railExpansionBatchThree";
import { roadExpansionBatchFour } from "./roadExpansionBatchFour";
import { marineExpansionBatchThree } from "./marineExpansionBatchThree";
import { aerospaceExpansionBatchThree } from "./aerospaceExpansionBatchThree";
import { roadExpansionBatchFive } from "./roadExpansionBatchFive";
import { roadExpansionBatchSix } from "./roadExpansionBatchSix";
import { roadExpansionBatchSeven } from "./roadExpansionBatchSeven";
import { roadExpansionBatchEight } from "./roadExpansionBatchEight";
import { roadExpansionBatchNine } from "./roadExpansionBatchNine";
import { marineExpansionBatchFour } from "./marineExpansionBatchFour";
import { marineExpansionBatchFive } from "./marineExpansionBatchFive";
import { marineExpansionBatchSix } from "./marineExpansionBatchSix";
import { marineExpansionBatchSeven } from "./marineExpansionBatchSeven";
import { marineExpansionBatchEight } from "./marineExpansionBatchEight";
import { aerospaceExpansionBatchFour } from "./aerospaceExpansionBatchFour";
import { aerospaceExpansionBatchFive } from "./aerospaceExpansionBatchFive";
import { aerospaceExpansionBatchSix } from "./aerospaceExpansionBatchSix";
import { aerospaceExpansionBatchSeven } from "./aerospaceExpansionBatchSeven";
import { railExpansionBatchFour } from "./railExpansionBatchFour";
import { railExpansionBatchFive } from "./railExpansionBatchFive";
import { railExpansionBatchSix } from "./railExpansionBatchSix";
import { railExpansionBatchSeven } from "./railExpansionBatchSeven";
import { roadExpansionBatchTen } from "./roadExpansionBatchTen";
import { roadExpansionBatchEleven } from "./roadExpansionBatchEleven";
import { roadExpansionBatchTwelve } from "./roadExpansionBatchTwelve";
import { roadExpansionBatchThirteen } from "./roadExpansionBatchThirteen";
import { roadExpansionBatchFourteen } from "./roadExpansionBatchFourteen";
import { roadExpansionBatchFifteen } from "./roadExpansionBatchFifteen";
import { roadExpansionBatchSixteen } from "./roadExpansionBatchSixteen";
import { marineExpansionBatchNine } from "./marineExpansionBatchNine";
import { marineExpansionBatchTen } from "./marineExpansionBatchTen";
import { marineExpansionBatchEleven } from "./marineExpansionBatchEleven";
import { marineExpansionBatchTwelve } from "./marineExpansionBatchTwelve";
import { aerospaceExpansionBatchEight } from "./aerospaceExpansionBatchEight";
import { aerospaceExpansionBatchNine } from "./aerospaceExpansionBatchNine";
import { aerospaceExpansionBatchTen } from "./aerospaceExpansionBatchTen";
import { aerospaceExpansionBatchEleven } from "./aerospaceExpansionBatchEleven";
import { aerospaceExpansionBatchTwelve } from "./aerospaceExpansionBatchTwelve";
import { aerospaceExpansionBatchThirteen } from "./aerospaceExpansionBatchThirteen";
import { aerospaceExpansionBatchFourteen } from "./aerospaceExpansionBatchFourteen";
import { railExpansionBatchEight } from "./railExpansionBatchEight";
import { railExpansionBatchNine } from "./railExpansionBatchNine";
import { railExpansionBatchTen } from "./railExpansionBatchTen";
import { railExpansionBatchEleven } from "./railExpansionBatchEleven";
import { railExpansionBatchTwelve } from "./railExpansionBatchTwelve";
import { roadExpansionBatchSeventeen } from "./roadExpansionBatchSeventeen";
import { roadExpansionBatchEighteen } from "./roadExpansionBatchEighteen";
import { marineExpansionBatchThirteen } from "./marineExpansionBatchThirteen";
import { railExpansionBatchThirteen } from "./railExpansionBatchThirteen";
import { aerospaceExpansionBatchFifteen } from "./aerospaceExpansionBatchFifteen";
import { marineExpansionBatchFourteen } from "./marineExpansionBatchFourteen";
import { roadExpansionBatchNineteen } from "./roadExpansionBatchNineteen";
import { railExpansionBatchFourteen } from "./railExpansionBatchFourteen";
import { aerospaceExpansionBatchSixteen } from "./aerospaceExpansionBatchSixteen";
import { marineExpansionBatchFifteen } from "./marineExpansionBatchFifteen";
import { roadExpansionBatchTwenty } from "./roadExpansionBatchTwenty";
import { roadExpansionBatchTwentyOne } from "./roadExpansionBatchTwentyOne";
import { roadExpansionBatchTwentyTwo } from "./roadExpansionBatchTwentyTwo";
import { aerospaceExpansionBatchSeventeen } from "./aerospaceExpansionBatchSeventeen";
import { railExpansionBatchFifteen } from "./railExpansionBatchFifteen";
import { marineExpansionBatchSixteen } from "./marineExpansionBatchSixteen";
import { roadExpansionBatchTwentyThree } from "./roadExpansionBatchTwentyThree";
import { aerospaceExpansionBatchEighteen } from "./aerospaceExpansionBatchEighteen";
import { railExpansionBatchSixteen } from "./railExpansionBatchSixteen";
import { marineExpansionBatchSeventeen } from "./marineExpansionBatchSeventeen";
import { roadExpansionBatchTwentyFour } from "./roadExpansionBatchTwentyFour";
import { aerospaceExpansionBatchNineteen } from "./aerospaceExpansionBatchNineteen";
import { everydayCommercialVehicleBatchOne } from "./everydayCommercialVehicleBatchOne";
import { westernHorseCarriageBatchOne } from "./westernHorseCarriageBatchOne";
import { easternHorseCarriageBatchOne } from "./easternHorseCarriageBatchOne";
import { everydayPassengerVehicleBatchOne } from "./everydayPassengerVehicleBatchOne";
import { periodRoadVehicleBatchOne } from "./periodRoadVehicleBatchOne";
import { easternHorseCarriageBatchTwo } from "./easternHorseCarriageBatchTwo";
import { easternHorseCarriageBatchThree } from "./easternHorseCarriageBatchThree";
import { westernHorseCarriageBatchTwo } from "./westernHorseCarriageBatchTwo";
import { everydayPassengerVehicleBatchTwo } from "./everydayPassengerVehicleBatchTwo";
import { everydayPassengerVehicleBatchThree } from "./everydayPassengerVehicleBatchThree";
import { everydayPassengerVehicleBatchFour } from "./everydayPassengerVehicleBatchFour";
import { everydayPassengerVehicleBatchFive } from "./everydayPassengerVehicleBatchFive";
import { everydayPassengerVehicleBatchSix } from "./everydayPassengerVehicleBatchSix";
import { everydayCommercialVehicleBatchTwo } from "./everydayCommercialVehicleBatchTwo";
import { everydayCommercialVehicleBatchThree } from "./everydayCommercialVehicleBatchThree";
import { everydayCommercialVehicleBatchFour } from "./everydayCommercialVehicleBatchFour";
import { everydayCommercialVehicleBatchFive } from "./everydayCommercialVehicleBatchFive";
import { periodRoadVehicleBatchTwo } from "./periodRoadVehicleBatchTwo";
import { periodRoadVehicleBatchThree } from "./periodRoadVehicleBatchThree";
import { periodRoadVehicleBatchFour } from "./periodRoadVehicleBatchFour";
import { periodRoadVehicleBatchFive } from "./periodRoadVehicleBatchFive";
import { westernHorseCarriageBatchThree } from "./westernHorseCarriageBatchThree";
import { westernHorseCarriageBatchFour } from "./westernHorseCarriageBatchFour";
import { westernHorseCarriageBatchFive } from "./westernHorseCarriageBatchFive";
import { westernHorseCarriageBatchSix } from "./westernHorseCarriageBatchSix";
import { easternHorseCarriageBatchFour } from "./easternHorseCarriageBatchFour";
import { easternHorseCarriageBatchFive } from "./easternHorseCarriageBatchFive";
import { easternHorseCarriageBatchSix } from "./easternHorseCarriageBatchSix";
import { easternHorseCarriageBatchSeven } from "./easternHorseCarriageBatchSeven";
import { everydayPassengerVehicleBatchSeven } from "./everydayPassengerVehicleBatchSeven";
import { everydayCommercialVehicleBatchSix } from "./everydayCommercialVehicleBatchSix";
import { periodRoadVehicleBatchSix } from "./periodRoadVehicleBatchSix";
import { westernHorseCarriageBatchSeven } from "./westernHorseCarriageBatchSeven";
import { westernHorseCarriageBatchEight } from "./westernHorseCarriageBatchEight";
import { everydayCommercialVehicleBatchSeven } from "./everydayCommercialVehicleBatchSeven";
import { periodRoadVehicleBatchSeven } from "./periodRoadVehicleBatchSeven";
import { roadExpansionBatchTwentySeven } from "./roadExpansionBatchTwentySeven";
import { roadExpansionBatchTwentyFive } from "./roadExpansionBatchTwentyFive";
import { roadExpansionBatchTwentySix } from "./roadExpansionBatchTwentySix";
import { railPassengerBatchOne } from "./railPassengerBatchOne";
import { railFreightBatchOne } from "./railFreightBatchOne";
import { railLocomotiveBatchOne } from "./railLocomotiveBatchOne";
import { railExpansionBatchNineteen } from "./railExpansionBatchNineteen";
import { roadExpansionBatchTwentyEight } from "./roadExpansionBatchTwentyEight";
import { roadExpansionBatchTwentyNine } from "./roadExpansionBatchTwentyNine";
import { railExpansionBatchSeventeen } from "./railExpansionBatchSeventeen";
import { railExpansionBatchEighteen } from "./railExpansionBatchEighteen";
import { railExpansionBatchTwenty } from "./railExpansionBatchTwenty";
import { aerospaceExpansionBatchTwenty } from "./aerospaceExpansionBatchTwenty";
import { aerospaceExpansionBatchTwentyThree } from "./aerospaceExpansionBatchTwentyThree";
import { marineExpansionBatchEighteen } from "./marineExpansionBatchEighteen";
import { marineExpansionBatchNineteen } from "./marineExpansionBatchNineteen";
import { transportScales } from "./measurements";

const definitions = [
  ...cycleModels, ...railModels, ...marineModels, ...aircraftModels,
  ...airportModels, ...utilityModels, ...spaceModels, ...farmModels,
  ...constructionModels, ...siegeModels, ...waterSportModels, ...serviceModels,
  ...advancedAirModels, ...advancedSpaceModels, ...merchantModels, ...leisureModels,
  ...historicShipModels, ...robotModels, ...specialRailModels, ...workShipModels,
  ...mobileRobotModels, ...roadFleetModels, ...specialistMachineModels, ...travelVehicleModels,
  ...rootCropMachineModels, ...navalShipModels, ...tillageModels, ...towingMachineModels,
  ...rotorLayoutModels,
  ...mainlineRailModels,
  ...inspectionRobotModels,
  ...dailyMobilityModels,
  ...iceRacingModels,
  ...linkageWalkerModels,
  ...fieldCareModels,
  ...experimentalAirModels,
  ...divingCapsuleModels,
  ...passengerShipModels,
  ...offshorePlatformModels,
  ...assistedMobilityModels,
  ...iceSailModels,
  ...subseaWorkModels,
  ...miningVehicleModels,
  ...compactionToolModels,
  ...marineEquipmentModels,
  ...liftingAttachmentModels,
  ...harborFittingModels,
  ...roadSafetyModels,
  ...vehicleWorkshopModels,
  ...lightMobilityModels,
  ...vehicleComponentModels,
  ...shipControlModels,
  ...emergencyEquipmentModels,
  ...forestMachineModels,
  ...excavatorAttachmentModels,
  ...urbanCartModels,
  ...fieldUtilityModels,
  ...airfieldServiceModels,
  ...aeroEngineModels,
  ...smallMarineDriveModels,
  ...landscapePowerModels,
  ...concreteToolModels,
  ...woodshopPowerModels,
  ...railExpansionBatchOne,
  ...aerospaceExpansionBatchOne,
  ...marineExpansionBatchOne,
  ...roadExpansionBatchOne,
  ...roadExpansionBatchTwo,
  ...railExpansionBatchTwo,
  ...aerospaceExpansionBatchTwo,
  ...roadExpansionBatchThree,
  ...marineExpansionBatchTwo,
  ...railExpansionBatchThree,
  ...roadExpansionBatchFour,
  ...marineExpansionBatchThree,
  ...aerospaceExpansionBatchThree,
  ...roadExpansionBatchFive,
  ...roadExpansionBatchSix,
  ...roadExpansionBatchSeven,
  ...roadExpansionBatchEight,
  ...roadExpansionBatchNine,
  ...marineExpansionBatchFour,
  ...marineExpansionBatchFive,
  ...marineExpansionBatchSix,
  ...marineExpansionBatchSeven,
  ...marineExpansionBatchEight,
  ...aerospaceExpansionBatchFour,
  ...aerospaceExpansionBatchFive,
  ...aerospaceExpansionBatchSix,
  ...aerospaceExpansionBatchSeven,
  ...railExpansionBatchFour,
  ...railExpansionBatchFive,
  ...railExpansionBatchSix,
  ...railExpansionBatchSeven,
  ...roadExpansionBatchTen,
  ...roadExpansionBatchEleven,
  ...roadExpansionBatchTwelve,
  ...roadExpansionBatchThirteen,
  ...roadExpansionBatchFourteen,
  ...roadExpansionBatchFifteen,
  ...roadExpansionBatchSixteen,
  ...marineExpansionBatchNine,
  ...marineExpansionBatchTen,
  ...marineExpansionBatchEleven,
  ...marineExpansionBatchTwelve,
  ...aerospaceExpansionBatchEight,
  ...aerospaceExpansionBatchNine,
  ...aerospaceExpansionBatchTen,
  ...aerospaceExpansionBatchEleven,
  ...aerospaceExpansionBatchTwelve,
  ...aerospaceExpansionBatchThirteen,
  ...aerospaceExpansionBatchFourteen,
  ...railExpansionBatchEight,
  ...railExpansionBatchNine,
  ...railExpansionBatchTen,
  ...railExpansionBatchEleven,
  ...railExpansionBatchTwelve,
  ...roadExpansionBatchSeventeen,
  ...roadExpansionBatchEighteen,
  ...marineExpansionBatchThirteen,
  ...railExpansionBatchThirteen,
  ...aerospaceExpansionBatchFifteen,
  ...marineExpansionBatchFourteen,
  ...roadExpansionBatchNineteen,
  ...railExpansionBatchFourteen,
  ...aerospaceExpansionBatchSixteen,
  ...marineExpansionBatchFifteen,
  ...roadExpansionBatchTwenty,
  ...roadExpansionBatchTwentyOne,
  ...roadExpansionBatchTwentyTwo,
  ...aerospaceExpansionBatchSeventeen,
  ...railExpansionBatchFifteen,
  ...marineExpansionBatchSixteen,
  ...roadExpansionBatchTwentyThree,
  ...aerospaceExpansionBatchEighteen,
  ...railExpansionBatchSixteen,
  ...marineExpansionBatchSeventeen,
  ...roadExpansionBatchTwentyFour,
  ...aerospaceExpansionBatchNineteen,
  ...everydayCommercialVehicleBatchOne,
  ...westernHorseCarriageBatchOne,
  ...easternHorseCarriageBatchOne,
  ...everydayPassengerVehicleBatchOne,
  ...periodRoadVehicleBatchOne,
  ...easternHorseCarriageBatchTwo,
  ...easternHorseCarriageBatchThree,
  ...westernHorseCarriageBatchTwo,
  ...everydayPassengerVehicleBatchTwo,
  ...everydayPassengerVehicleBatchThree,
  ...everydayPassengerVehicleBatchFour,
  ...everydayPassengerVehicleBatchFive,
  ...everydayPassengerVehicleBatchSix,
  ...everydayCommercialVehicleBatchTwo,
  ...everydayCommercialVehicleBatchThree,
  ...everydayCommercialVehicleBatchFour,
  ...everydayCommercialVehicleBatchFive,
  ...periodRoadVehicleBatchTwo,
  ...periodRoadVehicleBatchThree,
  ...periodRoadVehicleBatchFour,
  ...periodRoadVehicleBatchFive,
  ...westernHorseCarriageBatchThree,
  ...westernHorseCarriageBatchFour,
  ...westernHorseCarriageBatchFive,
  ...westernHorseCarriageBatchSix,
  ...easternHorseCarriageBatchFour,
  ...easternHorseCarriageBatchFive,
  ...easternHorseCarriageBatchSix,
  ...easternHorseCarriageBatchSeven,
  ...everydayPassengerVehicleBatchSeven,
  ...everydayCommercialVehicleBatchSix,
  ...periodRoadVehicleBatchSix,
  ...westernHorseCarriageBatchSeven,
  ...westernHorseCarriageBatchEight,
  ...everydayCommercialVehicleBatchSeven,
  ...periodRoadVehicleBatchSeven,
  ...roadExpansionBatchTwentySeven,
  ...roadExpansionBatchTwentyEight,
  ...roadExpansionBatchTwentyNine,
  ...railExpansionBatchSeventeen,
  ...railExpansionBatchEighteen,
  ...railExpansionBatchTwenty,
  aerospaceExpansionBatchTwenty[0]!,
  aerospaceExpansionBatchTwentyThree[0]!,
  marineExpansionBatchEighteen[0]!,
  marineExpansionBatchNineteen[1]!,
  ...roadExpansionBatchTwentyFive,
  ...roadExpansionBatchTwentySix,
  ...railPassengerBatchOne,
  ...railFreightBatchOne,
  ...railLocomotiveBatchOne,
  railExpansionBatchNineteen[0]!,
];

// 只登记具名交通原型；相同物体的轮数、舱位、颜色或损坏状态不在此产生主条目。
export const masterTransportAssets: SceneAsset[] = definitions.map((definition, design) => ({
  id: `masterTransport${String(design).padStart(4, "0")}`, name: definition.name,
  category: "道具", itemType: definition.itemType ?? "交通", kind: "model", normalize: false, state: "原始",
  license: "内置原创程序化模型", tags: ["本地原创", ...(definition.tags ?? [])],
  ...(definition.theme ? { theme: definition.theme } : {}), blueprint: { pack: "masterTransport", design, revision: 1 },
}));

export function createMasterTransportModel(design: number) {
  const definition = definitions[design];
  if (!Number.isInteger(design) || !definition) throw new Error("交通原型编号不存在");
  const parts = definition.create(), factor = transportScales[definition.name] ?? 1;
  if (factor !== 1) for (const part of parts) for (const axis of ["x", "y", "z"] as const) { part.position[axis] *= factor; part.scale[axis] *= factor; }
  return finishObjectModel(definition.name, parts);
}
