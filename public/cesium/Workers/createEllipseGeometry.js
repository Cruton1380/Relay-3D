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
  EllipseGeometry_default
} from "./chunk-FDQDFQGG.js";
import "./chunk-5Y7BDMW5.js";
import "./chunk-DGTWJ5YY.js";
import "./chunk-IBRWXB34.js";
import "./chunk-TL4AIR67.js";
import "./chunk-SNUSQZ7F.js";
import "./chunk-KUCOVRZC.js";
import "./chunk-A3KRKQJJ.js";
import "./chunk-XJ5LGIAS.js";
import "./chunk-2RH5HN6Q.js";
import "./chunk-PR2PC3PD.js";
import "./chunk-HORW2JEU.js";
import "./chunk-5VDBM4LO.js";
import "./chunk-CT4DB7WX.js";
import "./chunk-WRAVANZ7.js";
import "./chunk-D4NVDZ57.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-7K543I2K.js";
import "./chunk-6HPQIHI4.js";
import "./chunk-BKBWMP63.js";
import "./chunk-WGYA4ZXO.js";
import "./chunk-THVPMEIK.js";
import {
  defined_default
} from "./chunk-N54H3GSD.js";

// packages/engine/Source/Workers/createEllipseGeometry.js
function createEllipseGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseGeometry_default = createEllipseGeometry;
export {
  createEllipseGeometry_default as default
};
