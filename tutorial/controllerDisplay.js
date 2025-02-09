var VISIBLE_BY_DEFAULT = false;
var PARENT_ID = "{00000000-0000-0000-0000-000000000001}";

var DEBUG = false;
function debug() {
    if (DEBUG) {
        print.apply(self, arguments);
    }
}

createControllerDisplay = function(config) {
    var controllerDisplay = {
        overlays: [],
        partOverlays: {
        },
        parts: {
        },
        mappingName: "mapping-display",

        setVisible: function(visible) {
            print("CONTROLLER_DISPLAY::Setting visible", this.overlays.length);
            for (var i = 0; i < this.overlays.length; ++i) {
                print("i", i, this.overlays[i]);
                Overlays.editOverlay(this.overlays[i], {
                    visible: visible
                });
            }
        },

        setPartVisible: function(partName, visible) {
            return;
            if (partName in this.partOverlays) {
                debug("Setting part visible", partName, visible);
                for (var i = 0; i < this.partOverlays[partName].length; ++i) {
                    Overlays.editOverlay(this.partOverlays[partName][i], {
                        //visible: visible
                    });
                }
            }
        },

        setLayerForPart: function(partName, layerName) {
            if (partName in this.parts) {
                debug("Setting layer...", partName, layerName);
                var part = this.parts[partName];
                if (part.textureLayers && layerName in part.textureLayers) {
                    var layer = part.textureLayers[layerName];
                    var textures = {};
                    if (layer.defaultTextureURL) {
                        textures[part.textureName] = layer.defaultTextureURL;
                    }
                    for (var i = 0; i < this.partOverlays[partName].length; ++i) {
                        Overlays.editOverlay(this.partOverlays[partName][i], {
                            textures: textures
                        });
                    }
                }
            }
        }
    };
    var mapping = Controller.newMapping(controllerDisplay.mappingName);
    for (var i = 0; i < config.controllers.length; ++i) {
        var controller = config.controllers[i];
        var position = controller.position;

        if (controller.naturalPosition) {
            position = Vec3.sum(Vec3.multiplyQbyV(
                        controller.rotation, controller.naturalPosition), position);
        }

        var overlayID = Overlays.addOverlay("model", {
            url: controller.modelURL,
            dimensions: controller.dimensions,
            localRotation: controller.rotation,
            localPosition: position,
            parentID: PARENT_ID,
            parentJointIndex: controller.jointIndex,
            ignoreRayIntersection: true,
        });

        controllerDisplay.overlays.push(overlayID);
        overlayID = null;

        function clamp(value, min, max) {
            if (value < min) {
                return min;
            } else if (value > max) {
                return max
            }
            return value;
        }

        if (controller.parts) {
            for (var partName in controller.parts) {
                var part = controller.parts[partName];
                var partPosition = Vec3.sum(controller.position, Vec3.multiplyQbyV(controller.rotation, part.naturalPosition));
                var innerRotation = controller.rotation

                controllerDisplay.parts[partName] = controller.parts[partName];

                var properties = {
                    url: part.modelURL,
                    localPosition: partPosition,
                    localRotation: innerRotation,
                    parentID: PARENT_ID,
                    parentJointIndex: controller.jointIndex,
                    ignoreRayIntersection: true,
                };

                if (part.defaultTextureLayer) {
                    var textures = {};
                    textures[part.textureName] = part.textureLayers[part.defaultTextureLayer].defaultTextureURL;
                    properties['textures'] = textures;
                }

                var overlayID = Overlays.addOverlay("model", properties);

                if (part.type == "rotational") {
                    var range = part.maxValue - part.minValue;
                    mapping.from([part.input]).peek().to(function(controller, overlayID, part) {
                        return function(value) {
                            value = clamp(value, part.minValue, part.maxValue);

                            var pct = (value - part.minValue) / part.maxValue;
                            var angle = pct * part.maxAngle;
                            var rotation = Quat.angleAxis(angle, part.axis);

                            var offset = { x: 0, y: 0, z: 0 };
                            if (part.origin) {
                                var offset = Vec3.multiplyQbyV(rotation, part.origin);
                                offset = Vec3.subtract(offset, part.origin);
                            }

                            var partPosition = Vec3.sum(controller.position,
                                    Vec3.multiplyQbyV(controller.rotation, Vec3.sum(offset, part.naturalPosition)));

                            Overlays.editOverlay(overlayID, {
                                localPosition: partPosition,
                                localRotation: Quat.multiply(controller.rotation, rotation)
                            });
                        }
                    }(controller, overlayID, part));
                } else if (part.type == "touchpad") {
                    function resolveHardware(path) {
                        var parts = path.split(".");
                        function resolveInner(base, path, i) {
                            if (i >= path.length) {
                                return base;
                            }
                            return resolveInner(base[path[i]], path, ++i);
                        }
                        return resolveInner(Controller.Hardware, parts, 0);
                    }

                    var visibleInput = resolveHardware(part.visibleInput);
                    var xinput = resolveHardware(part.xInput);
                    var yinput = resolveHardware(part.yInput);

                    // TODO: Touchpad inputs are currently only working for half
                    // of the touchpad. When that is fixed, it would be useful
                    // to update these to display the current finger position.
                    mapping.from([visibleInput]).peek().to(function(value) {
                    });
                    mapping.from([xinput]).peek().to(function(value) {
                    });
                    mapping.from([yinput]).peek().invert().to(function(value) {
                    });
                } else if (part.type == "static") {
                } else {
                    print("TYPE NOT SUPPORTED: ", part.type);
                }

                controllerDisplay.overlays.push(overlayID);
                if (!(partName in controllerDisplay.partOverlays)) {
                    controllerDisplay.partOverlays[partName] = [];
                }
                controllerDisplay.partOverlays[partName].push(overlayID);
            }
        }
    }
    Controller.enableMapping(controllerDisplay.mappingName);
    return controllerDisplay;
}

ControllerDisplay = function() {
};

deleteControllerDisplay = function(controllerDisplay) {
    print("Deleting controller display");
    for (var i = 0; i < controllerDisplay.overlays.length; ++i) {
        Overlays.deleteOverlay(controllerDisplay.overlays[i]);
    }
    Controller.disableMapping(controllerDisplay.mappingName);
}

