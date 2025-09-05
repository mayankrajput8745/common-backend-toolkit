// kafka-wrapper.ts
import { Kafka, KafkaConfig, Producer, Consumer, ProducerConfig, ConsumerConfig, logLevel } from 'kafkajs';

export class KafkaWrapper {
  private kafka?: Kafka;
  private producer?: Producer;
  private consumer?: Consumer;

  /**
   * Connects producer and/or consumer with given configs
   * Pass full KafkaConfig including SSL/SASL for production security
   */
  async connect(
    kafkaConfig: KafkaConfig,
    producerConfig?: ProducerConfig,
    consumerConfig?: ConsumerConfig
  ) {
    this.kafka = new Kafka({
      ...kafkaConfig,
      logLevel: logLevel.INFO,
    });

    if (producerConfig) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        idempotent: true,
        ...producerConfig,
      });
      await this.producer.connect();
      console.log('[Kafka] Producer connected');
    }

    if (consumerConfig) {
      this.consumer = this.kafka.consumer(consumerConfig);
      await this.consumer.connect();
      console.log('[Kafka] Consumer connected');
    }
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      console.log('[Kafka] Producer disconnected');
    }
    if (this.consumer) {
      await this.consumer.disconnect();
      console.log('[Kafka] Consumer disconnected');
    }
  }

  getProducer(): Producer {
    if (!this.producer) throw new Error('Producer not initialized. Call connect() first.');
    return this.producer;
  }

  getConsumer(): Consumer {
    if (!this.consumer) throw new Error('Consumer not initialized. Call connect() first.');
    return this.consumer;
  }
}
