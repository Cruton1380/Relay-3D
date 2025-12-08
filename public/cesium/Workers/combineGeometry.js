/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.132
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

import {
  PrimitivePipeline_default
} from "./chunk-ZQ6LUBXB.js";
import {
  createTaskProcessorWorker_default
} from "./chunk-ARXKE2CP.js";
import "./chunk-CQFHLFIN.js";
import "./chunk-IBRWXB34.js";
import "./chunk-TL4AIR67.js";
import "./chunk-SNUSQZ7F.js";
import "./chunk-XJ5LGIAS.js";
import "./chunk-2RH5HN6Q.js";
import "./chunk-PR2PC3PD.js";
import "./chunk-HORW2JEU.js";
import "./chunk-5VDBM4LO.js";
import "./chunk-CT4DB7WX.js";
import "./chunk-WRAVANZ7.js";
import "./chunk-D4NVDZ57.js";
import "./chunk-7K543I2K.js";
import "./chunk-6HPQIHI4.js";
import "./chunk-BKBWMP63.js";
import "./chunk-WGYA4ZXO.js";
import "./chunk-THVPMEIK.js";
import "./chunk-N54H3GSD.js";

// packages/engine/Source/Workers/combineGeometry.js
function combineGeometry(packedParameters, transferableObjects) {
  const parameters = PrimitivePipeline_default.unpackCombineGeometryParameters(packedParameters);
  const results = PrimitivePipeline_default.combineGeometry(parameters);
  return PrimitivePipeline_default.packCombineGeometryResults(
    results,
    transferableObjects
  );
}
var combineGeometry_default = createTaskProcessorWorker_default(combineGeometry);
export {
  combineGeometry_default as default
};
