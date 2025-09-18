import { Kafka, Producer, Consumer, EachMessagePayload, KafkaConfig, Partitioners } from 'kafkajs';

interface KafkaWrapperConfig extends KafkaConfig {
  enableConsumer?: boolean;
  consumerGroupId?: string;
}

export class KafkaWrapper {
  private kafka!: Kafka;
  private producer!: Producer;
  private consumer?: Consumer;
  private producerConnected = false;
  private consumerConnected = false;

  async connect(config: KafkaWrapperConfig) {
    if (this.producerConnected) {
      return; // already connected
    }

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      createPartitioner: Partitioners.DefaultPartitioner,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        factor: 2,
        maxRetryTime: 30000,
      },
    });

    await this.producer.connect();
    this.producerConnected = true;

    if (config.enableConsumer && config.consumerGroupId) {
      this.consumer = this.kafka.consumer({ groupId: config.consumerGroupId });
      await this.consumer.connect();
      this.consumerConnected = true;
    }
  }

  async sendMessage(topic: string, message: any, key?: string) {
    if (!this.producerConnected) {
      throw new Error('Kafka producer not connected. Call connect() first.');
    }
    const value = typeof message === 'string' ? message : JSON.stringify(message);
    await this.producer.send({ topic, messages: [{ key, value }] });
  }

  async subscribe(topic: string, onMessage: (payload: EachMessagePayload) => Promise<void>) {
    if (!this.consumer) {
      throw new Error('Kafka consumer not initialized. Enable in connect() config.');
    }
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          await onMessage(payload);
        } catch (err) {
          console.error(`Error processing ${payload.topic}:`, err);
        }
      },
    });
  }

  async disconnect() {
    if (this.producerConnected) {
      await this.producer.disconnect();
      this.producerConnected = false;
    }
    if (this.consumerConnected && this.consumer) {
      await this.consumer.disconnect();
      this.consumerConnected = false;
    }
  }

  isConnected() {
    return this.producerConnected;
  }
}

export default new KafkaWrapper();
