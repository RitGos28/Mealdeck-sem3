package com.mealdeck.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.AbstractSubscribableChannel;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.test.context.ActiveProfiles;

/** Runs the real client-inbound channel's interceptors on hand-built STOMP
 * frames instead of opening a socket: deterministic, and enough to prove a
 * browser can't publish a fake queue to other subscribers. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
class WebSocketConfigTests {

    @Autowired
    @Qualifier("clientInboundChannel")
    AbstractSubscribableChannel clientInbound;

    private static Message<byte[]> frame(StompCommand command) {
        StompHeaderAccessor headers = StompHeaderAccessor.create(command);
        headers.setDestination("/topic/stalls/1/queue");
        headers.setSessionId("test-session");
        headers.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
    }

    private Message<?> intercept(Message<?> message) {
        for (ChannelInterceptor interceptor : clientInbound.getInterceptors()) {
            message = interceptor.preSend(message, clientInbound);
        }
        return message;
    }

    @Test
    void clientsCantSendToTopics() {
        assertThatThrownBy(() -> intercept(frame(StompCommand.SEND)))
                .isInstanceOf(MessageDeliveryException.class)
                .hasMessageContaining("read-only");
    }

    @Test
    void clientsCanStillSubscribe() {
        Message<byte[]> subscribe = frame(StompCommand.SUBSCRIBE);
        assertThat(intercept(subscribe)).isSameAs(subscribe);
    }
}
