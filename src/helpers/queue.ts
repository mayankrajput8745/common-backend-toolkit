import Bull, { Queue, QueueOptions } from 'bull';

const queues = new Map();

export const getQueue = (queueName: string, options?: QueueOptions) => {
  let queue = queues.get(queueName);

  if (!queue) {
    queue = new Bull(queueName, options);
    queues.set(queueName, queue);
  }

  return queue;
};

export const getAllQueues = () => {
  return queues;
};

export const removeQueue = async (queueName: string): Promise<string> => {
  const queue = queues.get(queueName);

  if (!queue) return 'No Queue Found';

  await queue.empty();
  await queue.obliterate({ force: true });
  queues.delete(queueName);

  return 'Queue removed successfully';
};
