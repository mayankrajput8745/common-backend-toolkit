import Bull, { QueueOptions, Queue } from 'bull';

const queues: Map<string, Queue> = new Map();

export const getQueue = (queueName: string, options?: QueueOptions): Queue => {
    if (!queues.has(queueName)) {
        const queue = new Bull(queueName, options);
        queues.set(queueName, queue);
    }
    return queues.get(queueName) as Queue;
};

export const getAllQueues = (): Map<string, Queue> => queues;

export const removeQueue = async (queueName: string): Promise<string> => {
    const queue = queues.get(queueName);
    if (!queue) return "No Queue Found";

    await queue.empty();
    await queue.obliterate({ force: true });
    queues.delete(queueName);
    return "Queue removed successfully";
};
