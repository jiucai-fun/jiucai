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

package fun.jiucai.service;

import com.zfoo.net.NetContext;
import com.zfoo.protocol.collection.concurrent.ConcurrentHashSet;
import com.zfoo.protocol.util.StringUtils;
import fun.jiucai.packet.ChatBotNotice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * @author godotg
 */
@Slf4j
@Component
public class ChatBotService {


    public ConcurrentHashSet<Long> chatBotSessions = new ConcurrentHashSet<>();

    private AtomicLong atomicRequestId = new AtomicLong(-10_0000);
    public void sendToChatBot(String simulator, String message) {
        var requestId = atomicRequestId.incrementAndGet();
        sendToChatBot(requestId, simulator, message);
    }

    public void sendToChatBot(long requestId, String simulator, String message) {
        var simulatorRequestId = Long.parseLong(StringUtils.format("{}{}", requestId, simulatorId(simulator)));
        var notice = new ChatBotNotice(simulatorRequestId, simulator, message);
        for (var sid : chatBotSessions) {
            var session = NetContext.getSessionManager().getServerSession(sid);
            NetContext.getRouter().send(session, notice, null);
        }
    }

    // -----------------------------------------------------------------------------------------------------------------
    private ConcurrentMap<String, Integer> simulatorIdMap = new ConcurrentHashMap<>();
    private AtomicInteger simulatorIdAtomic = new AtomicInteger(10000);

    public int simulatorId(String simulator) {
        return simulatorIdMap.computeIfAbsent(simulator, it -> simulatorIdAtomic.incrementAndGet());
    }

}
