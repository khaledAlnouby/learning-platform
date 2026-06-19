package com.example.enrollmentservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE    = "enrollment.events.queue";
    public static final String EXCHANGE = "enrollment.events.exchange";
    public static final String ROUTING_KEY = "enrollment.event";

    @Bean
    public Queue enrollmentQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    public DirectExchange enrollmentExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean
    public Binding enrollmentBinding(Queue enrollmentQueue, DirectExchange enrollmentExchange) {
        return BindingBuilder.bind(enrollmentQueue).to(enrollmentExchange).with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
