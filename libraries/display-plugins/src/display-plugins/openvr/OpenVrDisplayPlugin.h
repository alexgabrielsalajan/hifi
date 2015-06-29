//
//  Created by Bradley Austin Davis on 2015/06/12
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#pragma once

#include "../MainWindowOpenGLDisplayPlugin.h"

class OpenVrDisplayPlugin : public MainWindowOpenGLDisplayPlugin {
public:
    virtual bool isSupported() const override;
    virtual const QString & getName() const override;
    virtual bool isHmd() const override { return true; }

    virtual void activate(PluginContainer * container) override;
    virtual void deactivate() override;

    virtual glm::uvec2 getRecommendedRenderSize() const override;
    virtual glm::uvec2 getRecommendedUiSize() const override { return uvec2(1920, 1080); }

    // Stereo specific methods
    virtual glm::mat4 getProjection(Eye eye, const glm::mat4& baseProjection) const override;
    virtual glm::mat4 getModelview(Eye eye, const glm::mat4& baseModelview) const override;
    virtual void resetSensors() override;

    virtual glm::mat4 getEyePose(Eye eye) const override;
    virtual glm::mat4 getHeadPose() const override;

protected:
    virtual void display(GLuint finalTexture, const glm::uvec2& sceneSize) override;
    virtual void customizeContext(PluginContainer * container) override;
    // Do not perform swap in finish
    virtual void finishFrame() override;

private:
    static const QString NAME;
};
