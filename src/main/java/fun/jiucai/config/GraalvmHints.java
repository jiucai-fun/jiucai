/*
 * Copyright (C) 2020 The zfoo Authors
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

package fun.jiucai.config;

import com.zfoo.boot.graalvm.GraalvmOrmHints;
import fun.jiucai.model.VersionConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aot.hint.BindingReflectionHintsRegistrar;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

import java.util.ArrayList;

/**
 * Register runtime hints for the token library
 *
 * @author godotg
 */
public class GraalvmHints implements RuntimeHintsRegistrar {

    private static final Logger logger = LoggerFactory.getLogger(GraalvmOrmHints.class);

    private final BindingReflectionHintsRegistrar bindingRegistrar = new BindingReflectionHintsRegistrar();

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        logger.info("Hint of orm for spring aot runtime register in graalvm");

        var classes = new ArrayList<Class<?>>();
        classes.add(VersionConfig.class);

        for (var clazz : classes) {
            this.bindingRegistrar.registerReflectionHints(hints.reflection(), clazz);
            logger.info("graalvm aot hints register serialization [{}]", clazz);
        }
    }
}