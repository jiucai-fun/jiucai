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

package fun.jiucai.controller;

import com.zfoo.event.anno.EventReceiver;
import com.zfoo.net.NetContext;
import com.zfoo.net.anno.PacketReceiver;
import com.zfoo.net.anno.Task;
import com.zfoo.net.core.event.ServerSessionInactiveEvent;
import com.zfoo.net.packet.common.Ping;
import com.zfoo.net.packet.common.Pong;
import com.zfoo.net.session.Session;
import com.zfoo.protocol.util.FileUtils;
import com.zfoo.protocol.util.StringUtils;
import com.zfoo.scheduler.util.TimeUtils;
import fun.jiucai.packet.ChatBotRegisterRequest;
import fun.jiucai.packet.ChatBotRegisterResponse;
import fun.jiucai.packet.ChatBotRequest;
import fun.jiucai.service.ChatBotService;
import fun.jiucai.service.SimulatorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @author godotg
 */
@Slf4j
@Component
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;
    @Autowired
    private SimulatorService simulatorService;

    @PacketReceiver(Task.NettyIO)
    public void atPing(Session session, Ping ping) {
        NetContext.getRouter().send(session, Pong.valueOf(TimeUtils.now()));
    }

    @PacketReceiver
    public void atChatBotRequest(Session session, ChatBotRequest request) {
        var sid = session.getSid();
        var requestId = request.getRequestId();
        var messages = request.getMessages();
        log.info("atChatBotRequest sid:[{}] requestId:[{}] message:{}", sid, requestId, messages);
        var question = messages.get(messages.size() - 1);
        if (StringUtils.isBlank(question)) {
            throw new RuntimeException("question is blank");
        }
        simulatorService.sendToSimulators(requestId, question);
    }


    @PacketReceiver
    public void atChatBotRegisterRequest(Session session, ChatBotRegisterRequest request) {
        chatBotService.chatBotSessions.add(session.getSid());
        log.info("atChatBotRegisterRequest chatBot 已连接 [sid:{}]", session.getSid());
        NetContext.getRouter().send(session, new ChatBotRegisterResponse());

        chatBotService.sendToChatBot("zfoo", simulatorService.readme);
        chatBotService.sendToChatBot("zfoo", "```" + FileUtils.LS + simulatorService.aiConfig + FileUtils.LS + "```");
    }

    @EventReceiver
    public void onServerSessionInactiveEvent(ServerSessionInactiveEvent event) {
        chatBotService.chatBotSessions.remove(event.getSession().getSid());
    }
}
