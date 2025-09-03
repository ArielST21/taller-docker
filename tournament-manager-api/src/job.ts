// Importaciones

import { Kafka } from 'kafkajs';

// Configuración de Kafka
const kafka = new Kafka({
    clientId: 'job',
    brokers: ['kafka:9092'],
});

// Consumidor de Kafka
const consumidor = kafka.consumer({ groupId: 'job-group' });

// Función principal para consumir e imprimir los mensajes encolados
const ejecutar = async () => {
    await consumidor.connect();
    await consumidor.subscribe({ topic: 'tournament-manager', fromBeginning: true });

    await consumidor.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('Mensaje recibido de Kafka:');
            console.log('Tópico:', topic);
            console.log('Partición:', partition);
            console.log('Offset:', message.offset);
            console.log('Valor:', message.value?.toString())
        },
    });
};

ejecutar().catch(console.error);
