package com.mealdeck.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/** STOMP over a plain WebSocket at /api/ws, under /api so nginx's existing
 * backend route carries it. Browsers only ever SUBSCRIBE to
 * /topic/stalls/{id}/queue; the server is the only publisher. */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String[] allowedOrigins;

    public WebSocketConfig(@Value("${mealdeck.ws.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws").setAllowedOriginPatterns(allowedOrigins);
    }

    /** Heartbeats both ways every 10s. An idle socket otherwise goes
     * silent, and Cloudflare closes connections with no traffic for ~100s;
     * the simple broker only sends them when given a scheduler. */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        ThreadPoolTaskScheduler heartbeats = new ThreadPoolTaskScheduler();
        heartbeats.setThreadNamePrefix("ws-heartbeat-");
        heartbeats.initialize();
        registry.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[] {10_000, 10_000})
                .setTaskScheduler(heartbeats);
    }

    /** The simple broker would otherwise relay a client's SEND straight to
     * every subscriber of that topic, letting anyone push a fake queue. */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                if (StompCommand.SEND.equals(StompHeaderAccessor.wrap(message).getCommand())) {
                    throw new MessageDeliveryException("This socket is read-only");
                }
                return message;
            }
        });
    }
}
